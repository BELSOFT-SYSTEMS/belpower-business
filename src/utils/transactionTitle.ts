import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';

export function getTransactionTitle(transaction: BusinessTransactionDetail): string {
  const service = transaction.service || '';
  const provider = transaction.provider || '';
  const type = transaction.type || '';

  if (
    type === 'credit' ||
    service.toLowerCase().includes('wallet') ||
    service.toLowerCase().includes('fund') ||
    service.toLowerCase().includes('deposit')
  ) {
    return 'Wallet Funding';
  }

  if (service === 'Unknown' && provider === 'Unknown') {
    return type === 'credit' ? 'Wallet Top-up' : 'Transaction';
  }

  if (service && provider && provider !== 'Unknown') {
    return `${service.charAt(0).toUpperCase()}${service.slice(1)} — ${provider.toUpperCase()}`;
  }

  if (service && service !== 'Unknown') {
    return service.charAt(0).toUpperCase() + service.slice(1);
  }

  return type === 'credit' ? 'Wallet Top-up' : 'Payment';
}
