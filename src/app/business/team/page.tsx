'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockBranchesForRole, getMockTeamForRole } from '@/data/businessMocks';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';
import type { BusinessRole } from '@/types/business';

const INVITE_ROLES: BusinessRole[] = [
  'finance_manager',
  'operations_officer',
  'viewer',
];

export default function TeamPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const team = getMockTeamForRole(role);
  const branches = getMockBranchesForRole(role);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<BusinessRole>('operations_officer');
  const [inviteBranch, setInviteBranch] = useState(branches[0]?.name ?? '');

  const resetInviteForm = () => {
    setInviteRole('operations_officer');
    setInviteBranch(branches[0]?.name ?? '');
  };

  const handleInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const roleValue = String(form.get('role') ?? 'operations_officer');
    const branchValue = String(form.get('branch') ?? '');
    setInviteOpen(false);
    resetInviteForm();
    toast.success(`Invitation sent to ${email} (demo)`);
    toast.message(
      `Invite link: /business/accept-invite?email=${encodeURIComponent(email)}&role=${roleValue}&branch=${encodeURIComponent(branchValue)}`
    );
  };

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
            onClick={() => {
              resetInviteForm();
              setInviteOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <UserPlus className="h-4 w-4" />
            Invite user
          </button>
        )}
      </div>

      {team.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Invite colleagues to help manage utility payments."
          action={
            canAccess('team.invite') ? (
              <button
                type="button"
                onClick={() => {
              resetInviteForm();
              setInviteOpen(true);
            }}
                className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
              >
                Invite user
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
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
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{member.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {formatAdminRoleLabel(member.role)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {member.branchName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
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
      )}

      <BusinessFormModal
        open={inviteOpen}
        title="Invite team member"
        description="Send an invitation email with a link to create their account."
        submitLabel="Send invitation"
        onClose={() => {
          setInviteOpen(false);
          resetInviteForm();
        }}
        onSubmit={handleInvite}
      >
        <input
          required
          name="email"
          type="email"
          placeholder="Work email"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <BusinessSelect
          name="role"
          value={inviteRole}
          onChange={(value) => setInviteRole(value as BusinessRole)}
          options={INVITE_ROLES.map((roleOption) => ({
            value: roleOption,
            label: formatAdminRoleLabel(roleOption),
          }))}
        />
        <BusinessSelect
          name="branch"
          value={inviteBranch}
          onChange={setInviteBranch}
          options={branches.map((branch) => ({
            value: branch.name,
            label: branch.name,
          }))}
        />
      </BusinessFormModal>
    </div>
  );
}
