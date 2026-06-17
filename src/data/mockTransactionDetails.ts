import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';
import { MOCK_TRANSACTIONS } from '@/data/businessMocks';

const BASE_PAYER = {
  fullName: 'Belba Ngoy',
  email: 'belba@acmecorp.ng',
  phoneNumber: '08012345678',
};

function baseFromPreview(id: string): BusinessTransactionDetail | null {
  const preview = MOCK_TRANSACTIONS.find((tx) => tx.id === id);
  if (!preview) return null;

  return {
    id: preview.id,
    reference: preview.reference,
    order_id: `ORD-${preview.id.toUpperCase()}`,
    receipt_number: `RCP-${preview.id.toUpperCase()}`,
    type: preview.entryType,
    status: preview.status,
    payment_method: preview.entryType === 'credit' ? 'buypower-dva' : 'wallet',
    payment_type: 'WALLET',
    amount_paid: preview.amount,
    service_charge: preview.entryType === 'credit' ? 0 : 500,
    discount: 0,
    total_amount: preview.amount,
    amount: preview.amount,
    created_at: preview.createdAt,
    completed_at: preview.status === 'completed' ? preview.createdAt : null,
    is_scheduled: false,
    scheduled_info: null,
    service: preview.service,
    provider: preview.provider,
    branchName: preview.branchName,
    userName: preview.userName,
    entryType: preview.entryType,
    ...BASE_PAYER,
    fullName: preview.userName,
  };
}

export const MOCK_TRANSACTION_DETAILS: Record<string, BusinessTransactionDetail> = {
  'tx-0': {
    ...baseFromPreview('tx-0')!,
    service: 'wallet',
    provider: 'bank_transfer',
    payment_method: 'buypower-dva',
    payment_type: 'BANK_TRANSFER',
    service_charge: 0,
    amount_paid: 500000,
    total_amount: 500000,
    metadata: {
      paymentType: 'buypower-dva',
      actualPaymentMethod: 'buypower-dva',
    },
  },
  'tx-1': {
    ...baseFromPreview('tx-1')!,
    meter_number: '45012345678',
    amount_paid: 82000,
    service_charge: 500,
    total_amount: 85000,
    amount_before_vat: 82000,
    vat: 2500,
    metadata: {
      disco: 'ABUJA',
      meter: '45012345678',
      electricity_data: {
        name: 'Acme Corp Head Office',
        address: '12 Ahmadu Bello Way, Central Business District, Abuja',
        phone: '08012345678',
        disco: 'ABUJA',
        meter: '45012345678',
        amount: 82000,
        service_charge: 500,
        total_amount: 85000,
      },
      buyPower_response: {
        total_amount: 85000,
        data: {
          name: 'Acme Corp Head Office',
          address: '12 Ahmadu Bello Way, Central Business District, Abuja',
          amountGenerated: 82000,
          tax: 2500,
          token: '1234-5678-9012-3456-7890',
          units: 156.4,
        },
      },
    },
  },
  'tx-2': {
    ...baseFromPreview('tx-2')!,
    phone_number: '08098765432',
    amount_paid: 49500,
    service_charge: 500,
    total_amount: 50000,
    metadata: {
      phone: '08098765432',
      network: 'mtn',
      provider: 'mtn',
    },
  },
  'tx-3': {
    ...baseFromPreview('tx-3')!,
    status: 'pending',
    completed_at: null,
    phone_number: '08123456789',
    amount_paid: 24500,
    service_charge: 500,
    total_amount: 25000,
    metadata: {
      phone: '08123456789',
      network: 'airtel',
      dataBundle: '10GB — 30 days',
      provider: 'airtel',
    },
    data_plan: '10GB — 30 days',
    bundleSize: '10GB',
  },
  'tx-4': {
    ...baseFromPreview('tx-4')!,
    smartcard_number: '70345678901',
    package_name: 'DStv Compact Plus',
    amount_paid: 24000,
    service_charge: 500,
    total_amount: 24500,
    metadata: {
      cable_data: {
        provider: 'dstv',
        packageName: 'DStv Compact Plus',
        package: 'DStv Compact Plus',
        smartCardNumber: '70345678901',
        customer_name: 'Chioma Eze',
        amount: 24000,
        service_charge: 500,
        total_amount: 24500,
      },
    },
  },
  'tx-5': {
    ...baseFromPreview('tx-5')!,
    status: 'failed',
    completed_at: null,
    status_code: 422,
    meter_number: '04123456789',
    amount_paid: 119500,
    service_charge: 500,
    total_amount: 120000,
    metadata: {
      disco: 'IKEJA',
      meter: '04123456789',
      electricity_data: {
        name: 'Lagos Branch Office',
        address: '45 Marina Street, Lagos Island, Lagos',
        phone: '08087654321',
        disco: 'IKEJA',
        meter: '04123456789',
        amount: 119500,
        service_charge: 500,
        total_amount: 120000,
      },
    },
  },
  'tx-6': {
    ...baseFromPreview('tx-6')!,
    phone_number: '07012345678',
    amount_paid: 9500,
    service_charge: 500,
    total_amount: 10000,
    metadata: {
      phone: '07012345678',
      network: 'glo',
      provider: 'glo',
    },
  },
};

export function getMockTransactionDetailById(id: string): BusinessTransactionDetail | null {
  return MOCK_TRANSACTION_DETAILS[id] ?? null;
}
