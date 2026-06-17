import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';

type Transaction = BusinessTransactionDetail;

export interface ServiceBillingBreakdown {
  totalPaid: number;
  baseAmount: number;
  serviceCharge: number;
}

export type ElectricityBillingBreakdown = ServiceBillingBreakdown & {
  electricityAmount: number;
};

export type CableBillingBreakdown = ServiceBillingBreakdown & {
  packageAmount: number;
};

type BreakdownShape = {
  user_paid?: string | number;
  total_amount?: string | number;
  tax?: string | number;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  card: 'Card',
  dva: 'Bank transfer (Paystack)',
  'buypower-dva': 'Bank transfer (BuyPower)',
};

function normalizePaymentMethodKey(raw?: string | null): string {
  if (!raw) return '';
  const k = raw.toLowerCase().trim().replace(/_/g, '-');
  if (k === 'buypower-dva' || k === 'buypowerdva') return 'buypower-dva';
  if (k === 'bank-transfer' || k === 'banktransfer') return 'buypower-dva';
  return k;
}

type MetadataRecord = Transaction['metadata'] & Record<string, unknown>;

function pickString(value: unknown): string {
  if (value == null) return '';
  const s = String(value).trim();
  return s;
}

function pickNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
  return Number.isFinite(n) ? n : null;
}

function hasVendPayloadFields(obj: Record<string, unknown>): boolean {
  return (
    'tax' in obj ||
    'vat' in obj ||
    'VAT' in obj ||
    'amountGenerated' in obj ||
    'amount_generated' in obj ||
    'token' in obj ||
    'name' in obj ||
    'units' in obj
  );
}

/** Raw BuyPower vend object — supports `buypower_response` and `buyPower_response`. */
export function getBuyPowerResponseRoot(
  meta?: Transaction['metadata'] | null
): Record<string, unknown> | null {
  if (!meta) return null;
  const m = meta as MetadataRecord;
  const raw =
    m.buyPower_response ?? m.buypower_response ?? m.buy_power_response ?? null;
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return raw as Record<string, unknown>;
}

/** Vend payload (unwraps nested `data.data` from BuyPower API). */
export function getBuyPowerVendData(
  meta?: Transaction['metadata'] | null
): Record<string, unknown> | null {
  const root = getBuyPowerResponseRoot(meta);
  if (!root) return null;

  if (hasVendPayloadFields(root)) return root;

  let node: Record<string, unknown> = root;
  for (let depth = 0; depth < 5; depth++) {
    const next = node.data;
    if (!next || typeof next !== 'object') break;
    node = next as Record<string, unknown>;
    if (hasVendPayloadFields(node)) return node;
  }

  const firstData = root.data;
  if (firstData && typeof firstData === 'object') {
    return firstData as Record<string, unknown>;
  }
  return root;
}

/** All breakdown / pricing objects that may contain tax. */
function collectTaxSourceRecords(
  meta?: Transaction['metadata'] | null
): Record<string, unknown>[] {
  if (!meta) return [];
  const m = meta as MetadataRecord;
  const sources: Record<string, unknown>[] = [];

  const push = (obj: unknown) => {
    if (obj && typeof obj === 'object') sources.push(obj as Record<string, unknown>);
  };

  push(m.pricing);
  push(m.breakdown);
  push(m.electricity_results?.breakdown);
  push(m.electricity_results?.data);

  const root = getBuyPowerResponseRoot(meta);
  if (root) {
    push(root);
    push(root.breakdown);
    push(root.pricing);
    let node: Record<string, unknown> = root;
    for (let depth = 0; depth < 5; depth++) {
      const next = node.data;
      if (!next || typeof next !== 'object') break;
      node = next as Record<string, unknown>;
      push(node);
      push(node.breakdown);
      push(node.pricing);
    }
  }

  const vend = getBuyPowerVendData(meta);
  if (vend) {
    push(vend);
    push(vend.breakdown);
  }

  return sources;
}

/** BuyPower vend breakdown (wallet + DVA after webhook). */
export function getBuyPowerBreakdown(
  meta?: Transaction['metadata'] | null
): BreakdownShape | undefined {
  for (const source of collectTaxSourceRecords(meta)) {
    const bd = source.breakdown as BreakdownShape | undefined;
    if (bd) return bd;
  }
  return meta?.breakdown ?? meta?.electricity_results?.breakdown;
}

