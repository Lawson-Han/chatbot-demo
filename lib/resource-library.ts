export type ResourceRecord = {
  id: string;
  name: string;
  size: number;
  createdAt: number;
  archivedAt?: number | null;
  content: string;
  segments?: string[];
  readingPosition?: number; // Current segment index (0-based)
};

export type ResourceSummary = Pick<
  ResourceRecord,
  "id" | "name" | "size" | "createdAt"
> & {
  segmentCount: number;
  readingPosition: number;
};

const DB_NAME = "resource-library";
const STORE_NAME = "resources";
const DB_VERSION = 1;
const LIBRARY_EVENT = "resource-library-updated";
const PLAIN_TEXT_EXTENSION = ".txt";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const SEGMENT_SIZE = 5000; // 5000 characters per segment

export const RESOURCE_CONFIG = {
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  segmentSize: SEGMENT_SIZE,
} as const;

const canUseIndexedDb = () =>
  typeof window !== "undefined" && "indexedDB" in window;

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });

const txDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed."));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted."));
  });

let dbPromise: Promise<IDBDatabase> | null = null;

const openResourceDb = () => {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error("IndexedDB is unavailable."));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to open IndexedDB."));
    });
  }

  return dbPromise;
};

const notifyLibraryUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LIBRARY_EVENT));
};

const normalizeResourceName = (fileName: string) => {
  const trimmed = fileName.trim();
  if (!trimmed) return "Untitled resource";
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0) return trimmed;
  return trimmed.slice(0, lastDot);
};

const createResourceId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `resource-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const isResourceFile = (file: File) => {
  const name = file.name.toLowerCase();
  return name.endsWith(PLAIN_TEXT_EXTENSION);
};

export const validateResourceFile = (
  file: File
): { valid: boolean; error?: string } => {
  if (!isResourceFile(file)) {
    return { valid: false, error: "Only plain text resources are supported." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const maxSizeMB = MAX_FILE_SIZE_BYTES / 1024 / 1024;
    return {
      valid: false,
      error: `File size exceeds limit (max ${maxSizeMB}MB).`,
    };
  }
  return { valid: true };
};

/**
 * Asynchronously segment content into chunks of specified size.
 * Uses setTimeout batching to avoid blocking the main thread for large files.
 */
export const segmentContent = async (
  content: string,
  segmentSize: number = SEGMENT_SIZE
): Promise<string[]> => {
  const segments: string[] = [];
  const totalLength = content.length;

  // For small content, process synchronously
  if (totalLength <= segmentSize * 10) {
    let position = 0;
    while (position < totalLength) {
      segments.push(content.slice(position, position + segmentSize));
      position += segmentSize;
    }
    return segments;
  }

  // For larger content, use batched async processing
  return new Promise((resolve) => {
    let position = 0;
    const batchSize = segmentSize * 100; // Process 100 segments per batch

    const processBatch = () => {
      const batchEnd = Math.min(position + batchSize, totalLength);

      while (position < batchEnd) {
        segments.push(content.slice(position, position + segmentSize));
        position += segmentSize;
      }

      if (position < totalLength) {
        // Yield to main thread between batches
        setTimeout(processBatch, 0);
      } else {
        resolve(segments);
      }
    };

    processBatch();
  });
};

export const saveResourceFile = async (file: File) => {
  let content: string;
  try {
    const buffer = await file.arrayBuffer();
    // Try UTF-8 first with fatal error to detect encoding issues
    const decoder = new TextDecoder("utf-8", { fatal: true });
    content = decoder.decode(buffer);
  } catch (e) {
    // Fallback to GB18030 (superset of GBK) for Chinese content
    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder("gb18030", { fatal: true });
      content = decoder.decode(buffer);
    } catch (e2) {
      // Final fallback to default text decoding (might contain replacement chars)
      content = await file.text();
    }
  }

  // Async segmentation to avoid blocking UI
  const segments = await segmentContent(content);

  const record: ResourceRecord = {
    id: createResourceId(),
    name: normalizeResourceName(file.name),
    size: file.size,
    createdAt: Date.now(),
    archivedAt: null,
    content,
    segments,
  };

  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await requestToPromise(store.add(record));
  await txDone(tx);
  notifyLibraryUpdate();

  return record;
};

export const listResources = async (): Promise<ResourceSummary[]> => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const records = await requestToPromise<ResourceRecord[]>(store.getAll());
  await txDone(tx);

  return records
    .filter((record) => !record.archivedAt)
    .map(({ id, name, size, createdAt, segments, readingPosition }) => ({
      id,
      name,
      size,
      createdAt,
      segmentCount: segments?.length ?? 0,
      readingPosition: readingPosition ?? 0,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const subscribeToResourceLibrary = (listener: () => void) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => listener();
  window.addEventListener(LIBRARY_EVENT, handler);
  return () => window.removeEventListener(LIBRARY_EVENT, handler);
};

export const removeResource = async (resourceId: string) => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.delete(resourceId));
  await txDone(tx);
  notifyLibraryUpdate();
};

export const renameResource = async (resourceId: string, name: string) => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise<ResourceRecord | undefined>(
    store.get(resourceId),
  );
  if (!record) {
    await txDone(tx);
    throw new Error("Resource not found.");
  }

  const trimmed = name.trim();
  if (!trimmed) {
    await txDone(tx);
    throw new Error("Resource name is required.");
  }

  record.name = trimmed;
  await requestToPromise(store.put(record));
  await txDone(tx);
  notifyLibraryUpdate();
};

export const archiveResource = async (resourceId: string) => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise<ResourceRecord | undefined>(
    store.get(resourceId),
  );
  if (!record) {
    await txDone(tx);
    throw new Error("Resource not found.");
  }

  record.archivedAt = Date.now();
  await requestToPromise(store.put(record));
  await txDone(tx);
  notifyLibraryUpdate();
};

export const getResource = async (
  resourceId: string
): Promise<ResourceRecord | null> => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise<ResourceRecord | undefined>(
    store.get(resourceId)
  );
  await txDone(tx);
  return record ?? null;
};

export type SegmentResult = {
  segment: string;
  position: number;
  totalSegments: number;
  hasMore: boolean;
};

/**
 * Get the next unread segment from a resource.
 * Automatically advances reading position.
 */
export const getNextSegment = async (
  resourceId: string
): Promise<SegmentResult | null> => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise<ResourceRecord | undefined>(
    store.get(resourceId)
  );

  if (!record || !record.segments?.length) {
    await txDone(tx);
    return null;
  }

  const currentPosition = record.readingPosition ?? 0;
  const totalSegments = record.segments.length;

  if (currentPosition >= totalSegments) {
    await txDone(tx);
    return null; // Already finished reading
  }

  const segment = record.segments[currentPosition];
  const newPosition = currentPosition + 1;

  // Update reading position
  record.readingPosition = newPosition;
  await requestToPromise(store.put(record));
  await txDone(tx);
  notifyLibraryUpdate();

  return {
    segment,
    position: currentPosition,
    totalSegments,
    hasMore: newPosition < totalSegments,
  };
};

/**
 * Reset reading position to beginning.
 */
export const resetReadingPosition = async (resourceId: string) => {
  const db = await openResourceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise<ResourceRecord | undefined>(
    store.get(resourceId)
  );

  if (!record) {
    await txDone(tx);
    throw new Error("Resource not found.");
  }

  record.readingPosition = 0;
  await requestToPromise(store.put(record));
  await txDone(tx);
  notifyLibraryUpdate();
};
