/**
 * BuyPower catalog/verify mapping — aligned with belpower-frontend
 * (data-bundle/page.tsx, cable/page.tsx, meterVerification.ts, electricity discos).
 */

export type BuyPowerPlanRow = {
  code?: string;
  desc?: string;
  price?: number | string;
  name?: string;
  description?: string;
  amount?: number | string;
  tariffClass?: string;
  id?: string;
  validity?: string;
  [key: string]: unknown;
};

export type NormalizedUtilityPlan = {
  code: string;
  name: string;
  amount: number;
  tariffClass: string;
  validity: string;
};

export type MeterVerifyCustomerData = {
  customer_name?: string;
  address?: string;
  min_vend_amount?: number;
  max_vend_amount?: number;
  outstanding?: number | string | null;
  disco?: string;
  vend_type?: string;
  BeneficiaryName?: string;
  CustomerAddress?: string;
  package?: string;
  current_bouquet?: string;
  bouquet?: string;
  [key: string]: unknown;
};

/** Unwrap BuyPower / consumer-shaped plan list payloads. */
export function extractBuyPowerPlanRows(payload: unknown): BuyPowerPlanRow[] {
  if (Array.isArray(payload)) return payload as BuyPowerPlanRow[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;

  // Consumer BFF: { provider, plans: { data: [...] } }
  const plansObj = record.plans;
  if (plansObj && typeof plansObj === 'object' && !Array.isArray(plansObj)) {
    const nested = (plansObj as Record<string, unknown>).data;
    if (Array.isArray(nested)) return nested as BuyPowerPlanRow[];
  }

  if (Array.isArray(plansObj)) return plansObj as BuyPowerPlanRow[];
  if (Array.isArray(record.data)) return record.data as BuyPowerPlanRow[];
  if (Array.isArray(record.tariffs)) return record.tariffs as BuyPowerPlanRow[];

  // Nested success wrapper: { data: { plans: { data } } } or { data: { data: [] } }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return extractBuyPowerPlanRows(record.data);
  }

  return [];
}

/**
 * Normalize a BuyPower tariff row.
 * Consumer uses: name = desc, amount = price, tariffClass = code.
 */
export function normalizeBuyPowerPlan(plan: BuyPowerPlanRow): NormalizedUtilityPlan | null {
  const code = String(plan.code || plan.tariffClass || plan.id || '').trim();
  if (!code) return null;

  const amount = Number(plan.price ?? plan.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const name = String(plan.desc || plan.name || plan.description || code).trim();
  const validity = String(plan.validity || '').trim() || inferValidityFromDesc(name);

  return {
    code,
    name,
    amount,
    tariffClass: code,
    validity,
  };
}

function inferValidityFromDesc(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes('1 day') || lower.includes('1day') || lower.includes('daily')) return '1 day';
  if (lower.includes('2 day') || lower.includes('2day')) return '2 days';
  if (lower.includes('7 day') || lower.includes('7day') || lower.includes('weekly')) return '7 days';
  if (lower.includes('14 day') || lower.includes('14day')) return '14 days';
  if (
    lower.includes('30 day') ||
    lower.includes('30day') ||
    lower.includes('1 month') ||
    lower.includes('monthly')
  ) {
    return '30 days';
  }
  return '';
}

/**
 * Parse nested BuyPower verify payloads.
 * After businessApiRequest, body is usually `{ success, data: { customer_name, ... } }`
 * or `{ success, data: { data: { ... } } }` depending on upstream wrapping.
 */