function pickTaxFromRecord(record?: Record<string, unknown> | BreakdownShape | null): number | null {
  if (!record) return null;
  const r = record as Record<string, unknown>;

  const direct =
    pickNumber(r.tax) ??
    pickNumber(r.Tax) ??
    pickNumber(r.VAT) ??
    pickNumber(r.vat) ??
    pickNumber(r.vat_amount) ??
    pickNumber(r.vatAmount) ??
    pickNumber(r.tax_amount) ??
    pickNumber(r.taxAmount);

  if (direct != null) return direct;

  const taxNode = r.tax;
  if (taxNode && typeof taxNode === 'object') {
    return pickTaxFromRecord(taxNode as Record<string, unknown>);
  }

  return null;
}

/** VAT from total − amount paid − service charge when tax field is missing. */
function deriveElectricityVatFromTotals(tx: Transaction): number | null {
  const billing = getElectricityBillingFromTransaction(tx);
  if (!billing || billing.totalPaid <= 0) return null;

  const amountPaid = getElectricityAmountPaid(tx);
  const fromPaid = billing.totalPaid - amountPaid - billing.serviceCharge;
  if (fromPaid > 0) return fromPaid;

  const vend = getBuyPowerVendData(tx.metadata);
  const generated =
    pickNumber(vend?.amountGenerated) ?? pickNumber(vend?.amount_generated);
  if (generated != null && generated > 0) {
    const fromGenerated = billing.totalPaid - generated - billing.serviceCharge;
    if (fromGenerated > 0) return fromGenerated;
  }

  return null;
}

/** UI labels — always use resolved payment_method, not payment_type. */
export function getPaymentMethodLabel(paymentMethod?: string | null): string {
  const key = normalizePaymentMethodKey(paymentMethod);
  if (!key) return 'Unknown';
  return PAYMENT_METHOD_LABELS[key] ?? paymentMethod ?? 'Unknown';
}

/**
 * Resolve how the user paid. Backend may omit payment_method on DVA;
 * use metadata.paymentType, actualPaymentMethod, and URL fallback.
 */
export function getPaymentMethodKey(
  tx?: Pick<Transaction, 'payment_method' | 'payment_type' | 'metadata'> | null,
  urlFallback?: string | null
): string {
  const fromUrl = normalizePaymentMethodKey(urlFallback);
  if (
    fromUrl === 'buypower-dva' ||
    fromUrl === 'dva' ||
    fromUrl === 'card' ||
    fromUrl === 'wallet'
  ) {
    return fromUrl;
  }

  const raw = normalizePaymentMethodKey(tx?.payment_method);
  if (raw === 'buypower-dva' || raw === 'dva' || raw === 'card') return raw;

  const meta = tx?.metadata;
  const fromMeta =
    normalizePaymentMethodKey(meta?.actualPaymentMethod) ||
    normalizePaymentMethodKey(meta?.paymentType);

  if (fromMeta === 'buypower-dva' || fromMeta === 'dva') return fromMeta;
  if (fromMeta === 'card' || fromMeta === 'wallet') return fromMeta;

  if (raw === 'wallet' && fromMeta === 'buypower-dva') return 'buypower-dva';

  if (raw) return raw;
  return fromMeta;
}

export function isBankTransferPayment(paymentMethodKey: string): boolean {
  const k = normalizePaymentMethodKey(paymentMethodKey);
  return k === 'dva' || k === 'buypower-dva';
}

/** Card uses electricity_results; wallet & BuyPower DVA use buyPower_response / breakdown. */
export function usesBuyPowerVendPayload(paymentMethodKey: string): boolean {
  return normalizePaymentMethodKey(paymentMethodKey) !== 'card';
}

/** Top-level total_amount is unreliable for DVA until backend formatter is fixed. */
export function shouldTrustTopLevelTotalAmount(tx: Transaction): boolean {
  return !isBankTransferPayment(getPaymentMethodKey(tx));
}

