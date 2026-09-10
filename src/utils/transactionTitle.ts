import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';

function normalizeService(transaction: BusinessTransactionDetail): string {
  return String(transaction.service || transaction.type || '').toLowerCase();
}

export function isBusinessWalletFundingTx(transaction: BusinessTransactionDetail): boolean {
  const service = normalizeService(transaction);
  return (
    service === 'wallet' ||
    service === 'business_wallet_funding' ||
    service.includes('wallet_fund') ||
    service.includes('funding') ||
    service === 'deposit'
  );
}

export function isBusinessWalletAllocateTx(transaction: BusinessTransactionDetail): boolean {
  const service = normalizeService(transaction);
  return service.includes('allocate') || service.includes('transfer');
}

export function getTransactionTitle(transaction: BusinessTransactionDetail): string {
  const service = transaction.service || '';
  const provider = transaction.provider || '';
  const type = transaction.type || '';

  if (isBusinessWalletAllocateTx(transaction)) {
    return transaction.entryType === 'debit' ? 'Funds allocated' : 'Allocation received';
  }

  if (isBusinessWalletFundingTx(transaction) || type === 'credit') {
    return 'Wallet Funding';
  }

  if (service === 'Unknown' && provider === 'Unknown') {
    return type === 'credit' ? 'Wallet Top-up' : 'Transaction';
  }

  if (service && provider && provider !== 'Unknown' && provider !== '—') {
    return `${service.charAt(0).toUpperCase()}${service.slice(1)} — ${provider.toUpperCase()}`;
  }

  if (service && service !== 'Unknown') {
    return service.charAt(0).toUpperCase() + service.slice(1);
  }

  return type === 'credit' ? 'Wallet Top-up' : 'Payment';
}
