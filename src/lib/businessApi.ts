export class BusinessApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'BusinessApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const ACCESS_TOKEN_KEY = 'businessToken';
const REFRESH_TOKEN_KEY = 'businessRefreshToken';
const PROFILE_KEY = 'businessProfile';
const BUSINESS_KEY = 'businessCompany';

const DASHBOARD_KEY = 'businessDashboardBootstrap';

export const businessAuthStorage = {
  accessTokenKey: ACCESS_TOKEN_KEY,
  refreshTokenKey: REFRESH_TOKEN_KEY,
  profileKey: PROFILE_KEY,
  businessKey: BUSINESS_KEY,
  dashboardKey: DASHBOARD_KEY,
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken?: string | null) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  /** Copy session tokens into localStorage so Paystack return tabs stay signed in. */
  syncTokensAcrossTabs() {
    if (typeof window === 'undefined') return;
    const access = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  getJson(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  },
  setJson(key: string, value: string) {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(BUSINESS_KEY);
    sessionStorage.removeItem(DASHBOARD_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(BUSINESS_KEY);
    localStorage.removeItem(DASHBOARD_KEY);
  },
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_BUSINESS_API_BASE_URL?.trim();
  if (!base) {
    throw new BusinessApiError(
      'NEXT_PUBLIC_BUSINESS_API_BASE_URL is not configured',
      500,
      'API_BASE_MISSING',
    );
  }

  let normalized = base.replace(/\/$/, '');

  // Express mounts the API under /api. Correct a common misconfig:
  // https://api.belpower.ng/v1/business → https://api.belpower.ng/api/v1/business
  normalized = normalized.replace(
    /^(https?:\/\/[^/]+)\/v1\/business$/i,
    '$1/api/v1/business',
  );

  return normalized;
}

type ApiSuccess<T> = {
  success: boolean;
  status?: string;
  message?: string;
  data: T;
};

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function businessApiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders = new Headers(headers || {});
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;
  if (!isFormData && !finalHeaders.has('Content-Type') && rest.body) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = businessAuthStorage.getAccessToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
  });

  const payload = await parseJson(response);
  if (!response.ok || payload.success === false) {
    const errors = (payload.errors as Record<string, unknown> | undefined) || undefined;
    throw new BusinessApiError(
      String(payload.message || 'Request failed'),
      response.status,
      typeof errors?.error_code === 'string' ? errors.error_code : undefined,
      errors || payload,
    );
  }

  const body = payload as unknown as ApiSuccess<T>;
  return body.data;
}

export type BusinessAuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  branchId: string | null;
  branchName: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastActiveAt?: string | null;
};

export type BusinessAuthCompany = {
  id: string;
  businessId: string;
  businessName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: string;
  status?: string;
};

export type BusinessAuthSession = {
  user: BusinessAuthUser;
  business: BusinessAuthCompany;
  accessToken: string;
  refreshToken: string;
} & Partial<BusinessMePayload>;

export type BusinessMePayload = {
  user: BusinessAuthUser;
  business: BusinessAuthCompany;
  branch?: {
    id: string;
    name: string;
    isHeadOffice?: boolean;
    primaryPhone?: string | null;
  } | null;
  headOffice?: {
    id: string;
    name: string;
    primaryPhone?: string | null;
    primaryMeter?: {
      meterNumber: string;
      disco: string | null;
      meterType: string | null;
      customerName?: string | null;
      isPrimary?: boolean;
    } | null;
  } | null;
  branches?: Array<Record<string, unknown>>;
  meters?: Array<{
    id: string;
    branchId: string;
    branchName: string;
    meterNumber: string;
    disco: string | null;
    meterType: string | null;
    isHeadOffice?: boolean;
    isPrimary?: boolean;
    customerName?: string | null;
  }>;
  wallet?: {
    id?: string;
    scope?: string;
    branchId?: string | null;
    branchName?: string | null;
    balance?: number;
    availableBalance?: number;
    todaySpend?: number;
    monthSpend?: number;
    currency?: string;
    status?: string;
    isFrozen?: boolean;
    dailyLimit?: number;
  } | null;
  wallets?: Array<Record<string, unknown>>;
  beneficiaries?: Array<Record<string, unknown>>;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string | null;
  }>;
  unreadNotificationsCount?: number;
  stats?: {
    todaySpend: number;
    monthSpend: number;
    activeBranches: number;
  };
  branchSpend?: Array<{
    branchId: string;
    branchName: string;
    amount: number;
  }>;
  recentTransactions?: Array<{
    id: string;
    reference: string;
    service: string | null;
    provider: string | null;
    amount: number;
    status: string;
    entryType: 'credit' | 'debit';
    branchName: string | null;
    userName: string | null;
    createdAt: string | null;
  }>;
};

