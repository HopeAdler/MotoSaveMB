import { useState, useEffect } from 'react';
import { User } from '../context/formFields';

// Module-level variable
let users = new Map<string, User>();

// Listeners
const listeners = new Set<(map: Map<string, User>) => void>();

const setUsers = (newUsers: Map<string, User>) => {
  users = new Map(newUsers);
  listeners.forEach((cb) => cb(new Map(users)));
};

const getUsers = (): Map<string, User> => {
  return new Map(users);
};

export const useUsersStore = () => {
  const [localUsers, setLocalUsers] = useState<Map<string, User>>(new Map(users));

  useEffect(() => {
    const listener = (updated: Map<string, User>) => setLocalUsers(updated);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    users: localUsers,
    getUsers,
    setUsers,
  };
};
