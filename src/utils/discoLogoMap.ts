/**
 * Centralized DISCO logo paths — shared by receipts, transactions, and service availability UI.
 * Keep in sync with belpower-frontend `discoLogoMap.ts`.
 */

const IBEDC = '/ibedc.jpeg';
const GENERIC = '/electricity.png';

export const DISCO_LOGO_MAP: Record<string, string> = {
  aedc: '/aedc.png',
  ekedc: '/ekedc.png',
  ikedc: '/ikedc.png',
  kaedc: '/kaedc.png',
  kaedco: '/kaedc.png',
  phedc: '/phedc.jpeg',
  phed: '/phedc.jpeg',
  ibedc: IBEDC,
  bedc: '/bedc.png',
  eedc: '/eedc.png',
  jedc: '/jedc.png',
  kedco: '/kedco.png',
  yedc: '/yedc.png',
  abuja: '/aedc.png',
  eko: '/ekedc.png',
  ikeja: '/ikedc.png',
  kaduna: '/kaedc.png',
  kano: '/kedco.png',
  jos: '/jedc.png',
  enugu: '/eedc.png',
  benin: '/bedc.png',
  yola: '/yedc.png',
  ibadan: IBEDC,
  ph: '/phedc.jpeg',
  portharcourt: '/phedc.jpeg',
  'abuja-electric': '/aedc.png',
  'eko-electric': '/ekedc.png',
  'ikeja-electric': '/ikedc.png',
  'kaduna-electric': '/kaedc.png',
  'kano-electric': '/kedco.png',
  'jos-electric': '/jedc.png',
  'enugu-electric': '/eedc.png',
  'benin-electric': '/bedc.png',
  'yola-electric': '/yedc.png',
  'ibadan-electric': IBEDC,
  'portharcourt-electric': '/phedc.jpeg',
};

export function normalizeDiscoKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/_/g, '-');
}

export function getDiscoLogoPath(providerOrCode: string): string {
  if (!providerOrCode) return GENERIC;
  const key = normalizeDiscoKey(providerOrCode);
  return DISCO_LOGO_MAP[key] || GENERIC;
}
