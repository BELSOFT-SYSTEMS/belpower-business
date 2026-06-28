/** Mirrors belpower-frontend `types/transaction.ts` for Phase 3 API parity. */

export type BusinessTransactionDetail = {
  id: string;
  reference: string;
  order_id: string;
  receipt_number: string;
  type: string;
  status: string;
  payment_method: string;
  payment_type: string;
  paymentMethodLabel?: string;
  amount_paid: number;
  service_charge: number;
  discount: number;
  total_amount: number;
  amount?: number;
  created_at: string;
  completed_at: string | null;
  is_scheduled: boolean;
  scheduled_info: null | {
    frequency: string;
    next_purchase: string;
  };
  service: string;
  provider: string;
  meter_number?: string;
  amount_before_vat?: number;
  vat?: number;
  units?: number;
  token?: string;
  address?: string;
  customer_name?: string;
  phone_number?: string;
  data_plan?: string;
  bouquet?: string;
  smartcard_number?: string;
  plan_code?: string;
  package_name?: string;
  bundleSize?: string;
  description?: string;
  status_code?: number | string;
  fullName: string;
  email: string;
  phoneNumber: string;
  branchName: string;
  userName: string;
  entryType: 'credit' | 'debit';
  metadata?: {
    paymentType?: string;
    actualPaymentMethod?: string;
    provider?: string;
    package?: string;
    smartCardNumber?: string;
    phone?: string;
    network?: string;
    disco?: string;
    breakdown?: {
      user_paid?: string | number;
      total_amount?: string | number;
      tax?: string | number;
    };
    tariffClass?: string;
    electricity_results?: {
      name?: string;
      address?: string;
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      tax?: number;
      data?: {
        name?: string;
        address?: string;
        amountGenerated?: number;
        tax?: number;
        token?: string;
        units?: string | number;
      };
    };
    electricity_data?: {
      name?: string;
      address?: string;
      phone?: string;
      disco?: string;
      meter?: string;
      amount?: number;
      service_charge?: number;
      total_amount?: number;
    };
    expected_amount?: number;
    requested_amount?: number | string;
    pricing?: {
      total_amount?: number;
      service_charge?: number;
      vat?: number;
      tax?: number;
      electricity_amount?: number;
    };
    buypower_response?: {
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      total_amount?: number;
      data?: {
        name?: string;
        address?: string;
        amountGenerated?: number;
        tax?: number;
        token?: string;
        units?: string | number;
      };
      dataBundle?: string;
    };
    buyPower_response?: {
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      total_amount?: number;
      dataBundle?: string;
      data?: {
        name?: string;
        address?: string;
        amountGenerated?: number;
        tax?: number;
        token?: string;
        units?: string | number;
      };
    };
    cable_data?: {
      provider?: string;
      packageName?: string;
      package?: string;
      smartCardNumber?: string;
      breakdown?: {
        user_paid?: string | number;
        total_amount?: string | number;
        tax?: string | number;
      };
      tariffClass?: string;
      amount?: number;
      service_charge?: number;
      serviceCharge?: number;
      smartcard_number?: string;
      customer_name?: string;
      total_amount?: number;
    };
    dataBundle?: string;
    meter?: string;
    isScheduled?: boolean;
    frequency?: string;
    nextPurchaseDate?: string;
    vendType?: string;
  };
  data?: {
    data?: {
      name?: string;
      address?: string;
      token?: string;
    };
  };
  customer?: {
    name?: string;
  };
  electricity?: {
    customer_name?: string;
    token?: string;
  };
  user_paid?: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
