import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';
import type { ReceiptTransaction } from '@/components/receipt/ReceiptHTML';
import { getDiscoDisplayName } from '@/constants/discoNames';
import {
  buildElectricityReceiptPdfFields,
  getCableBillingFromTransaction,
  getElectricityTokenFromTransaction,
  getElectricityUnitsFromTransaction,
  getPaymentMethodKey,
  getPaymentMethodLabel,
  getTransactionAddress,
  getTransactionCustomerName,
  getTrustedTransactionTotal,
} from '@/lib/transaction-display';

function getReceiptStatus(status: string): {
  statusLabel: string;
  statusClass: 'success' | 'pending' | 'failed';
} {
  if (status === 'completed') {
    return { statusLabel: 'Success', statusClass: 'success' };
  }
  if (status === 'failed') {
    return { statusLabel: 'Failed', statusClass: 'failed' };
  }
  return {
    statusLabel: status.charAt(0).toUpperCase() + status.slice(1),
    statusClass: 'pending',
  };
}

function normalizeReceiptType(service: string, entryType: string): string {
  const normalized = service.toLowerCase();
  if (normalized === 'wallet' || entryType === 'credit') return 'deposit';
  return normalized;
}

export function mapBusinessTransactionToReceipt(
  detail: BusinessTransactionDetail,
): ReceiptTransaction {
  const type = normalizeReceiptType(detail.service, detail.entryType);
  const paymentMethod = getPaymentMethodKey(detail);
  const paymentMethodLabel = getPaymentMethodLabel(paymentMethod);
  const { statusLabel, statusClass } = getReceiptStatus(detail.status);
  const providerLabel =
    type === 'electricity'
      ? getDiscoDisplayName(detail.metadata?.disco || detail.provider)
      : detail.provider;

  const base: ReceiptTransaction = {
    id: detail.id,
    date: detail.completed_at ?? detail.created_at,
    type,
    service: type === 'deposit' ? 'Wallet' : detail.service,
    provider: providerLabel,
    reference: detail.reference,
    transactionRef: detail.reference,
    orderId: detail.order_id,
    order_id: detail.order_id,
    receipt_number: detail.receipt_number,
    receiptNumber: detail.receipt_number,
    phoneNumber: detail.phone_number ?? detail.phoneNumber,
    phone_number: detail.phone_number ?? detail.phoneNumber,
    meterNumber: detail.meter_number ?? detail.metadata?.meter,
    meter_number: detail.meter_number ?? detail.metadata?.meter,
    smartCardNumber: detail.smartcard_number,
    smartcard_number: detail.smartcard_number,
    packageName: detail.package_name,
    bundleSize: detail.data_plan ?? detail.bundleSize ?? detail.metadata?.dataBundle,
    token: getElectricityTokenFromTransaction(detail) || detail.token,
    units: getElectricityUnitsFromTransaction(detail) ?? detail.units,
    customerName: getTransactionCustomerName(detail),
    address: getTransactionAddress(detail),
    payer: detail.userName,
    fullName: detail.userName,
    customerEmail: detail.email,
    customerPhone: detail.phoneNumber ?? detail.phone_number,
    payment_method: paymentMethod,
    paymentType: paymentMethod,
    paymentMethodLabel,
    depositType: type === 'deposit' ? paymentMethodLabel : undefined,
    statusLabel,
    statusClass,
    discount: detail.discount ?? 0,
    metadata: detail.metadata,
  };

  if (type === 'electricity') {
    const pdfFields = buildElectricityReceiptPdfFields(detail);
    return {
      ...base,
      ...pdfFields,
      token: getElectricityTokenFromTransaction(detail) || detail.token,
      units: getElectricityUnitsFromTransaction(detail) ?? detail.units,
      provider: getDiscoDisplayName(detail.metadata?.disco || detail.provider),
    };
  }

  if (type === 'cable') {
    const billing = getCableBillingFromTransaction(detail);
    return {
      ...base,
      amount_paid: billing?.packageAmount ?? detail.amount_paid,
      vatAmount: 0,
      serviceCharge: billing?.serviceCharge ?? detail.service_charge,
      service_charge: billing?.serviceCharge ?? detail.service_charge,
      totalAmount: billing?.totalPaid ?? getTrustedTransactionTotal(detail),
      total_amount: billing?.totalPaid ?? getTrustedTransactionTotal(detail),
    };
  }

  if (type === 'deposit') {
    return {
      ...base,
      amount_paid: detail.total_amount,
      vatAmount: 0,
      serviceCharge: 0,
      service_charge: 0,
      totalAmount: detail.total_amount,
      total_amount: detail.total_amount,
    };
  }

  return {
    ...base,
    amount_paid: detail.amount_paid,
    vatAmount: detail.vat ?? 0,
    serviceCharge: detail.service_charge,
    service_charge: detail.service_charge,
    totalAmount: getTrustedTransactionTotal(detail),
    total_amount: getTrustedTransactionTotal(detail),
  };
}

export function getBusinessReceiptScheduleProps(detail: BusinessTransactionDetail) {
  return {
    isScheduled: Boolean(detail.is_scheduled && detail.scheduled_info),
    frequency: detail.scheduled_info?.frequency ?? '',
    nextPurchaseDate: detail.scheduled_info?.next_purchase ?? '',
  };
}
