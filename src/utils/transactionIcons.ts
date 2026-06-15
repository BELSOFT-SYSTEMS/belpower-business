/**
 * Transaction / provider icons — aligned with belpower-frontend iconUtils
 */

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
  const providerLower = (discoCode || '').toLowerCase();
  const discoMap: Record<string, string> = {
    aedc: '/aedc.png',
    abuja: '/aedc.png',
    ekedc: '/ekedc.png',
    eko: '/ekedc.png',
    ikedc: '/ikedc.png',
    ikeja: '/ikedc.png',
    ibadan: '/ibedc.png',
    ibedc: '/ibedc.png',
    enugu: '/eedc.png',
    eedc: '/eedc.png',
    jos: '/jedc.png',
    jedc: '/jedc.png',
    kaduna: '/kaedc.png',
    kaedc: '/kaedc.png',
    kaedco: '/kaedc.png',
    kano: '/kedc.png',
    kedco: '/kedc.png',
    ph: '/phedc.jpeg',
    phedc: '/phedc.jpeg',
    phed: '/phedc.jpeg',
    benin: '/bedc.png',
    bedc: '/bedc.png',
    yola: '/yedc.png',
    yedc: '/yedc.png',
  };
  return discoMap[providerLower] || '/electricity.png';
}
