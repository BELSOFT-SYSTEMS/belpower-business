import { businessApiRequest } from '@/lib/businessApi';
import type { BusinessSchedule } from '@/types/business';

export type CreateSchedulePayload = {
  serviceType: 'airtime' | 'data' | 'electricity' | 'cable';
  serviceProvider: string;
  recipient: string;
  amount: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  planId?: string | null;
  planName?: string | null;
  vendType?: string | null;
  phone?: string | null;
  branchId?: string | null;
};

export const businessSchedulesApi = {
  list() {
    return businessApiRequest<BusinessSchedule[]>('/schedules', {
      method: 'GET',
      auth: true,
    });
  },

  create(payload: CreateSchedulePayload) {
    return businessApiRequest<BusinessSchedule>('/schedules', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(id: string, action: 'pause' | 'resume' | 'cancel') {
    return businessApiRequest<BusinessSchedule>(`/schedules/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ action }),
    });
  },
};
