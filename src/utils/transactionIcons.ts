/**
 * Transaction / provider icons — aligned with belpower-frontend `iconUtils.ts`.
 * All paths resolve from `/public` (e.g. `/mtn.svg`, `/aedc.png`, `/dstv.svg`).
 */

import { getDiscoLogoPath } from '@/utils/discoLogoMap';

export type TransactionIconInput = {
  type?: string;
  service?: string;
  provider?: string | null;
  payment_for?: string;
};

/** Telco logos in /public — same keys as belpower-frontend. */
const TELCO_LOGO_MAP: Record<string, string> = {
  mtn: '/mtn.svg',
  airtel: '/airtel.svg',
  glo: '/glo.svg',
  '9mobile': '/9mobile.svg',
  etisalat: '/9mobile.svg',
  '9-mobile': '/9mobile.svg',
  ninemobile: '/9mobile.svg',
};

/** Cable logos in /public — same keys as belpower-frontend. */
const CABLE_LOGO_MAP: Record<string, string> = {
  dstv: '/dstv.svg',
  gotv: '/gotv.jpg',
  startimes: '/startimes.svg',
  startime: '/startimes.svg',
  showmax: '/showmax.png',
};

const TYPE_FALLBACK_MAP: Record<string, string> = {
  airtime: '/airtime.png',
  data: '/data.png',
  cable: '/Tv.png',
  electricity: '/electricity.png',
  deposit: '/wallet.png',
  wallet: '/wallet.png',
};

function isBlankProvider(provider?: string | null): boolean {
  const value = String(provider || '').trim().toLowerCase();
  return (
    !value ||
    value === '—' ||
    value === '-' ||
    value === 'n/a' ||
    value === 'na' ||
    value === 'nil' ||
    value === 'null' ||
    value === 'undefined' ||
    value === 'unknown'
  );
}

function normalizeProviderKey(provider?: string | null): string {
  if (isBlankProvider(provider)) return '';
  return String(provider)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '');
}

/**
 * Resolve bill type the same way frontend does from type/service/payment_for,
 * plus business wallet service names.
 */
function resolveDisplayType(transaction: TransactionIconInput): string {
  const type = String(transaction.type || '').toLowerCase();
  const service = String(transaction.service || '').toLowerCase();
  const paymentFor = String(transaction.payment_for || '').toLowerCase();

  for (const value of [type, service, paymentFor]) {
    if (!value) continue;
    if (value.includes('airtime') || value === 'vtu') return 'airtime';
    if (value.includes('data')) return 'data';
    if (value.includes('cable') || value === 'tv') return 'cable';
    if (value.includes('electric')) return 'electricity';
    if (
      value === 'deposit' ||
      value === 'wallet' ||
      value.includes('wallet_fund') ||
      value.includes('funding') ||
      value.includes('allocate') ||
      value.includes('transfer') ||
      value.startsWith('business_wallet')
    ) {
      return 'deposit';
    }
  }

  return type || service || paymentFor || '';
}

/**
 * Same mapping as belpower-frontend `getTransactionIcon`.
 */
export function getTransactionIcon(transaction: TransactionIconInput): string {
  const displayType = resolveDisplayType(transaction);
  const provider = transaction.provider;
  const providerKey = normalizeProviderKey(provider);

  if (displayType === 'deposit') return '/wallet.png';

  // Airtime / data → /mtn.svg, /airtel.svg, …
  if (displayType === 'airtime' || displayType === 'data') {
    if (providerKey && TELCO_LOGO_MAP[providerKey]) {
      return TELCO_LOGO_MAP[providerKey];
    }
    if (providerKey) {
      return `/${providerKey}.svg`;
    }
    return TYPE_FALLBACK_MAP[displayType];
  }

  // Cable → /dstv.svg, /gotv.jpg, /startimes.svg, …
  if (displayType === 'cable') {
    if (providerKey && CABLE_LOGO_MAP[providerKey]) {
      return CABLE_LOGO_MAP[providerKey];
    }
    if (providerKey) {
      return `/${providerKey}.svg`;
    }
    return '/Tv.png';
  }

  // Electricity → disco files in /public via discoLogoMap
  if (displayType === 'electricity') {
    return getDiscoLogoPath(String(provider || ''));
  }

  return TYPE_FALLBACK_MAP[displayType] || '/electricity.png';
}

/** Same fallbacks as belpower-frontend `getTransactionIconFallback`. */
export function getTransactionIconFallback(type?: string | null): string {
  const normalized = resolveDisplayType({ type: type || undefined, service: type || undefined });
  if (normalized === 'deposit') return '/wallet.png';
  if (normalized === 'electricity') return '/electricity.png';
  if (normalized === 'cable') return '/Tv.png';
  if (normalized === 'airtime') return '/airtime.png';
  if (normalized === 'data') return '/data.png';
  return '/electricity.png';
}

export function getDiscoIcon(discoCode: string): string {
  return getDiscoLogoPath(discoCode);
}

/**
 * Same as belpower-frontend `getProviderLogo` — public asset paths for all bills.
 */
export function getProviderLogo(provider: string, type: string): string {
  const displayType = resolveDisplayType({ type, provider });
  const providerKey = normalizeProviderKey(provider);

  if (!providerKey) {
    return getTransactionIcon({ type: displayType || type, provider });
  }

  if (displayType === 'electricity' || type === 'electricity') {
    return getDiscoLogoPath(provider);
  }

  if (TELCO_LOGO_MAP[providerKey]) {
    return TELCO_LOGO_MAP[providerKey];
  }

  if (CABLE_LOGO_MAP[providerKey]) {
    return CABLE_LOGO_MAP[providerKey];
  }

  // Banks (also in public/)
  const bankLogos: Record<string, string> = {
    uba: '/uba.png',
    zenith: '/zenith.png',
  };
  if (bankLogos[providerKey]) {
    return bankLogos[providerKey];
  }

  return getTransactionIcon({ type: displayType || type, provider });
}
