/**
 * Resolve bill provider for icons/labels from API list or detail payloads.
 * List rows often only have disco/network inside metadata until hydrated by detail.
 */
export function resolveBusinessTransactionProvider(input: {
  provider?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = input.metadata || {};
  const candidates = [
    input.provider,
    meta.provider,
    meta.disco,
    meta.network,
  ];

  for (const candidate of candidates) {
    if (candidate == null || typeof candidate === 'object') continue;
    const value = String(candidate).trim();
    const normalized = value.toLowerCase();
    if (
      !value ||
      value === '—' ||
      value === '-' ||
      normalized === 'n/a' ||
      normalized === 'na' ||
      normalized === 'nil' ||
      normalized === 'null' ||
      normalized === 'undefined' ||
      normalized === 'unknown'
    ) {
      continue;
    }
    return value;
  }

  return '';
}
