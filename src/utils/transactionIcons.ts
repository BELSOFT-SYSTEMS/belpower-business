/**
 * Transaction / provider icons — aligned with belpower-frontend iconUtils
 */

import { getDiscoLogoPath } from '@/utils/discoLogoMap';

export type TransactionIconInput = {
  type: string;
  provider?: string;
};

export function getTransactionIcon(transaction: TransactionIconInput): string {
  const type = (transaction.type || '').toLowerCase();

  if (type === 'deposit' || type === 'wallet' || type === 'refund') {
    return '/wallet.png';
  }

  if (['airtime', 'data'].includes(type)) {
    const providerLower = (transaction.provider || '').toLowerCase();
    const providerMap: Record<string, string> = {
      mtn: '/mtn.svg',
      airtel: '/airtel.svg',
      glo: '/glo.svg',
      '9mobile': '/9mobile.svg',
      etisalat: '/9mobile.svg',
    };
    return providerMap[providerLower] || `/${providerLower}.svg`;
  }

  if (type === 'cable') {
    const providerLower = (transaction.provider || '').toLowerCase();
    const cableMap: Record<string, string> = {
      dstv: '/dstv.svg',
      gotv: '/gotv.jpg',
      startimes: '/startimes.svg',
      showmax: '/showmax.png',
    };
    return cableMap[providerLower] || '/Tv.png';
  }

  if (type === 'electricity') {
    return getDiscoIcon(transaction.provider || '');
  }

  const typeMap: Record<string, string> = {
    airtime: '/airtime.png',
    data: '/data.png',
    cable: '/Tv.png',
    electricity: '/electricity.png',
  };
  return typeMap[type] || '/electricity.png';
}

export function getDiscoIcon(discoCode: string): string {
  return getDiscoLogoPath(discoCode);
}

/** Provider logo for receipt PDF header — matches belpower-admin / frontend. */
export function getProviderLogo(provider: string, type: string): string {
  return getTransactionIcon({ type, provider });
}
