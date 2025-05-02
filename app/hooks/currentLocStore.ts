import { useState, useEffect } from 'react';
import { CurrentLoc } from '../context/formFields';


// Module-level variable
let currentLoc: CurrentLoc = { latitude: 0, longitude: 0, heading: 0 };

// Listeners
const listeners = new Set<(loc: CurrentLoc) => void>();

const setCurrentLoc = (newLoc: CurrentLoc) => {
  currentLoc = { ...newLoc };
  listeners.forEach((cb) => cb({ ...currentLoc }));
};

const getCurrentLoc = (): CurrentLoc => {
  return { ...currentLoc };
};

export const useCurrentLocStore = () => {
  const [localLoc, setLocalLoc] = useState<CurrentLoc>({ ...currentLoc });

  useEffect(() => {
    const listener = (loc: CurrentLoc) => setLocalLoc(loc);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    currentLoc: localLoc,
    getCurrentLoc,
    setCurrentLoc,
  };
};