export const businessAuthApi = {
  verifyMeter(params: { meter: string; disco: string; vendType: string }) {
    const query = new URLSearchParams({
      meter: params.meter,
      disco: params.disco,
      vendType: params.vendType,
    });
    return businessApiRequest<{
      success?: boolean;
      verification_id: string;
      data?: {
        name?: string;
        customer_name?: string;
        address?: string;
        CustomerAddress?: string;
      };
      expires_at?: string;
    }>(`/auth/verify-meter?${query.toString()}`);
  },

  sendEmailOtp(email: string) {
    return businessApiRequest<{ email: string; expiresAt?: string; otp?: string }>(
      '/auth/send-email-otp',
      { method: 'POST', body: JSON.stringify({ email }) },
    );
  },

  verifyEmailOtp(email: string, otp: string) {
    return businessApiRequest<{ email: string; verified: boolean }>('/auth/verify-email-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  sendPhoneOtp(phone: string) {
    return businessApiRequest<{ phone: string; expiresAt?: string; otp?: string }>(
      '/auth/send-phone-otp',
      { method: 'POST', body: JSON.stringify({ phone }) },
    );
  },

  verifyPhoneOtp(phone: string, otp: string) {
    return businessApiRequest<{ phone: string; verified: boolean }>('/auth/verify-phone-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  register(payload: {
    verificationId: string;
    businessName: string;
    email: string;
    phone: string;
    address: string;
    firstName: string;
    lastName: string;
    password: string;
    termsAccepted: boolean;
  }) {
    return businessApiRequest<BusinessAuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(email: string, password: string) {
    return businessApiRequest<BusinessAuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  refreshToken(refreshToken: string) {
    return businessApiRequest<BusinessAuthSession>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  me() {
    return businessApiRequest<BusinessMePayload>('/auth/me', {
      method: 'GET',
      auth: true,
    });
  },

  uploadLogo(file: File) {
    const body = new FormData();
    body.append('logo', file);
    return businessApiRequest<BusinessAuthCompany>('/settings/logo', {
      method: 'POST',
      auth: true,
      body,
      // Let the browser set multipart boundary
      headers: {},
    });
  },

  forgotPassword(email: string) {
    return businessApiRequest<{ email: string; resetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, newPassword: string) {
    return businessApiRequest<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  updatePassword(currentPassword: string, newPassword: string) {
    return businessApiRequest<{ success: boolean }>('/auth/update-password', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout(refreshToken?: string | null) {
    return businessApiRequest<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ refreshToken: refreshToken || undefined }),
    });
  },

  sendContactEmailOtp(email: string) {
    return businessApiRequest<{ email: string; expiresAt?: string; otp?: string }>(
      '/settings/contact/send-email-otp',
      { method: 'POST', auth: true, body: JSON.stringify({ email }) },
    );
  },

  verifyContactEmail(email: string, otp: string) {
    return businessApiRequest<BusinessAuthCompany>('/settings/contact/verify-email', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ email, otp }),
    });
  },

  sendContactPhoneOtp(phone: string) {
    return businessApiRequest<{ phone: string; expiresAt?: string; otp?: string }>(
      '/settings/contact/send-phone-otp',
      { method: 'POST', auth: true, body: JSON.stringify({ phone }) },
    );
  },

  verifyContactPhone(phone: string, otp: string) {
    return businessApiRequest<BusinessAuthCompany>('/settings/contact/verify-phone', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ phone, otp }),
    });
  },
};

export type BusinessTransactionListItem = {
  id: string;
  reference: string;
  service: string;
  provider: string | null;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  entryType: 'credit' | 'debit';
  branchName: string | null;
  userName: string | null;
  createdAt: string | null;
  paymentMethod?: string | null;
  completedAt?: string | null;
  failureReason?: string | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
  detail?: {
    description?: string;
    orderId?: string | null;
    performedByRole?: string | null;
  };
};

