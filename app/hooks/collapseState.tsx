'use client';

import React, { createContext, useContext, useState } from 'react';

// Interface of the context
interface CollapseContextType {
  collapseButton: boolean;
  setCollapseButton: (value: boolean) => void;
}

// Create the context with undefined as initial value
const CollapseContext = createContext<CollapseContextType | undefined>(undefined);

// Create a provider component
export const CollapseProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapseButton, setCollapseButton] = useState<boolean>(true);

  return (
    <CollapseContext.Provider value={{ collapseButton, setCollapseButton }}>
      {children}
    </CollapseContext.Provider>
  );
};

// Custom hook for easy access
export const useCollapse = (): CollapseContextType => {
  const context = useContext(CollapseContext);
  if (!context) {
    throw new Error('useCollapse must be used within a CollapseProvider');
  }
  return context;
};
