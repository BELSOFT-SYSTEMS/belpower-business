'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreVertical, Trash2, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  canDeleteTeamMember,
  getAssignableRolesForInviter,
  isBranchAdminRole,
  isSuperAdminRole,
  roleRequiresBranch,
} from '@/constants/businessRoles';
import { getMockBranchesForRole, getMockTeamForRole, HEAD_OFFICE_BRANCH_ID } from '@/data/businessMocks';
import { formatAdminRoleLabel, formatRoleScopeLabel } from '@/utils/businessRoleDisplay';
import type { BusinessRole, BusinessTeamMember } from '@/types/business';

export default function TeamPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const branches = getMockBranchesForRole(role);
  const assignableRoles = getAssignableRolesForInviter(role);
  const canInvite = canAccess('team.invite') && assignableRoles.length > 0;
  const canManageTeam = canAccess('team.manage') && isSuperAdminRole(role);

  const [team, setTeam] = useState<BusinessTeamMember[]>(() => getMockTeamForRole(role));
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessTeamMember | null>(null);

  useEffect(() => {
    setTeam(getMockTeamForRole(role));
    setMenuOpenId(null);
    setDeleteTarget(null);
  }, [role]);

  const inviteBranches = useMemo(() => {
    if (isSuperAdminRole(role)) {
      return branches;
    }
    if (isBranchAdminRole(role)) {
      return branches.filter((branch) => branch.id === user?.branchId || branch.name === user?.branchName);
    }
    return branches;
  }, [branches, role, user?.branchId, user?.branchName]);

  const defaultInviteRole = assignableRoles.includes('branch_operations')
    ? 'branch_operations'
    : (assignableRoles[0] ?? 'branch_operations');

  const defaultInviteBranch =
    inviteBranches.find((branch) => branch.id === user?.branchId)?.name ??
    inviteBranches.find((branch) => !branch.isHeadOffice)?.name ??
    inviteBranches[0]?.name ??
    '';

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<BusinessRole>(defaultInviteRole);
  const [inviteBranch, setInviteBranch] = useState(defaultInviteBranch);

  const needsBranch = roleRequiresBranch(inviteRole);
  const branchOptions = useMemo(() => {
    if (!needsBranch) {
      return branches
        .filter((branch) => branch.id === HEAD_OFFICE_BRANCH_ID || branch.isHeadOffice)
        .map((branch) => ({ value: branch.name, label: branch.name }));
    }
    return inviteBranches
      .filter((branch) => !branch.isHeadOffice)
      .map((branch) => ({ value: branch.name, label: branch.name }));
  }, [branches, inviteBranches, needsBranch]);

  const resetInviteForm = () => {
    setInviteRole(defaultInviteRole);
    if (roleRequiresBranch(defaultInviteRole)) {
      setInviteBranch(defaultInviteBranch);
    } else {
      setInviteBranch(branches.find((branch) => branch.isHeadOffice)?.name ?? 'Head Office');
    }
  };

  const handleInviteRoleChange = (value: string) => {
    const nextRole = value as BusinessRole;
    setInviteRole(nextRole);
    if (roleRequiresBranch(nextRole)) {
      setInviteBranch(
        inviteBranches.find((branch) => !branch.isHeadOffice)?.name ?? defaultInviteBranch,
      );
    } else {
      setInviteBranch(branches.find((branch) => branch.isHeadOffice)?.name ?? 'Head Office');
    }
  };

  const handleInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const roleValue = String(form.get('role') ?? defaultInviteRole);
    const branchValue = String(form.get('branch') ?? '');
    setInviteOpen(false);
    resetInviteForm();
    toast.success(`Invitation sent to ${email} (demo)`);
    toast.message(
      `Invite link: /business/accept-invite?email=${encodeURIComponent(email)}&role=${roleValue}&branch=${encodeURIComponent(branchValue)}`,
    );
  };

  const memberCanBeDeleted = (member: BusinessTeamMember) =>
    canDeleteTeamMember(role, member.role, {
      actorUserId: user?.id,
      targetUserId: member.id,
    });

  const handleConfirmDelete = () => {
    if (!deleteTarget || !memberCanBeDeleted(deleteTarget)) return;
    const name = `${deleteTarget.firstName} ${deleteTarget.lastName}`;
    setTeam((current) => current.filter((member) => member.id !== deleteTarget.id));
    setDeleteTarget(null);
    setMenuOpenId(null);
    toast.success(`${name} removed from team (demo)`);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Team management"
          description={
            isSuperAdminRole(role)
              ? 'Create Head Office and branch roles across the company. Remove any member except Super Admin when needed.'
              : isBranchAdminRole(role)
                ? `Invite Admin, Finance, Ops, and Viewer for ${user?.branchName ?? 'your branch'} only.`
                : 'View team members for your scope.'
          }
        />
        {canInvite && (
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
            canInvite ? (
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
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last active</th>
                  {canManageTeam ? <th className="px-4 py-3 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.map((member) => {
                  const canDelete = canManageTeam && memberCanBeDeleted(member);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{member.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                        {formatAdminRoleLabel(member.role)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatRoleScopeLabel(member.role)}
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
                      {canManageTeam ? (
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {canDelete ? (
                            <div className="relative inline-flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuOpenId((current) =>
                                    current === member.id ? null : member.id,
                                  )
                                }
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label={`${member.firstName} ${member.lastName} actions`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {menuOpenId === member.id ? (
                                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      setDeleteTarget(member);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove member
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BusinessFormModal
        open={inviteOpen}
        title="Invite team member"
        description={
          isSuperAdminRole(role)
            ? 'Assign a Head Office or branch role, then send the invite.'
            : 'Invite someone to your branch with a branch-level role.'
        }
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
          onChange={handleInviteRoleChange}
          options={assignableRoles.map((roleOption) => ({
            value: roleOption,
            label: formatAdminRoleLabel(roleOption),
          }))}
        />
        <BusinessSelect
          name="branch"
          value={inviteBranch}
          onChange={setInviteBranch}
          disabled={isBranchAdminRole(role) || (!needsBranch && !isSuperAdminRole(role))}
          options={
            branchOptions.length > 0
              ? branchOptions
              : [{ value: inviteBranch || 'Head Office', label: inviteBranch || 'Head Office' }]
          }
        />
      </BusinessFormModal>

      <BusinessFormModal
        open={Boolean(deleteTarget) && canManageTeam}
        title="Remove team member"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.firstName} ${deleteTarget.lastName} (${formatAdminRoleLabel(deleteTarget.role)}) from ${deleteTarget.branchName ?? 'this branch'}?`
            : 'Remove this team member?'
        }
        submitLabel="Remove member"
        onClose={() => setDeleteTarget(null)}
        onSubmit={(event) => {
          event.preventDefault();
          handleConfirmDelete();
        }}
      >
        <p className="text-sm text-gray-600">
          This demo action only updates the list locally. Super Admin accounts cannot be removed.
        </p>
      </BusinessFormModal>
    </div>
  );
}
