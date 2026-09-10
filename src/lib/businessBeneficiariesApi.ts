import { businessApiRequest } from '@/lib/businessApi';
import type { BusinessBeneficiary } from '@/types/business';

export type CreateBusinessBeneficiaryPayload = {
  label: string;
  service: BusinessBeneficiary['service'];
  provider: string;
  accountNumber: string;
  branchId?: string | null;
  meterType?: 'prepaid' | 'postpaid' | null;
  customerName?: string | null;
  address?: string | null;
  isPrimary?: boolean;
  verified?: boolean;
};

export const businessBeneficiariesApi = {
  list(service?: BusinessBeneficiary['service']) {
    const query = service ? `?service=${encodeURIComponent(service)}` : '';
    return businessApiRequest<BusinessBeneficiary[]>(`/beneficiaries${query}`, {
      method: 'GET',
      auth: true,
    });
  },

  create(payload: CreateBusinessBeneficiaryPayload) {
    return businessApiRequest<BusinessBeneficiary>('/beneficiaries', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: { label?: string; branchId?: string | null; isPrimary?: boolean },
  ) {
    return businessApiRequest<BusinessBeneficiary>(`/beneficiaries/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string) {
    return businessApiRequest<{ id: string; deleted: boolean }>(`/beneficiaries/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
