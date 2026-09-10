import { BusinessApiError, businessApiRequest } from '@/lib/businessApi';

export type BusinessPurchaseResult = {
  status: 'completed' | 'pending';
  pending?: boolean;
  reference: string;
  order_id?: string;
  transaction_id?: string;
  amount: number;
  service_type?: string;
  wallet_balance?: number;
  token?: string | null;
  units?: string | number | null;
  branch_name?: string | null;
  message?: string;
  settlement_status?: string;
};

export type BusinessDataPlan = {
  id?: string;
  code?: string;
  tariffClass?: string;
  name?: string;
  description?: string;
  amount?: number;
  price?: number;
  validity?: string;
  [key: string]: unknown;
};

export type BusinessCablePlan = {
  id?: string;
  code?: string;
  tariffClass?: string;
  name?: string;
  description?: string;
  amount?: number;
  price?: number;
  [key: string]: unknown;
};

function asPlanList(payload: unknown): BusinessDataPlan[] {
  if (Array.isArray(payload)) return payload as BusinessDataPlan[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.plans)) return record.plans as BusinessDataPlan[];
    if (Array.isArray(record.data)) return record.data as BusinessDataPlan[];
    if (Array.isArray(record.tariffs)) return record.tariffs as BusinessDataPlan[];
  }
  return [];
}

export function networkToDisco(network: string): string {
  const key = network.trim().toLowerCase();
  const map: Record<string, string> = {
    mtn: 'MTN',
    airtel: 'AIRTEL',
    glo: 'GLO',
    '9mobile': '9MOBILE',
    etisalat: '9MOBILE',
  };
  return map[key] || network.toUpperCase();
}

export function cableToDisco(provider: string): string {
  const key = provider.trim().toLowerCase();
  const map: Record<string, string> = {
    dstv: 'DSTV',
    gotv: 'GOTV',
    startimes: 'STARTIMES',
    showmax: 'SHOWMAX',
  };
  return map[key] || provider.toUpperCase();
}

export function normalizeBusinessPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return `0${digits.slice(3)}`;
  if (
    digits.length === 10 &&
    (digits.startsWith('7') || digits.startsWith('8') || digits.startsWith('9'))
  ) {
    return `0${digits}`;
  }
  return digits.startsWith('0') ? digits : digits;
}

export const businessPaymentsApi = {
  buyAirtime(payload: {
    phone: string;
    amount: number;
    disco: string;
    branchId?: string | null;
    walletId?: string | null;
  }) {
    return businessApiRequest<BusinessPurchaseResult>('/payments/airtime', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  buyData(payload: {
    phone: string;
    amount: number;
    disco: string;
    tariffClass: string;
    branchId?: string | null;
    walletId?: string | null;
  }) {
    return businessApiRequest<BusinessPurchaseResult>('/payments/data', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  buyElectricity(payload: {
    meter: string;
    disco: string;
    vendType: 'PREPAID' | 'POSTPAID';
    amount: number;
    phone: string;
    branchId?: string | null;
    walletId?: string | null;
  }) {
    return businessApiRequest<BusinessPurchaseResult>('/payments/electricity', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  buyCable(payload: {
    meter: string;
    disco: string;
    tariffClass: string;
    amount: number;
    phone: string;
    branchId?: string | null;
    walletId?: string | null;
  }) {
    return businessApiRequest<BusinessPurchaseResult>('/payments/cable', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  verifyMeter(params: { meter: string; disco: string; vendType: string }) {
    const query = new URLSearchParams({
      meter: params.meter,
      disco: params.disco,
      vendType: params.vendType,
    });
    return businessApiRequest<Record<string, unknown>>(`/payments/verify/meter?${query}`, {
      method: 'GET',
      auth: true,
    });
  },

  verifySmartcard(payload: { meter: string; disco: string }) {
    return businessApiRequest<Record<string, unknown>>('/payments/verify/smartcard', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  async dataPlans(provider: string): Promise<BusinessDataPlan[]> {
    const query = new URLSearchParams({ provider: networkToDisco(provider) });
    const data = await businessApiRequest<unknown>(`/payments/data/plans?${query}`, {
      method: 'GET',
      auth: true,
    });
    return asPlanList(data);
  },

  async cablePlans(provider: string): Promise<BusinessCablePlan[]> {
    const query = new URLSearchParams({ provider: cableToDisco(provider) });
    const data = await businessApiRequest<unknown>(`/payments/cable/plans?${query}`, {
      method: 'GET',
      auth: true,
    });
    return asPlanList(data) as BusinessCablePlan[];
  },
};

export function paymentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BusinessApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
