import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of the context state
interface RequestContextState {
  requestId: string | null;
  setRequestId: (id: string | any) => void;
}

// Create the context with a default value
export const RequestContext = createContext<RequestContextState>({
  requestId: null,
  setRequestId: () => {},
});

// Create a provider component
export const RequestContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requestId, setRequestIdState] = useState<string | null>(null);

  // Function to update the requestId state and save it to AsyncStorage
  const setRequestId = async (id: string) => {
    setRequestIdState(id);
    await AsyncStorage.setItem('requestId', id);
  };

  // Load the requestId from AsyncStorage when the component mounts
  useEffect(() => {
    const loadrequestId = async () => {
      const storedrequestId = await AsyncStorage.getItem('requestId');
      if (storedrequestId) {
        setRequestIdState(storedrequestId);
      }
    };

    loadrequestId();
  }, []);

  return (
    <RequestContext.Provider value={{ requestId, setRequestId }}>
      {children}
    </RequestContext.Provider>
  );
};