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
import { ALL_BUSINESS_ROLES } from '@/constants/businessRoles';
import { getMockDashboardForRole, MOCK_SUPER_ADMIN } from '@/data/businessMocks';
import {
  businessAuthApi,
  businessAuthStorage,
  type BusinessAuthCompany,
  type BusinessAuthSession,
  type BusinessAuthUser,
  type BusinessMePayload,
} from '@/lib/businessApi';

const ROLE_KEY = 'businessDemoRole';

function normalizeStoredRole(raw: string | null): BusinessRole {
  const aliases: Record<string, BusinessRole> = {
    finance_manager: 'hq_finance',
    operations_officer: 'branch_operations',
    viewer: 'hq_viewer',
  };
  const mapped = (raw && aliases[raw] ? aliases[raw] : raw) as BusinessRole;
  return ALL_BUSINESS_ROLES.includes(mapped) ? mapped : 'super_admin';
}

function toUserProfile(user: BusinessAuthUser): BusinessUserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: normalizeStoredRole(user.role),
    branchId: user.branchId,
    branchName: user.branchName,
  };
}

function toBusinessProfile(business: BusinessAuthCompany): BusinessDashboardData['business'] {
  return {
    id: business.id,
    businessId: business.businessId,
    businessName: business.businessName,
    logoUrl: business.logoUrl,
    email: business.email,
    phone: business.phone,
    address: business.address,
  };
}

