// contexts/UserContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export type User = {
  role: string;
  // add other user properties as needed
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  refetchUser: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  refetchUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/current-user');
      if (res.status === 200) {
        setUser(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
