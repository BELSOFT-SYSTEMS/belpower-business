/**
 * Transaction / provider icons — aligned with belpower-frontend iconUtils
 */

import { getDiscoLogoPath } from '@/utils/discoLogoMap';

export type TransactionIconInput = {
  type?: string;
  service?: string;
  provider?: string | null;
  payment_for?: string;
};

function normalizeProviderKey(provider?: string | null): string {
  const value = String(provider || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (
    !value ||
    value === '—' ||
    value === '-' ||
    value === 'n/a' ||
    value === 'na' ||
    value === 'nil' ||
    value === 'null' ||
    value === 'undefined' ||
    value === 'unknown'
  ) {
    return '';
  }
  return value;
}

function resolveDisplayType(transaction: TransactionIconInput): string {
  const candidates = [
    transaction.type,
    transaction.service,
    transaction.payment_for,
  ]
    .map((value) => String(value || '').toLowerCase())
    .filter(Boolean);

  for (const value of candidates) {
    if (value.includes('airtime')) return 'airtime';
    if (value.includes('data')) return 'data';
    if (value.includes('cable') || value.includes('tv')) return 'cable';
    if (value.includes('electric')) return 'electricity';
    if (
      value === 'deposit' ||
      value === 'wallet' ||
      value.includes('wallet_fund') ||
      value.includes('funding') ||
      value.includes('allocate') ||
      value === 'business_wallet_funding' ||
      value === 'business_wallet_allocate' ||
      value === 'business_wallet_transfer'
    ) {
      return 'deposit';
    }
  }

  return candidates[0] || '';
}

export function getTransactionIcon(transaction: TransactionIconInput): string {
  const type = resolveDisplayType(transaction);
  const providerLower = normalizeProviderKey(transaction.provider);

  if (type === 'deposit') {
    return '/wallet.png';
  }

  if (type === 'airtime' || type === 'data') {
    const providerMap: Record<string, string> = {
      mtn: '/mtn.svg',
      airtel: '/airtel.svg',
      glo: '/glo.svg',
      '9mobile': '/9mobile.svg',
      etisalat: '/9mobile.svg',
      '9-mobile': '/9mobile.svg',
    };
    if (providerLower && providerMap[providerLower]) {
      return providerMap[providerLower];
    }
    if (providerLower) {
      return `/${providerLower}.svg`;
    }
    return type === 'data' ? '/data.png' : '/airtime.png';
  }

  if (type === 'cable') {
    const cableMap: Record<string, string> = {
      dstv: '/dstv.svg',
      gotv: '/gotv.jpg',
      startimes: '/startimes.svg',
      showmax: '/showmax.png',
    };
    if (providerLower && cableMap[providerLower]) {
      return cableMap[providerLower];
    }
    return '/Tv.png';
  }

  if (type === 'electricity') {
    return getDiscoIcon(providerLower);
  }

  const typeMap: Record<string, string> = {
    airtime: '/airtime.png',
    data: '/data.png',
    cable: '/Tv.png',
    electricity: '/electricity.png',
    deposit: '/wallet.png',
  };
  return typeMap[type] || '/electricity.png';
}

export function getTransactionIconFallback(type?: string | null): string {
  const normalized = resolveDisplayType({ type: type || undefined });
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

/** Provider logo for receipt PDF header — matches belpower-admin / frontend. */
export function getProviderLogo(provider: string, type: string): string {
  return getTransactionIcon({ type, provider });
}