function resolveMetadataTotalPaid(
  sources: {
    dataTotal?: number | string | null;
    expected?: number | string | null;
    breakdownTotal?: number | string | null;
    baseAmount: number;
    serviceCharge: number;
  },
  isDva: boolean,
  txFallback?: Pick<Transaction, 'total_amount' | 'amount_paid'>
): number {
  if (sources.dataTotal != null && sources.dataTotal !== '') {
    return Number(sources.dataTotal);
  }
  if (sources.expected != null && sources.expected !== '') {
    return Number(sources.expected);
  }
  if (sources.breakdownTotal != null && sources.breakdownTotal !== '') {
    return Number(sources.breakdownTotal);
  }
  if (sources.baseAmount > 0 || sources.serviceCharge > 0) {
    return sources.baseAmount + sources.serviceCharge;
  }
  if (!isDva && txFallback) {
    return Number(txFallback.total_amount ?? txFallback.amount_paid ?? 0);
  }
  return 0;
}

export function extractTransactionFromApiPayload(payload: unknown): Transaction | null {
  if (!payload || typeof payload !== 'object') return null;

  const root = payload as Record<string, unknown>;

  if (root.transaction && typeof root.transaction === 'object') {
    return root.transaction as Transaction;
  }

  if (
    typeof root.id === 'string' ||
    typeof root.reference === 'string' ||
    typeof root.order_id === 'string'
  ) {
    return root as Transaction;
  }

  return null;
}

/** Meter customer name — BuyPower vend name, not payer account name. */
export function getTransactionCustomerName(
  tx?: Transaction | null,
  urlFallback?: string | null
): string {
  if (!tx) return urlFallback?.trim() || '';

  const meta = tx.metadata;
  const method = getPaymentMethodKey(tx);
  const isCard = method === 'card';
  const isDva = isBankTransferPayment(method);
  const vend = getBuyPowerVendData(meta);
  const root = getBuyPowerResponseRoot(meta);

  if (isCard) {
    const name =
      pickString(meta?.electricity_results?.data?.name) ||
      pickString(meta?.electricity_results?.name) ||
      pickString(meta?.electricity_data?.name);
    if (name) return name;
  } else {
    const name =
      pickString(vend?.name) ||
      pickString(vend?.customerName) ||
      pickString(vend?.customer_name) ||
      pickString(root?.name) ||
      pickString(meta?.electricity_results?.data?.name);
    if (name) return name;
    if (!isDva) {
      const initName = pickString(meta?.electricity_data?.name);
      if (initName) return initName;
    }
  }

  const cableName = pickString(meta?.cable_data?.customer_name);
  if (cableName) return cableName;

  if (isDva) return urlFallback?.trim() || '';

  const fallback =
    pickString(tx.customer_name) ||
    pickString(tx.customer?.name) ||
    pickString((tx as Transaction & { fullName?: string }).fullName);

  return fallback || urlFallback?.trim() || '';
}

/** Meter / service address from BuyPower vend or init metadata. */
export function getTransactionAddress(
  tx?: Transaction | null,
  urlFallback?: string | null
): string {
  if (!tx) return urlFallback?.trim() || '';

  const meta = tx.metadata;
  const method = getPaymentMethodKey(tx);
  const isCard = method === 'card';

  const vend = getBuyPowerVendData(meta);

  const address = isCard
    ? pickString(meta?.electricity_results?.data?.address) ||
      pickString(meta?.electricity_results?.address) ||
      pickString(meta?.electricity_data?.address)
    : pickString(vend?.address) ||
      pickString(meta?.electricity_data?.address) ||
      pickString(meta?.electricity_results?.data?.address) ||
      pickString(tx.address) ||
      pickString(tx.customer_address);

  return address || urlFallback?.trim() || '';
}

/** Token purchase amount (metadata.electricity_data.amount) — line item before VAT. */
export function getElectricityAmountPaid(tx: Transaction): number {
  const ed = tx.metadata?.electricity_data;
  if (ed?.amount != null) return Number(ed.amount);
  return Number(tx.amount_before_vat ?? tx.amount_paid ?? tx.amount ?? 0);
}

/** Units / energy value (amountGenerated) — not the same as Amount Paid. */
export function getElectricityAmountPurchased(tx: Transaction): number {
  const meta = tx.metadata;
  const method = getPaymentMethodKey(tx);

  if (method === 'card') {
    const v = meta?.electricity_results?.data?.amountGenerated;
    if (v != null) return Number(v);
    return 0;
  }

  const vend = getBuyPowerVendData(meta);
  const generated =
    pickNumber(vend?.amountGenerated) ?? pickNumber(vend?.amount_generated);
  if (generated != null) return generated;

  const fromResults = pickNumber(meta?.electricity_results?.data?.amountGenerated);
  if (fromResults != null) return fromResults;

  if (isBankTransferPayment(method)) {
    const billing = getElectricityBillingFromTransaction(tx);
    if (billing && billing.totalPaid > 0) {
      const amountPaid = getElectricityAmountPaid(tx);
      const derived = billing.totalPaid - billing.serviceCharge - amountPaid;
      if (derived > 0) return derived;
    }
    return 0;
  }

  return pickNumber(meta?.electricity_data?.amount) ?? 0;
}

