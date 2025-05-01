import { useState, useEffect } from 'react';

// Module-level variable (shared across screens)
let pendingReqDetailIds = new Map<string, string>();

// Listeners for manual reactivity
const listeners = new Set<(map: Map<string, string>) => void>();

const setPendingReqDetailIds = (newMap: Map<string, string>) => {
  pendingReqDetailIds = new Map(newMap);
  listeners.forEach((cb) => cb(new Map(pendingReqDetailIds)));
};

const getPendingReqDetailIds = (): Map<string, string> => {
  return new Map(pendingReqDetailIds); // Return a copy to avoid unintended mutations
};

const removePendingReqDetailId = (id: string) => {
  pendingReqDetailIds.delete(id);
  listeners.forEach((cb) => cb(new Map(pendingReqDetailIds)));
};

export const usePendingReqStore = () => {
  const [localMap, setLocalMap] = useState<Map<string, string>>(new Map(pendingReqDetailIds));

  useEffect(() => {
    const listener = (updatedMap: Map<string, string>) => {
      setLocalMap(updatedMap);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    pendingReqDetailIds: localMap,
    getPendingReqDetailIds,
    setPendingReqDetailIds,
    removePendingReqDetailId,
  };
};
