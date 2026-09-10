import { businessApiRequest } from '@/lib/businessApi';
import type { BusinessRole, BusinessTeamMember } from '@/types/business';

export type InviteTeamPayload = {
  email: string;
  role: BusinessRole;
  branchId?: string | null;
  firstName?: string;
  lastName?: string;
};

export type InvitePreview = {
  email: string;
  role: BusinessRole;
  branchName: string | null;
  firstName?: string;
  lastName?: string;
};

export const businessTeamApi = {
  list() {
    return businessApiRequest<BusinessTeamMember[]>('/team', {
      method: 'GET',
      auth: true,
    });
  },

  invite(payload: InviteTeamPayload) {
    return businessApiRequest<{ member: BusinessTeamMember; inviteUrl: string }>('/team/invite', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  update(
    id: string,
    payload: { role?: BusinessRole; status?: 'active' | 'suspended' | 'invited'; branchId?: string | null },
  ) {
    return businessApiRequest<BusinessTeamMember>(`/team/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    });
  },

  remove(id: string) {
    return businessApiRequest<{ id: string; status: string }>(`/team/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  invitePreview(token: string) {
    return businessApiRequest<InvitePreview>(
      `/auth/invite-preview?token=${encodeURIComponent(token)}`,
      { method: 'GET', auth: false },
    );
  },

  acceptInvite(payload: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
  }) {
    return businessApiRequest<{ user: unknown }>('/auth/accept-invite', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(payload),
    });
  },
};
