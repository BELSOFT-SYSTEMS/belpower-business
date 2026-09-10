/**
 * Centralized DISCO logo paths — shared by receipts, transactions, and electricity flows.
 * Keep in sync with belpower-frontend `discoLogoMap.ts` (public/ assets).
 */

const IBEDC = '/ibedc.jpeg';
const GENERIC = '/electricity.png';

export const DISCO_LOGO_MAP: Record<string, string> = {
  // Short codes
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

  // BuyPower / business API codes
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

  // DFET slugs
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

  // Full provider names (transaction history / receipts) — belpower-frontend
  'abuja electricity distribution company': '/aedc.png',
  'eko electricity distribution company': '/ekedc.png',
  'ikeja electric': '/ikedc.png',
  'ikeja electricity distribution company': '/ikedc.png',
  'kaduna electric': '/kaedc.png',
  'kaduna electricity distribution company': '/kaedc.png',
  'port harcourt': '/phedc.jpeg',
  'port harcourt electricity distribution company': '/phedc.jpeg',
  'benin electricity distribution company': '/bedc.png',
  'enugu electricity distribution company': '/eedc.png',
  'ibadan electricity distribution company': IBEDC,
  'jos electricity distribution company': '/jedc.png',
  'kano electricity distribution company': '/kedco.png',
  'yola electricity distribution company': '/yedc.png',
};

export function normalizeDiscoKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');
}

export function getDiscoLogoPath(providerOrCode: string): string {
  if (!providerOrCode) return GENERIC;
  const key = normalizeDiscoKey(providerOrCode);
  if (DISCO_LOGO_MAP[key]) return DISCO_LOGO_MAP[key];

  // Compact key without spaces (e.g. PortHarcourt)
  const compact = key.replace(/\s+/g, '');
  if (DISCO_LOGO_MAP[compact]) return DISCO_LOGO_MAP[compact];

  return GENERIC;
}
