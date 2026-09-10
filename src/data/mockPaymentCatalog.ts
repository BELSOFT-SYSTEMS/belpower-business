import { getDiscoDisplayName } from '@/constants/discoNames';

export type AirtimeNetworkId = 'mtn' | 'airtel' | 'glo' | '9mobile';
export type CableProviderId = 'dstv' | 'gotv' | 'startimes' | 'showmax';
export type PaymentService = 'airtime' | 'data' | 'electricity' | 'cable';
export type MeterType = 'prepaid' | 'postpaid';

export type CatalogProvider = {
  id: string;
  name: string;
  logo: string;
};

export type DataPlan = {
  id: string;
  network: AirtimeNetworkId;
  name: string;
  validity: string;
  amount: number;
};

export type CablePackage = {
  id: string;
  provider: CableProviderId;
  name: string;
  amount: number;
};

export type MeterLookup = {
  customerName: string;
  address: string;
  disco: string;
  meterType: MeterType;
  outstanding: number | null;
};

export type SmartcardLookup = {
  customerName: string;
  provider: CableProviderId;
  currentPackage: string | null;
};

export const AIRTIME_MIN = 50;
export const AIRTIME_MAX = 50_000;
export const ELECTRICITY_MIN = 500;
export const ELECTRICITY_MAX = 500_000;

export const AIRTIME_PRESETS = [100, 200, 500, 1000, 2000, 5000];

export const AIRTIME_NETWORKS: CatalogProvider[] = [
  { id: 'mtn', name: 'MTN', logo: '/mtn.svg' },
  { id: 'airtel', name: 'Airtel', logo: '/airtel.svg' },
  { id: 'glo', name: 'Glo', logo: '/glo.svg' },
  { id: '9mobile', name: '9mobile', logo: '/9mobile.svg' },
];

export const CABLE_PROVIDERS: CatalogProvider[] = [
  { id: 'dstv', name: 'DStv', logo: '/dstv.svg' },
  { id: 'gotv', name: 'GOtv', logo: '/gotv.jpg' },
  { id: 'startimes', name: 'StarTimes', logo: '/startimes.svg' },
  { id: 'showmax', name: 'Showmax', logo: '/showmax.png' },
];

export const ELECTRICITY_DISCOS: CatalogProvider[] = [
  { id: 'ABUJA', name: 'Abuja (AEDC)', logo: '/aedc.png' },
  { id: 'EKO', name: 'Eko (EKEDC)', logo: '/ekedc.png' },
  { id: 'IKEJA', name: 'Ikeja (IKEDC)', logo: '/ikedc.png' },
  { id: 'IBADAN', name: 'Ibadan (IBEDC)', logo: '/ibedc.jpeg' },
  { id: 'ENUGU', name: 'Enugu (EEDC)', logo: '/eedc.png' },
  { id: 'PH', name: 'Port Harcourt (PHED)', logo: '/phedc.jpeg' },
  { id: 'JOS', name: 'Jos (JED)', logo: '/jedc.png' },
  { id: 'KADUNA', name: 'Kaduna (KAEDC)', logo: '/kaedc.png' },
  { id: 'KANO', name: 'Kano (KEDCO)', logo: '/kedco.png' },
  { id: 'BENIN', name: 'Benin (BEDC)', logo: '/bedc.png' },
  { id: 'YOLA', name: 'Yola (YEDC)', logo: '/yedc.png' },
];

