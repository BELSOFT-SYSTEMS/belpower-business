'use client';

import { UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockTeamForRole } from '@/data/businessMocks';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';

export default function TeamPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const team = getMockTeamForRole(role);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Team management"
          description="Invite users and assign roles. One Finance Manager org-wide; Operations Officers are branch-scoped."
        />
        {canAccess('team.invite') && (
          <button
            type="button"
            onClick={() => toast.message('Invite user — API coming soon')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <UserPlus className="h-4 w-4" />
            Invite user
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/80">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3 text-gray-900">{formatAdminRoleLabel(member.role)}</td>
                <td className="px-4 py-3 text-gray-600">{member.branchName ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={member.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {member.lastActiveAt
                    ? formatDistanceToNow(new Date(member.lastActiveAt), { addSuffix: true })
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
