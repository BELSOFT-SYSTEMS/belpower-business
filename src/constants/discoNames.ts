/** Shared DISCO display names — aligned with belpower-frontend `constants/discoNames.ts` */

export const DISCO_NAMES: Record<string, string> = {
  ABUJA: 'Abuja Electricity Distribution Company',
  ACCESSPOWER: 'ACCESSPOWER',
  EKO: 'Eko Electricity Distribution Company',
  IKEJA: 'Ikeja Electricity Distribution Company',
  IBADAN: 'Ibadan Electricity Distribution Company',
  ENUGU: 'Enugu Electricity Distribution Company',
  PH: 'Port Harcourt Electricity Distribution Company',
  JOS: 'Jos Electricity Distribution',
  KADUNA: 'Kaduna Electricity Distribution Company',
  KANO: 'Kano Electricity Distribution Company',
  BH: 'Brains & Hammers, Life Camp',
  APLE: 'Aba Power Limited Electricity Company',
  BENIN: 'Benin Electricity Distribution Company',
  KAIDA: 'Streamaco',
  KOIOS: 'KOIOS Renewable Energy',
  YOLA: 'Yola Electricity Distribution Company',
  SAO_ENERGIES: 'Sao Energies',
  DARWAY_COAST: 'Darway Coast',
  BUY_POWER_1: 'Buypower X Streamaco 1',
  BUY_POWER_2: 'Buypower X Streamaco 2',
  BUY_POWER_3: 'Buypower X Streamaco 3',
  KAIDA_STS: 'STEAMACO-STS',
  ASHIPA: 'Ashipa',
  MASKH: 'Maskh',
  ARAROMI: 'Araromi Obu',
  UKNIAF: 'EEDC UKNIAF Agborou-Onuorie Pilot',
  BUC: 'Bonny Utility Company',
  ENERCON: 'Enercon Nigeria',
  MEGAPLAZA: 'Mega Plaza',
  NESCO: 'Nigerian Electricity Supply Corporation',
  CENECO: 'Aiyegun',
};

/** Alternate API/backend codes mapped to canonical DISCO_NAMES keys. */
const DISCO_CODE_ALIASES: Record<string, keyof typeof DISCO_NAMES> = {
  IKEDC: 'IKEJA',
  EKEDC: 'EKO',
  AEDC: 'ABUJA',
  IBEDC: 'IBADAN',
  PHED: 'PH',
  KAEDC: 'KADUNA',
  KEDCO: 'KANO',
  JEDC: 'JOS',
  BEDC: 'BENIN',
  YEDC: 'YOLA',
};

export type ElectricityProviderOption = {
  code: string;
  name: string;
};

/** Same fallback list belpower-frontend onboarding uses when the providers API is unavailable. */
export function getElectricityProviderOptions(): ElectricityProviderOption[] {
  return Object.entries(DISCO_NAMES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getDiscoDisplayName(code: string): string {
  const key = code?.toUpperCase().replace(/\s/g, '_') ?? '';
  const resolved = DISCO_CODE_ALIASES[key] ?? key;
  return DISCO_NAMES[resolved] ?? code;
}
