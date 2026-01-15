export type ResourceRecord = {
  id: string;
  name: string;
  size: number;
  createdAt: number;
  archivedAt?: number | null;
  content: string;
  segments?: string[];
};

export type ResourceSummary = Pick<
  ResourceRecord,
  "id" | "name" | "size" | "createdAt"
>;

const DB_NAME = "resource-library";
const STORE_NAME = "resources";
const DB_VERSION = 1;
const LIBRARY_EVENT = "resource-library-updated";
const PLAIN_TEXT_EXTENSION = ".txt";

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

export const saveResourceFile = async (file: File) => {
  const content = await file.text();
  const record: ResourceRecord = {
    id: createResourceId(),
    name: normalizeResourceName(file.name),
    size: file.size,
    createdAt: Date.now(),
    archivedAt: null,
    content,
    segments: [],
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
    .map(({ id, name, size, createdAt }) => ({
      id,
      name,
      size,
      createdAt,
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
