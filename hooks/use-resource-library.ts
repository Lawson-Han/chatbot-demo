"use client";

import { useEffect, useState } from "react";
import {
  listResources,
  subscribeToResourceLibrary,
  type ResourceSummary,
} from "@/lib/resource-library";

type ResourceLibraryState = {
  resources: ResourceSummary[];
  isLoading: boolean;
};

export const useResourceLibrary = (): ResourceLibraryState => {
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const next = await listResources();
        if (isMounted) {
          setResources(next);
        }
      } catch {
        if (isMounted) {
          setResources([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();
    const unsubscribe = subscribeToResourceLibrary(() => {
      void load();
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { resources, isLoading };
};