/** VAT / tax — pricing.vat, buypower breakdown.tax, vend data, or derived from totals. */
export function getElectricityVat(tx: Transaction): number {
  const meta = tx.metadata;
  const method = getPaymentMethodKey(tx);

  const trySources = (): number | null => {
    for (const source of collectTaxSourceRecords(meta)) {
      const tax = pickTaxFromRecord(source);
      if (tax != null && tax > 0) return tax;
    }
    return null;
  };

  if (method === 'card') {
    const tax =
      pickTaxFromRecord(meta?.electricity_results?.data as Record<string, unknown>) ??
      pickNumber(meta?.electricity_results?.tax) ??
      trySources();
    if (tax != null && tax > 0) return tax;
  } else {
    const tax = trySources();
    if (tax != null && tax > 0) return tax;
  }

  const derived = deriveElectricityVatFromTotals(tx);
  if (derived != null && derived > 0) return derived;

  const topLevel = pickNumber(tx.vat);
  if (topLevel != null && topLevel > 0) return topLevel;

  return 0;
}

export function getElectricityBillingFromTransaction(
  tx: Transaction
): ElectricityBillingBreakdown | null {
  const meta = tx.metadata;
  const ed = meta?.electricity_data;
  const method = getPaymentMethodKey(tx);
  const isDva = isBankTransferPayment(method);
  const breakdown = getBuyPowerBreakdown(meta);

  const serviceChargeFixed = Number(
    ed?.service_charge ?? (!isDva ? tx.service_charge : undefined) ?? 0
  );

  let base = 0;
  if (ed?.amount != null) {
    base = Number(ed.amount);
  } else if (!isDva) {
    base = Number(tx.amount_before_vat ?? tx.amount ?? 0);
  }

  if (ed || meta?.expected_amount != null || (tx.service || '').toLowerCase().includes('electric')) {
    if (!base && !isDva) {
      const vend = getBuyPowerVendData(meta);
      const amountGenerated =
        meta?.electricity_results?.data?.amountGenerated ??
        pickNumber(vend?.amountGenerated);
      base = Number(amountGenerated ?? tx.amount_before_vat ?? tx.amount ?? 0);
    }

    const bpRoot = getBuyPowerResponseRoot(meta);
    const totalPaid = resolveMetadataTotalPaid(
      {
        dataTotal: ed?.total_amount,
        expected: meta?.expected_amount,
        breakdownTotal:
          breakdown?.total_amount ??
          breakdown?.user_paid ??
          pickNumber(bpRoot?.total_amount),
        baseAmount: base,
        serviceCharge: serviceChargeFixed,
      },
      isDva,
      tx
    );

    if (base > 0 || totalPaid > 0 || serviceChargeFixed > 0 || ed || isDva) {
      return {
        totalPaid,
        baseAmount: base,
        electricityAmount: base,
        serviceCharge: serviceChargeFixed,
      };
    }
  }

  return null;
}

export function getCableBillingFromTransaction(tx: Transaction): CableBillingBreakdown | null {
  const meta = tx.metadata;
  const cd = meta?.cable_data;
  const method = getPaymentMethodKey(tx);
  const isDva = isBankTransferPayment(method);
  const service = (tx.service || '').toLowerCase();
  const isCable = service.includes('cable') || service.includes('tv');

  if (!isCable && !cd) return null;

  const serviceCharge = Number(
    cd?.service_charge ?? cd?.serviceCharge ?? (!isDva ? tx.service_charge : undefined) ?? 0
  );

  let packageAmount = 0;
  if (cd?.amount != null) {
    packageAmount = Number(cd.amount);
  } else if (!isDva) {
    packageAmount = Number(tx.amount_before_vat ?? tx.amount ?? tx.amount_paid ?? 0);
  }

  const breakdown = cd?.breakdown ?? getBuyPowerBreakdown(meta);

  const totalPaid = resolveMetadataTotalPaid(
    {
      dataTotal: cd?.total_amount,
      expected: meta?.expected_amount,
      breakdownTotal: breakdown?.total_amount ?? breakdown?.user_paid,
      baseAmount: packageAmount,
      serviceCharge,
    },
    isDva,
    tx
  );

  if (packageAmount === 0 && totalPaid === 0 && serviceCharge === 0 && !cd && !isDva) {
    return null;
  }

  return {
    totalPaid,
    baseAmount: packageAmount,
    packageAmount,
    serviceCharge,
  };
}

