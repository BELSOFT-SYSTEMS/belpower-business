/** Display branch for company-scoped txs (null / empty / dash → Head Office). */
export function formatBusinessBranchLabel(
  branchName: string | null | undefined,
): string {
  const value = String(branchName ?? '').trim();
  const normalized = value.toLowerCase();
  if (
    !value ||
    value === '—' ||
    value === '-' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'nil' ||
    normalized === 'null' ||
    normalized === 'undefined'
  ) {
    return 'Head Office';
  }
  return value;
}