export const DATA_PLANS: DataPlan[] = [
  { id: 'mtn-1gb-d', network: 'mtn', name: '1GB', validity: '1 day', amount: 350 },
  { id: 'mtn-1-5gb-d', network: 'mtn', name: '1.5GB', validity: '2 days', amount: 500 },
  { id: 'mtn-2gb-d', network: 'mtn', name: '2GB', validity: '2 days', amount: 600 },
  { id: 'mtn-3gb-w', network: 'mtn', name: '3GB', validity: '7 days', amount: 1000 },
  { id: 'mtn-6gb-w', network: 'mtn', name: '6GB', validity: '7 days', amount: 1500 },
  { id: 'mtn-10gb-w', network: 'mtn', name: '10GB', validity: '7 days', amount: 2500 },
  { id: 'mtn-20gb-m', network: 'mtn', name: '20GB', validity: '30 days', amount: 5000 },
  { id: 'mtn-40gb-m', network: 'mtn', name: '40GB', validity: '30 days', amount: 8000 },
  { id: 'mtn-75gb-m', network: 'mtn', name: '75GB', validity: '30 days', amount: 15000 },
  { id: 'airtel-1gb-d', network: 'airtel', name: '1GB', validity: '1 day', amount: 300 },
  { id: 'airtel-2gb-d', network: 'airtel', name: '2GB', validity: '2 days', amount: 500 },
  { id: 'airtel-3gb-w', network: 'airtel', name: '3.5GB', validity: '7 days', amount: 1500 },
  { id: 'airtel-6gb-w', network: 'airtel', name: '6GB', validity: '7 days', amount: 2000 },
  { id: 'airtel-10gb-m', network: 'airtel', name: '10GB', validity: '30 days', amount: 3000 },
  { id: 'airtel-18gb-m', network: 'airtel', name: '18GB', validity: '30 days', amount: 4000 },
  { id: 'airtel-25gb-m', network: 'airtel', name: '25GB', validity: '30 days', amount: 5000 },
  { id: 'airtel-40gb-m', network: 'airtel', name: '40GB', validity: '30 days', amount: 8000 },
  { id: 'glo-1gb-d', network: 'glo', name: '1GB', validity: '1 day', amount: 300 },
  { id: 'glo-2gb-d', network: 'glo', name: '2GB', validity: '2 days', amount: 500 },
  { id: 'glo-5gb-w', network: 'glo', name: '5GB', validity: '7 days', amount: 1500 },
  { id: 'glo-8gb-w', network: 'glo', name: '8GB', validity: '7 days', amount: 2000 },
  { id: 'glo-15gb-m', network: 'glo', name: '15GB', validity: '30 days', amount: 4000 },
  { id: 'glo-25gb-m', network: 'glo', name: '25GB', validity: '30 days', amount: 6000 },
  { id: 'glo-40gb-m', network: 'glo', name: '40GB', validity: '30 days', amount: 9000 },
  { id: '9m-1gb-d', network: '9mobile', name: '1.5GB', validity: '1 day', amount: 500 },
  { id: '9m-2gb-d', network: '9mobile', name: '2GB', validity: '2 days', amount: 700 },
  { id: '9m-4gb-w', network: '9mobile', name: '4GB', validity: '7 days', amount: 1200 },
  { id: '9m-7gb-w', network: '9mobile', name: '7GB', validity: '7 days', amount: 2000 },
  { id: '9m-15gb-m', network: '9mobile', name: '15GB', validity: '30 days', amount: 4000 },
  { id: '9m-25gb-m', network: '9mobile', name: '25GB', validity: '30 days', amount: 6000 },
  { id: '9m-40gb-m', network: '9mobile', name: '40GB', validity: '30 days', amount: 9000 },
];