export function getTrustedTransactionTotal(tx: Transaction): number {
  const cable = getCableBillingFromTransaction(tx);
  if (cable) return cable.totalPaid;
  const electricity = getElectricityBillingFromTransaction(tx);
  if (electricity) return electricity.totalPaid;
  if (shouldTrustTopLevelTotalAmount(tx)) {
    return Number(tx.total_amount ?? tx.amount_paid ?? tx.amount ?? 0);
  }
  return Number(tx.amount_paid ?? tx.amount ?? 0);
}

/** Fields for ReceiptHTML / PDF — electricity & BuyPower DVA. */
export function buildElectricityReceiptPdfFields(
  tx: Transaction,
  options?: { urlPaymentMethod?: string | null; urlCustomerName?: string | null; urlAddress?: string | null }
): {
  payment_method: string;
  paymentMethodLabel: string;
  paymentType: string;
  customerName: string;
  address: string;
  amount_paid: number;
  amountGenerated: number;
  vatAmount: number;
  serviceCharge: number;
  totalAmount: number;
  metadata: Transaction['metadata'];
} {
  const method = getPaymentMethodKey(tx, options?.urlPaymentMethod);
  const billing = getElectricityBillingFromTransaction(tx);
  const useUrlName = !isBankTransferPayment(method);

  return {
    payment_method: method,
    paymentMethodLabel: getPaymentMethodLabel(method),
    paymentType: method,
    customerName: getTransactionCustomerName(
      tx,
      useUrlName ? options?.urlCustomerName : undefined
    ),
    address: getTransactionAddress(tx, options?.urlAddress),
    amount_paid: getElectricityAmountPaid(tx),
    amountGenerated: getElectricityAmountPurchased(tx),
    vatAmount: getElectricityVat(tx),
    serviceCharge: billing?.serviceCharge ?? (Number(tx.service_charge) || 0),
    totalAmount: billing?.totalPaid ?? getTrustedTransactionTotal(tx),
    metadata: tx.metadata,
  };
}

/** Electricity token — card uses electricity_results; wallet/DVA use BuyPower vend payload. */
export function getElectricityTokenFromTransaction(
  tx?: Transaction | null,
  urlFallback?: string | null
): string {
  if (!tx) return pickString(urlFallback);

  const method = getPaymentMethodKey(tx);
  if (method === 'card') {
    return (
      pickString(tx.metadata?.electricity_results?.data?.token) ||
      pickString(tx.token) ||
      pickString(urlFallback)
    );
  }

  const vend = getBuyPowerVendData(tx.metadata);
  return (
    pickString(vend?.token) ||
    pickString(tx.metadata?.buyPower_response?.data?.token) ||
    pickString(tx.token) ||
    pickString(urlFallback)
  );
}

/** Electricity units — same source rules as token. */
export function getElectricityUnitsFromTransaction(
  tx?: Transaction | null,
  urlFallback?: string | null
): string {
  if (!tx) return pickString(urlFallback);

  const method = getPaymentMethodKey(tx);
  if (method === 'card') {
    return (
      pickString(tx.metadata?.electricity_results?.data?.units) ||
      pickString(tx.units) ||
      pickString(urlFallback)
    );
  }

  const vend = getBuyPowerVendData(tx.metadata);
  return (
    pickString(vend?.units) ||
    pickString(tx.metadata?.buyPower_response?.data?.units) ||
    pickString(tx.units) ||
    pickString(urlFallback)
  );
}

/** Apply resolved payment_method + label on a transaction for display. */
export function enrichTransactionForDisplay(tx: Transaction): Transaction {
  const method = getPaymentMethodKey(tx);
  return {
    ...tx,
    payment_method: method || tx.payment_method,
    paymentMethodLabel: getPaymentMethodLabel(method || tx.payment_method),
  };
}
