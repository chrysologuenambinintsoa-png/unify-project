'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface HomeActivityContextType {
  homeActivityCount: number;
  incrementHomeActivity: () => void;
  clearHomeActivity: () => void;
}

const HomeActivityContext = createContext<HomeActivityContextType | undefined>(undefined);

export function HomeActivityProvider({ children }: { children: React.ReactNode }) {
  const [homeActivityCount, setHomeActivityCount] = useState(0);

  const incrementHomeActivity = useCallback(() => {
    setHomeActivityCount(prev => prev + 1);
  }, []);

  const clearHomeActivity = useCallback(() => {
    setHomeActivityCount(0);
  }, []);

  return (
    <HomeActivityContext.Provider value={{ homeActivityCount, incrementHomeActivity, clearHomeActivity }}>
      {children}
    </HomeActivityContext.Provider>
  );
}

export function useHomeActivity() {
  const context = useContext(HomeActivityContext);
  if (!context) {
    throw new Error('useHomeActivity must be used within HomeActivityProvider');
  }
  return context;
}