export const CABLE_PACKAGES: CablePackage[] = [
  { id: 'dstv-padi', provider: 'dstv', name: 'Padi', amount: 4400 },
  { id: 'dstv-yanga', provider: 'dstv', name: 'Yanga', amount: 6000 },
  { id: 'dstv-confam', provider: 'dstv', name: 'Confam', amount: 11000 },
  { id: 'dstv-compact', provider: 'dstv', name: 'Compact', amount: 19000 },
  { id: 'dstv-compact-plus', provider: 'dstv', name: 'Compact Plus', amount: 30000 },
  { id: 'dstv-premium', provider: 'dstv', name: 'Premium', amount: 44500 },
  { id: 'dstv-premium-asia', provider: 'dstv', name: 'Premium Asia', amount: 48500 },
  { id: 'dstv-premium-french', provider: 'dstv', name: 'Premium French', amount: 52000 },
  { id: 'gotv-smallie', provider: 'gotv', name: 'Smallie', amount: 1900 },
  { id: 'gotv-jinja', provider: 'gotv', name: 'Jinja', amount: 3900 },
  { id: 'gotv-jolli', provider: 'gotv', name: 'Jolli', amount: 5800 },
  { id: 'gotv-max', provider: 'gotv', name: 'Max', amount: 8500 },
  { id: 'gotv-supa', provider: 'gotv', name: 'Supa', amount: 11400 },
  { id: 'gotv-supa-plus', provider: 'gotv', name: 'Supa Plus', amount: 16800 },
  { id: 'gotv-max-plus', provider: 'gotv', name: 'Max Plus', amount: 12500 },
  { id: 'st-nova', provider: 'startimes', name: 'Nova', amount: 1700 },
  { id: 'st-basic', provider: 'startimes', name: 'Basic', amount: 4000 },
  { id: 'st-smart', provider: 'startimes', name: 'Smart', amount: 5200 },
  { id: 'st-classic', provider: 'startimes', name: 'Classic', amount: 7500 },
  { id: 'st-super', provider: 'startimes', name: 'Super', amount: 9000 },
  { id: 'st-chinese', provider: 'startimes', name: 'Chinese', amount: 11000 },
  { id: 'st-unique', provider: 'startimes', name: 'Unique', amount: 13500 },
  { id: 'sm-mobile', provider: 'showmax', name: 'Mobile', amount: 1600 },
  { id: 'sm-standard', provider: 'showmax', name: 'Standard', amount: 3200 },
  { id: 'sm-pro', provider: 'showmax', name: 'Pro', amount: 6300 },
  { id: 'sm-pro-sports', provider: 'showmax', name: 'Pro Sports', amount: 8200 },
  { id: 'sm-mobile-sports', provider: 'showmax', name: 'Mobile Sports', amount: 2900 },
  { id: 'sm-standard-sports', provider: 'showmax', name: 'Standard Sports', amount: 4900 },
  { id: 'sm-annual', provider: 'showmax', name: 'Annual Standard', amount: 32000 },
];

const KNOWN_METERS: Record<string, Omit<MeterLookup, 'disco' | 'meterType'>> = {
  '45022530096': {
    customerName: 'Belsoft Systems Ltd',
    address: '12 Adetokunbo Ademola, Victoria Island, Lagos',
    outstanding: null,
  },
  '62123456789': {
    customerName: 'Belsoft Systems — Abuja Branch',
    address: 'Plot 14 Gana Street, Maitama, Abuja',
    outstanding: null,
  },
  '04187654321': {
    customerName: 'Belsoft Systems — Lagos Branch',
    address: '18 Adeola Odeku, Victoria Island, Lagos',
    outstanding: 24600,
  },
};