type BusinessAuthContextValue = {
  user: BusinessUserProfile | null;
  business: BusinessDashboardData['business'] | null;
  dashboardBootstrap: BusinessMePayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoRole: BusinessRole;
  setDemoRole: (role: BusinessRole) => void;
  canAccess: (permission: string) => boolean;
  isSuperAdmin: boolean;
  signInMock: (role?: BusinessRole) => void;
  applyAuthSession: (session: BusinessAuthSession) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const BusinessAuthContext = createContext<BusinessAuthContextValue | null>(null);

export function BusinessAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BusinessUserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessDashboardData['business'] | null>(null);
  const [dashboardBootstrap, setDashboardBootstrap] = useState<BusinessMePayload | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demoRole, setDemoRoleState] = useState<BusinessRole>('super_admin');

  const persistBootstrap = useCallback((payload: BusinessMePayload) => {
    businessAuthStorage.setJson(businessAuthStorage.dashboardKey, JSON.stringify(payload));
    setDashboardBootstrap(payload);
  }, []);

  const applyAuthSession = useCallback(
    (session: BusinessAuthSession) => {
      const profile = toUserProfile(session.user);
      const company = toBusinessProfile(session.business);
      businessAuthStorage.setTokens(session.accessToken, session.refreshToken);
      businessAuthStorage.setJson(businessAuthStorage.profileKey, JSON.stringify(profile));
      businessAuthStorage.setJson(businessAuthStorage.businessKey, JSON.stringify(company));
      businessAuthStorage.setJson(ROLE_KEY, profile.role);
      setHasToken(true);
      setUser(profile);
      setBusiness(company);
      setDemoRoleState(profile.role);

      const {
        accessToken: _a,
        refreshToken: _r,
        ...maybeBootstrap
      } = session;
      if (maybeBootstrap.wallet || maybeBootstrap.meters || maybeBootstrap.branches) {
        persistBootstrap(maybeBootstrap as BusinessMePayload);
      }
    },
    [persistBootstrap],
  );

  const refreshMe = useCallback(async () => {
    const me = await businessAuthApi.me();
    const profile = toUserProfile(me.user);
    const company = toBusinessProfile(me.business);
    businessAuthStorage.setJson(businessAuthStorage.profileKey, JSON.stringify(profile));
    businessAuthStorage.setJson(businessAuthStorage.businessKey, JSON.stringify(company));
    businessAuthStorage.setJson(ROLE_KEY, profile.role);
    setUser(profile);
    setBusiness(company);
    setDemoRoleState(profile.role);
    persistBootstrap(me);
  }, [persistBootstrap]);

  const hydrate = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    businessAuthStorage.syncTokensAcrossTabs();
    const token = businessAuthStorage.getAccessToken();
    const profileRaw = businessAuthStorage.getJson(businessAuthStorage.profileKey);
    const businessRaw = businessAuthStorage.getJson(businessAuthStorage.businessKey);
    const bootstrapRaw = businessAuthStorage.getJson(businessAuthStorage.dashboardKey);
    const role = normalizeStoredRole(businessAuthStorage.getJson(ROLE_KEY));

    setHasToken(Boolean(token));

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (profileRaw && businessRaw) {
      try {
        setUser(JSON.parse(profileRaw) as BusinessUserProfile);
        setBusiness(JSON.parse(businessRaw) as BusinessDashboardData['business']);
        setDemoRoleState(role);
      } catch {
        // fall through to /me
      }
    }
    if (bootstrapRaw) {
      try {
        setDashboardBootstrap(JSON.parse(bootstrapRaw) as BusinessMePayload);
      } catch {
        // ignore
      }
    }

    try {
      const me = await businessAuthApi.me();
      const profile = toUserProfile(me.user);
      const company = toBusinessProfile(me.business);
      businessAuthStorage.setJson(businessAuthStorage.profileKey, JSON.stringify(profile));
      businessAuthStorage.setJson(businessAuthStorage.businessKey, JSON.stringify(company));
      businessAuthStorage.setJson(ROLE_KEY, profile.role);
      setUser(profile);
      setBusiness(company);
      setDemoRoleState(profile.role);
      setHasToken(true);
      persistBootstrap(me);
    } catch {
      const refresh = businessAuthStorage.getRefreshToken();
      if (refresh) {
        try {
          const session = await businessAuthApi.refreshToken(refresh);
          applyAuthSession(session);
        } catch {
          businessAuthStorage.clear();
          sessionStorage.removeItem(ROLE_KEY);
          localStorage.removeItem(ROLE_KEY);
          setHasToken(false);
          setUser(null);
          setBusiness(null);
        }
      } else if (token === 'mock-business-token' && profileRaw) {
        // Keep local mock/dev sessions working.
        try {
          const profile = JSON.parse(profileRaw) as BusinessUserProfile;
          const dashboard = getMockDashboardForRole(role);
          setUser(profile);
          setBusiness(dashboard.business);
          setDemoRoleState(role);
          setHasToken(true);
        } catch {
          businessAuthStorage.clear();
          setHasToken(false);
          setUser(null);
          setBusiness(null);
        }
      } else {
        businessAuthStorage.clear();
        setHasToken(false);
        setUser(null);
        setBusiness(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthSession, persistBootstrap]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await businessAuthApi.login(email, password);
      applyAuthSession(session);
      try {
        await refreshMe();
      } catch {
        // session already applied; bootstrap can load on next hydrate
      }
    },
    [applyAuthSession, refreshMe],
  );

  const signInMock = useCallback((role: BusinessRole = 'super_admin') => {
    const dashboard = getMockDashboardForRole(role);
    const profile = dashboard.user;
    businessAuthStorage.setTokens('mock-business-token', null);
    businessAuthStorage.setJson(businessAuthStorage.profileKey, JSON.stringify(profile));
    businessAuthStorage.setJson(businessAuthStorage.businessKey, JSON.stringify(dashboard.business));
    businessAuthStorage.setJson(ROLE_KEY, role);
    setHasToken(true);
    setUser(profile);
    setBusiness(dashboard.business);
    setDemoRoleState(role);
  }, []);

  const logout = useCallback(async () => {
    const refresh = businessAuthStorage.getRefreshToken();
    try {
      if (businessAuthStorage.getAccessToken() && businessAuthStorage.getAccessToken() !== 'mock-business-token') {
        await businessAuthApi.logout(refresh);
      }
    } catch {
      // ignore logout API errors
    }
    businessAuthStorage.clear();
    sessionStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(ROLE_KEY);
    setHasToken(false);
    setUser(null);
    setBusiness(null);
    window.location.href = '/business/sign-in';
  }, []);

  const setDemoRole = useCallback((role: BusinessRole) => {
    const dashboard = getMockDashboardForRole(role);
    businessAuthStorage.setJson(ROLE_KEY, role);
    businessAuthStorage.setJson(businessAuthStorage.profileKey, JSON.stringify(dashboard.user));
    businessAuthStorage.setJson(businessAuthStorage.businessKey, JSON.stringify(dashboard.business));
    setDemoRoleState(role);
    setUser(dashboard.user);
    setBusiness(dashboard.business);
  }, []);

  const value = useMemo<BusinessAuthContextValue>(
    () => ({
      user,
      business,
      dashboardBootstrap,
      isAuthenticated: Boolean(user && hasToken),
      isLoading,
      demoRole,
      setDemoRole,
      canAccess: (permission) => canAccessBusiness(user?.role ?? demoRole, permission),
      isSuperAdmin: (user?.role ?? demoRole) === 'super_admin',
      signInMock,
      applyAuthSession,
      login,
      logout,
      refreshMe,
    }),
    [
      user,
      business,
      dashboardBootstrap,
      hasToken,
      isLoading,
      demoRole,
      setDemoRole,
      signInMock,
      applyAuthSession,
      login,
      logout,
      refreshMe,
    ],
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
    roles: [
      'super_admin',
      'hq_finance',
      'hq_operations',
      'branch_admin',
      'branch_operations',
      'hq_viewer',
    ] as BusinessRole[],
    defaultSuperAdmin: MOCK_SUPER_ADMIN,
  };
}
