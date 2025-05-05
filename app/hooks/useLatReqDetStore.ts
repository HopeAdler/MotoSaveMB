import { useState, useEffect } from 'react';
import { LatestRequestDetail } from '../context/formFields';

// Module-level variable (can be null or LatestRequestDetail)
let latestRequestDetail: LatestRequestDetail | null = null;

// Listeners
const listeners = new Set<(latReqDet: LatestRequestDetail | null) => void>();

const setLatReqDet = (newLatReqDet: LatestRequestDetail | null) => {
  latestRequestDetail = newLatReqDet ? { ...newLatReqDet } : null;
  listeners.forEach((cb) => cb(latestRequestDetail ? { ...latestRequestDetail } : null));
};

const getLatReqDet = (): LatestRequestDetail | null => {
  return latestRequestDetail ? { ...latestRequestDetail } : null;
};

export const useLatReqDetStore = () => {
  const [localLatReqDet, setLocalLatReqDet] = useState<LatestRequestDetail | null>(
    latestRequestDetail ? { ...latestRequestDetail } : null
  );

  useEffect(() => {
    const listener = (latReqDet: LatestRequestDetail | null) => setLocalLatReqDet(latReqDet);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    latestRequestDetail: localLatReqDet,
    getLatReqDet,
    setLatReqDet,
  };
};
