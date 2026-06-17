import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';
import { getElectricityAmountPaid } from '@/lib/transaction-display';

export function getBusinessBuyAgainPath(transaction: BusinessTransactionDetail): string {
  const service = transaction.service.toLowerCase();

  if (service === 'wallet' || transaction.entryType === 'credit') {
    return '/business/wallet/fund';
  }

  if (service === 'electricity') {
    const params = new URLSearchParams({
      meterNumber: transaction.meter_number || transaction.metadata?.meter || '',
      disco: transaction.metadata?.disco || transaction.provider || '',
      amount: String(getElectricityAmountPaid(transaction) || transaction.amount_paid || ''),
      type: transaction.metadata?.vendType || 'prepaid',
    });
    return `/business/payments/electricity?${params.toString()}`;
  }

  if (service === 'cable') {
    const params = new URLSearchParams({
      smartCardNumber:
        transaction.smartcard_number ||
        transaction.metadata?.cable_data?.smartCardNumber ||
        '',
      provider: transaction.provider || '',
      amount: String(transaction.amount_paid || transaction.amount || ''),
      package: transaction.package_name || transaction.metadata?.cable_data?.packageName || '',
    });
    return `/business/payments/cable?${params.toString()}`;
  }

  if (service === 'data') {
    const params = new URLSearchParams({
      phoneNumber: transaction.phone_number || transaction.metadata?.phone || '',
      network: transaction.provider || transaction.metadata?.network || '',
      amount: String(transaction.amount_paid || transaction.amount || ''),
      dataPlan: transaction.data_plan || transaction.metadata?.dataBundle || '',
    });
    return `/business/payments/data?${params.toString()}`;
  }

  if (service === 'airtime') {
    const params = new URLSearchParams({
      phoneNumber: transaction.phone_number || transaction.metadata?.phone || '',
      network: transaction.provider || transaction.metadata?.network || '',
      amount: String(transaction.amount_paid || transaction.amount || ''),
    });
    return `/business/payments/airtime?${params.toString()}`;
  }

  return '/business/payments/airtime';
}

export function getBusinessBuyAgainLabel(transaction: BusinessTransactionDetail): string {
  if (transaction.service.toLowerCase() === 'wallet' || transaction.entryType === 'credit') {
    return 'Fund wallet';
  }
  return 'Buy Again';
}