export const businessTransactionsApi = {
  list(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.offset != null) query.set('offset', String(params.offset));
    const qs = query.toString();
    return businessApiRequest<{
      items: BusinessTransactionListItem[];
      total: number;
      limit: number;
      offset: number;
    }>(`/transactions${qs ? `?${qs}` : ''}`, { method: 'GET', auth: true });
  },

  get(id: string) {
    return businessApiRequest<BusinessTransactionListItem>(`/transactions/${id}`, {
      method: 'GET',
      auth: true,
    });
  },
};

export const businessBranchesApi = {
  list() {
    return businessApiRequest<
      Array<{
        id: string;
        name: string;
        code: string | null;
        city: string | null;
        address: string | null;
        isHeadOffice: boolean;
        status: string;
        userCount: number;
        meterCount: number;
        wallet: {
          id: string;
          availableBalance: number;
          balance: number;
        } | null;
      }>
    >('/branches', { method: 'GET', auth: true });
  },

  create(payload: {
    name: string;
    code: string;
    city: string;
    address: string;
    verificationId: string;
    primaryPhone?: string | null;
  }) {
    return businessApiRequest<{
      id: string;
      name: string;
      code: string | null;
      city: string | null;
      address: string | null;
      isHeadOffice: boolean;
      status: string;
      userCount: number;
      meterCount: number;
      wallet: Record<string, unknown> | null;
    }>('/branches', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },
};

export const businessWalletApi = {
  overview() {
    return businessApiRequest<{
      companyWallet: {
        id: string;
        availableBalance: number;
        balance: number;
        todaySpend?: number;
        monthSpend?: number;
        monthTransactions?: number;
      } | null;
      wallets: Array<{
        id: string;
        scope: string;
        branchId: string | null;
        branchName: string | null;
        availableBalance: number;
        balance: number;
        todaySpend?: number;
        monthSpend?: number;
        monthTransactions?: number;
        isFrozen?: boolean;
      }>;
      unallocatedBalance: number;
      totalAllocated: number;
      allocatableBranches: Array<{
        branchId: string;
        branchName: string;
        walletId: string;
        allocatedBalance: number;
        status: string;
        isFrozen: boolean;
      }>;
    }>('/wallet', { method: 'GET', auth: true });
  },

  allocate(payload: { branchId: string; amount: number; note?: string }) {
    return businessApiRequest<{
      reference: string;
      amount: number;
      branchId: string;
      branchName: string;
      companyWallet: { id: string; availableBalance: number };
      branchWallet: { id: string; availableBalance: number };
    }>('/wallet/allocate', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  statements(params?: { walletId?: string | null; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.walletId) query.set('walletId', params.walletId);
    if (params?.limit != null) query.set('limit', String(params.limit));
    if (params?.offset != null) query.set('offset', String(params.offset));
    const qs = query.toString();
    return businessApiRequest<{
      items: Array<{
        id: string;
        reference: string;
        type: 'credit' | 'debit';
        description: string;
        amount: number;
        balanceBefore: number;
        balanceAfter: number;
        branchName: string | null;
        performedByName: string;
        performedByRole: string | null;
        status: 'completed' | 'pending' | 'failed';
        createdAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
      walletId: string | null;
    }>(`/wallet/statements${qs ? `?${qs}` : ''}`, { method: 'GET', auth: true });
  },

  fundCard(payload: { amount: number; email?: string }) {
    return businessApiRequest<{
      authorization_url: string;
      access_code?: string;
      reference: string;
      amount: number;
    }>('/wallet/fund/card', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  verifyFund(reference: string) {
    return businessApiRequest<{
      status: string;
      reference: string;
      amount: number;
      alreadyProcessed?: boolean;
      newBalance?: number | null;
    }>(`/wallet/fund/verify/${encodeURIComponent(reference)}`, {
      method: 'POST',
      auth: true,
    });
  },

  fundBuyPowerDva(payload: { amount: number; name?: string; email?: string }) {
    return businessApiRequest<{
      transaction_id: string;
      reference: string;
      account_number: string;
      account_name: string;
      bank_name: string;
      bank_code: string;
      expires_at: string;
      amount: number;
      base_amount?: number;
      buypower_processing_fee?: number;
      total_to_transfer?: number;
      requested_credit?: number;
    }>('/wallet/fund/buypower-dva', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  fundingStatus(transactionId: string) {
    return businessApiRequest<{
      id: string;
      reference: string;
      status: string;
      amount: number;
      paymentMethod?: string | null;
      expiresAt?: string | null;
    }>(`/wallet/fund/status/${encodeURIComponent(transactionId)}`, {
      method: 'GET',
      auth: true,
    });
  },
};
