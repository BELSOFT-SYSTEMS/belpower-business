'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BusinessDashboardData, BusinessRole, BusinessUserProfile } from '@/types/business';
import { canAccessBusiness } from '@/constants/businessNavPermissions';
import { getMockDashboardForRole, MOCK_SUPER_ADMIN } from '@/data/businessMocks';

const TOKEN_KEY = 'businessToken';
const PROFILE_KEY = 'businessProfile';
const ROLE_KEY = 'businessDemoRole';

type BusinessAuthContextValue = {
  user: BusinessUserProfile | null;
  business: BusinessDashboardData['business'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoRole: BusinessRole;
  setDemoRole: (role: BusinessRole) => void;
  canAccess: (permission: string) => boolean;
  isSuperAdmin: boolean;
  signInMock: (role?: BusinessRole) => void;
  logout: () => void;
};

const BusinessAuthContext = createContext<BusinessAuthContextValue | null>(null);

export function BusinessAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BusinessUserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessDashboardData['business'] | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demoRole, setDemoRoleState] = useState<BusinessRole>('super_admin');

  const hydrate = useCallback(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    const profileRaw = sessionStorage.getItem(PROFILE_KEY) || localStorage.getItem(PROFILE_KEY);
    const role = (sessionStorage.getItem(ROLE_KEY) as BusinessRole) || 'super_admin';

    setHasToken(Boolean(token));

    if (token && profileRaw) {
      try {
        const profile = JSON.parse(profileRaw) as BusinessUserProfile;
        const dashboard = getMockDashboardForRole(role);
        setUser(profile);
        setBusiness(dashboard.business);
        setDemoRoleState(role);
      } catch {
        setUser(null);
        setBusiness(null);
        setHasToken(false);
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const signInMock = useCallback((role: BusinessRole = 'super_admin') => {
    const dashboard = getMockDashboardForRole(role);
    const profile = dashboard.user;
    sessionStorage.setItem(TOKEN_KEY, 'mock-business-token');
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    sessionStorage.setItem(ROLE_KEY, role);
    setHasToken(true);
    setUser(profile);
    setBusiness(dashboard.business);
    setDemoRoleState(role);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setHasToken(false);
    setUser(null);
    setBusiness(null);
    window.location.href = '/business/sign-in';
  }, []);

  const setDemoRole = useCallback((role: BusinessRole) => {
    const dashboard = getMockDashboardForRole(role);
    sessionStorage.setItem(ROLE_KEY, role);
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(dashboard.user));
    setDemoRoleState(role);
    setUser(dashboard.user);
    setBusiness(dashboard.business);
  }, []);

  const value = useMemo<BusinessAuthContextValue>(
    () => ({
      user,
      business,
      isAuthenticated: Boolean(user && hasToken),
      isLoading,
      demoRole,
      setDemoRole,
      canAccess: (permission) => canAccessBusiness(user?.role ?? demoRole, permission),
      isSuperAdmin: (user?.role ?? demoRole) === 'super_admin',
      signInMock,
      logout,
    }),
    [user, business, hasToken, isLoading, demoRole, setDemoRole, signInMock, logout]
  );

  return <BusinessAuthContext.Provider value={value}>{children}</BusinessAuthContext.Provider>;
}

export function useBusinessAuth(): BusinessAuthContextValue {
  const ctx = useContext(BusinessAuthContext);
  if (!ctx) throw new Error('useBusinessAuth must be used within BusinessAuthProvider');
  return ctx;
}

/** Dev helper — quick role switch without re-login */
export function useBusinessDemoRoles() {
  return {
    roles: ['super_admin', 'finance_manager', 'operations_officer', 'viewer'] as BusinessRole[],
    defaultSuperAdmin: MOCK_SUPER_ADMIN,
  };
}
