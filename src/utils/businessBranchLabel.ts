/** Display branch for company-scoped txs (null / empty / dash → Head Office). */
export function formatBusinessBranchLabel(
  branchName: string | null | undefined,
): string {
  const value = String(branchName || '').trim();
  if (!value || value === '—' || value.toLowerCase() === 'n/a') {
    return 'Head Office';
  }
  return value;
}