export function parseMeterVerifyCustomerData(body: unknown): MeterVerifyCustomerData | null {
  if (!body || typeof body !== 'object') return null;

  const payload = body as { data?: unknown; success?: boolean };
  const root = payload.data !== undefined ? payload.data : body;

  if (!root || typeof root !== 'object') return null;

  const level1 = root as MeterVerifyCustomerData & { data?: MeterVerifyCustomerData };
  const nested = level1.data;
  const meterData =
    nested &&
    typeof nested === 'object' &&
    (nested.customer_name ||
      nested.BeneficiaryName ||
      nested.address ||
      nested.CustomerAddress ||
      nested.package)
      ? nested
      : (level1 as MeterVerifyCustomerData);

  if (
    meterData &&
    typeof meterData === 'object' &&
    (meterData.customer_name ||
      meterData.BeneficiaryName ||
      meterData.address ||
      meterData.CustomerAddress ||
      meterData.package ||
      meterData.outstanding != null)
  ) {
    return meterData;
  }

  return null;
}

export function meterCustomerName(data: MeterVerifyCustomerData | null | undefined): string {
  if (!data) return '';
  return String(data.customer_name || data.BeneficiaryName || '').trim();
}

export function meterCustomerAddress(data: MeterVerifyCustomerData | null | undefined): string {
  if (!data) return '';
  return String(data.address || data.CustomerAddress || '').trim();
}

export function meterOutstanding(data: MeterVerifyCustomerData | null | undefined): number | null {
  if (!data || data.outstanding == null || data.outstanding === '') return null;
  const n = typeof data.outstanding === 'number' ? data.outstanding : Number(String(data.outstanding).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function smartcardCurrentPackage(
  data: MeterVerifyCustomerData | null | undefined,
): string | null {
  if (!data) return null;
  const value = data.package || data.current_bouquet || data.bouquet;
  return value != null && String(value).trim() ? String(value).trim() : null;
}

/** Live electricity disco map: `{ ABUJA: true, EKO: false, ... }` */
export function normalizeElectricityDiscoMap(
  payload: unknown,
  nameLookup: Record<string, string>,
): Array<{ code: string; name: string; available: boolean }> {
  let map: Record<string, unknown> | null = null;

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      map = record.data as Record<string, unknown>;
    } else {
      map = record;
    }
  }

  if (!map) return [];

  return Object.entries(map)
    .filter(([code]) => /^[A-Z0-9_]+$/i.test(code))
    .map(([code, available]) => {
      const upper = code.toUpperCase();
      return {
        code: upper,
        name: nameLookup[upper] || upper,
        available: Boolean(available),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type CatalogProviderOption = {
  id: string;
  name: string;
  logo: string;
  available: boolean;
};

/** Map BuyPower network status `{ MTN: true }` onto local catalog tiles. */
export function mapNetworkProviderOptions(
  statusMap: Record<string, boolean>,
  catalog: Array<{ id: string; name: string; logo: string }>,
): CatalogProviderOption[] {
  if (!statusMap || Object.keys(statusMap).length === 0) {
    return catalog.map((item) => ({ ...item, available: true }));
  }

  const byCode = new Map(
    Object.entries(statusMap).map(([code, available]) => [
      code.toLowerCase() === 'etisalat' ? '9mobile' : code.toLowerCase(),
      Boolean(available),
    ]),
  );

  return catalog
    .map((item) => ({
      ...item,
      available: byCode.has(item.id) ? Boolean(byCode.get(item.id)) : true,
    }))
    .filter((item) => byCode.size === 0 || byCode.has(item.id));
}

/** Map BuyPower cable status `{ DSTV: true }` onto local catalog tiles (excludes showmax). */
export function mapCableProviderOptions(
  statusMap: Record<string, boolean>,
  catalog: Array<{ id: string; name: string; logo: string }>,
): CatalogProviderOption[] {
  const base = catalog.filter((item) => item.id !== 'showmax');
  if (!statusMap || Object.keys(statusMap).length === 0) {
    return base.map((item) => ({ ...item, available: true }));
  }

  const byCode = new Map(
    Object.entries(statusMap).map(([code, available]) => [code.toLowerCase(), Boolean(available)]),
  );

  return base
    .map((item) => ({
      ...item,
      available: byCode.has(item.id) ? Boolean(byCode.get(item.id)) : true,
    }))
    .filter((item) => byCode.size === 0 || byCode.has(item.id));
}
