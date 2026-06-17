import { MOCK_VIRTUAL_ACCOUNT } from '@/data/businessMocks';

export const MIN_WALLET_FUND_AMOUNT = 1000;
export const MAX_WALLET_FUND_AMOUNT = 500_000;
export const WALLET_FUND_INVOICE_TTL_MS = 30 * 60 * 1000;

export type MockWalletFundInvoice = {
  reference: string;
  transaction_id: string;
  amount: number;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  expires_at: string;
};

export type MockCardFundInit = {
  reference: string;
  authorization_url: string;
};

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createMockWalletFundInvoice(amount: number): MockWalletFundInvoice {
  const expiresAt = new Date(Date.now() + WALLET_FUND_INVOICE_TTL_MS);

  return {
    reference: `BEL-BIZ-FUND-${Date.now()}`,
    transaction_id: `tx-fund-${Date.now()}`,
    amount,
    bank_name: MOCK_VIRTUAL_ACCOUNT.bankName,
    bank_code: '035',
    account_number: `${8923456780 + Math.floor(Math.random() * 9000)}`,
    account_name: MOCK_VIRTUAL_ACCOUNT.accountName,
    expires_at: expiresAt.toISOString(),
  };
}

export async function mockInitWalletCardFund(amount: number): Promise<MockCardFundInit> {
  await delay(900);
  return {
    reference: `BEL-BIZ-CARD-${Date.now()}`,
    authorization_url: 'https://checkout.paystack.com/demo',
  };
}

export function getRemainingFundSeconds(expiresAt: string): number {
  const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}

export function formatFundCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function mockPollWalletFundPayment(
  transactionId: string,
  onPending?: () => void,
): Promise<'completed' | 'failed' | 'expired'> {
  onPending?.();
  await delay(2800);

  if (transactionId.includes('fail-demo')) {
    return 'failed';
  }

  return 'completed';
}
