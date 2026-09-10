export const MIN_WALLET_FUND_AMOUNT = 1000;
export const MAX_WALLET_FUND_AMOUNT = 500_000;
export const WALLET_FUND_INVOICE_TTL_MS = 30 * 60 * 1000;

export type WalletFundInvoice = {
  reference: string;
  transaction_id: string;
  amount: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  expires_at: string;
  base_amount?: number;
  buypower_processing_fee?: number;
  requested_credit?: number;
};

export function getRemainingFundSeconds(expiresAt: string): number {
  const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}

export function formatFundCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function pollWalletFundPayment(
  fetchStatus: () => Promise<'completed' | 'failed' | 'expired' | 'pending'>,
  onPending?: () => void,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<'completed' | 'failed' | 'expired'> {
  const maxAttempts = options?.maxAttempts ?? 24;
  const intervalMs = options?.intervalMs ?? 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    onPending?.();
    const status = await fetchStatus();
    if (status === 'completed' || status === 'failed' || status === 'expired') {
      return status;
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  return 'expired';
}