const KNOWN_SMARTCARDS: Record<string, Omit<SmartcardLookup, 'provider'>> = {
  '7012345678': { customerName: 'Belsoft Systems Ltd', currentPackage: 'Compact' },
  '8023456789': { customerName: 'Belsoft Systems — Lagos Branch', currentPackage: 'Jolli' },
};

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createPaymentReference(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BP-${prefix}-${stamp}${rand}`;
}

export function createVendToken(): string {
  const chunk = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return `0${digits.slice(3)}`;
  return digits;
}

export function isValidNigerianPhone(value: string): boolean {
  return /^0[7-9]\d{9}$/.test(normalizePhone(value));
}

export function detectNetworkFromPhone(value: string): AirtimeNetworkId | null {
  const phone = normalizePhone(value);
  const prefix = phone.slice(0, 4);
  const mtn = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906'];
  const airtel = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0907'];
  const glo = ['0805', '0807', '0705', '0815', '0811', '0905'];
  const nine = ['0809', '0817', '0818', '0909', '0908'];
  if (mtn.includes(prefix)) return 'mtn';
  if (airtel.includes(prefix)) return 'airtel';
  if (glo.includes(prefix)) return 'glo';
  if (nine.includes(prefix)) return '9mobile';
  return null;
}

export function getDataPlansForNetwork(network: string): DataPlan[] {
  return DATA_PLANS.filter((plan) => plan.network === network);
}

export function getCablePackages(provider: string): CablePackage[] {
  return CABLE_PACKAGES.filter((item) => item.provider === provider);
}

export function findDataPlan(idOrName: string, network?: string): DataPlan | undefined {
  const key = idOrName.trim().toLowerCase();
  return DATA_PLANS.find((plan) => {
    if (network && plan.network !== network) return false;
    return (
      plan.id === idOrName ||
      plan.name.toLowerCase() === key ||
      `${plan.name} ${plan.validity}`.toLowerCase() === key
    );
  });
}

export function findCablePackage(idOrName: string, provider?: string): CablePackage | undefined {
  const key = idOrName.trim().toLowerCase();
  return CABLE_PACKAGES.find((item) => {
    if (provider && item.provider !== provider) return false;
    return item.id === idOrName || item.name.toLowerCase() === key;
  });
}

export function resolveDiscoCode(code: string): string {
  const key = code.trim().toUpperCase().replace(/\s/g, '_');
  if (!key) return 'ABUJA';
  const aliases: Record<string, string> = {
    IKEDC: 'IKEJA',
    EKEDC: 'EKO',
    AEDC: 'ABUJA',
    IBEDC: 'IBADAN',
    PHED: 'PH',
    PHEDC: 'PH',
    KAEDC: 'KADUNA',
    KEDCO: 'KANO',
    JEDC: 'JOS',
    BEDC: 'BENIN',
    YEDC: 'YOLA',
    EEDC: 'ENUGU',
  };
  // Preserve live BuyPower disco codes (APLE, BH, …); only map known aliases.
  return aliases[key] ?? key;
}

export function getProviderName(service: PaymentService, providerId: string): string {
  if (service === 'electricity') {
    const upper = providerId.trim().toUpperCase();
    return (
      ELECTRICITY_DISCOS.find((item) => item.id === upper)?.name ??
      getDiscoDisplayName(upper) ??
      providerId
    );
  }
  if (service === 'cable') {
    return CABLE_PROVIDERS.find((item) => item.id === providerId)?.name ?? providerId;
  }
  return AIRTIME_NETWORKS.find((item) => item.id === providerId)?.name ?? providerId;
}

export function getProviderLogo(service: PaymentService, providerId: string): string {
  if (service === 'electricity') {
    return ELECTRICITY_DISCOS.find((item) => item.id === providerId)?.logo ?? '/electricity.png';
  }
  if (service === 'cable') {
    return CABLE_PROVIDERS.find((item) => item.id === providerId)?.logo ?? '/cable.png';
  }
  return AIRTIME_NETWORKS.find((item) => item.id === providerId)?.logo ?? '/phone.png';
}

export function getPaymentBlockReason(args: {
  amount: number;
  balance: number;
  frozen: boolean;
  todaySpend: number;
  dailyLimit: number;
}): string | null {
  if (args.frozen) return 'This wallet is frozen. Payments are paused.';
  if (!Number.isFinite(args.amount) || args.amount <= 0) return 'Enter a valid amount.';
  if (args.amount > args.balance) return 'Amount exceeds the available wallet balance.';
  if (args.todaySpend + args.amount > args.dailyLimit) {
    return 'This payment would exceed the daily spend limit.';
  }
  return null;
}

export async function mockLookupMeter(
  meterNumber: string,
  disco: string,
  meterType: MeterType,
): Promise<MeterLookup> {
  await wait(700);
  const digits = meterNumber.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) {
    throw new Error('Enter a 10–13 digit meter number.');
  }
  if (digits.endsWith('0000')) {
    throw new Error('Meter not found on this disco.');
  }

  const known = KNOWN_METERS[digits];
  if (known) {
    return {
      ...known,
      disco,
      meterType,
      outstanding: meterType === 'postpaid' ? known.outstanding ?? 18450 : null,
    };
  }

  return {
    customerName: 'Belsoft Systems Ltd',
    address: 'Registered service address',
    disco,
    meterType,
    outstanding: meterType === 'postpaid' ? 18450 : null,
  };
}

export async function mockLookupSmartcard(
  smartCardNumber: string,
  provider: CableProviderId,
): Promise<SmartcardLookup> {
  await wait(700);
  const digits = smartCardNumber.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 12) {
    throw new Error('Enter a valid smartcard or IUC number.');
  }
  if (digits.endsWith('0000')) {
    throw new Error('Smartcard not found for this provider.');
  }

  const known = KNOWN_SMARTCARDS[digits];
  return {
    customerName: known?.customerName ?? 'Belsoft Systems Ltd',
    provider,
    currentPackage: known?.currentPackage ?? null,
  };
}

export async function mockCompletePayment(): Promise<void> {
  await wait(900);
}
