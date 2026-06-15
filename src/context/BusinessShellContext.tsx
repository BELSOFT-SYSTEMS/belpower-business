'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type BusinessShellContextValue = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

const BusinessShellContext = createContext<BusinessShellContextValue | null>(null);

export function BusinessShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((collapsed) => !collapsed);
  }, []);

  const value = useMemo<BusinessShellContextValue>(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
    }),
    [sidebarCollapsed, toggleSidebarCollapsed]
  );

  return (
    <BusinessShellContext.Provider value={value}>{children}</BusinessShellContext.Provider>
  );
}

export function useBusinessShell(): BusinessShellContextValue {
  const context = useContext(BusinessShellContext);
  if (!context) {
    throw new Error('useBusinessShell must be used within BusinessShellProvider');
  }
  return context;
}
