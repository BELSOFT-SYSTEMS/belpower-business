import { businessApiRequest } from '@/lib/businessApi';
import type { BusinessAnalyticsData } from '@/types/business';

export const businessAnalyticsApi = {
  get(params?: { from?: string; to?: string }) {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const qs = query.toString();
    return businessApiRequest<BusinessAnalyticsData>(`/analytics${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      auth: true,
    });
  },
};
