import { businessApiRequest } from '@/lib/businessApi';
import type { BusinessNotification } from '@/types/business';

export const businessNotificationsApi = {
  list(limit = 20) {
    return businessApiRequest<BusinessNotification[]>(
      `/notifications?limit=${encodeURIComponent(String(limit))}`,
      { method: 'GET', auth: true },
    );
  },

  markRead(id: string) {
    return businessApiRequest<BusinessNotification | { updated: number }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: 'PATCH', auth: true },
    );
  },

  markAllRead() {
    return businessNotificationsApi.markRead('all');
  },
};
