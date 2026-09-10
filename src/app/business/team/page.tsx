'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { BusinessApiError } from '@/lib/businessApi';
import { businessBranchesApi } from '@/lib/businessApi';
import { businessTeamApi } from '@/lib/businessTeamApi';
import { formatAdminRoleLabel, formatRoleScopeLabel } from '@/utils/businessRoleDisplay';
import type { BusinessBranch, BusinessRole, BusinessTeamMember } from '@/types/business';

export default function TeamPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const assignableRoles = getAssignableRolesForInviter(role);
  const canInvite = canAccess('team.invite') && assignableRoles.length > 0;
  const canManageTeam = canAccess('team.manage');

  const [team, setTeam] = useState<BusinessTeamMember[]>([]);
  const [branches, setBranches] = useState<BusinessBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessTeamMember | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<BusinessTeamMember | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;

    const close = () => {
      setMenuOpenId(null);
      setMenuPosition(null);
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-team-actions-menu]') || target?.closest('[data-team-actions-trigger]')) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onScroll = () => close();

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [menuOpenId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [members, branchRows] = await Promise.all([
        businessTeamApi.list(),
        businessBranchesApi.list().catch(() => []),
      ]);
      setTeam(members);
      setBranches(
        branchRows.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code || '',
          address: b.address || '',
          city: b.city || '',
          isHeadOffice: Boolean(b.isHeadOffice),
          userCount: b.userCount,
          meterCount: b.meterCount,
          status: b.status === 'inactive' ? 'inactive' : 'active',
        })),
      );
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inviteBranches = useMemo(() => {
    if (isSuperAdminRole(role)) return branches;
    if (isBranchAdminRole(role)) {
      return branches.filter(
        (branch) => branch.id === user?.branchId || branch.name === user?.branchName,
      );
    }
    return branches;
  }, [branches, role, user?.branchId, user?.branchName]);

  const defaultInviteRole = assignableRoles.includes('branch_operations')
    ? 'branch_operations'
    : (assignableRoles[0] ?? 'branch_operations');

  const defaultInviteBranchId =
    inviteBranches.find((branch) => branch.id === user?.branchId)?.id ??
    inviteBranches.find((branch) => !branch.isHeadOffice)?.id ??
    inviteBranches[0]?.id ??
    '';

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<BusinessRole>(defaultInviteRole);
  const [inviteBranchId, setInviteBranchId] = useState(defaultInviteBranchId);
  const [inviting, setInviting] = useState(false);

  const needsBranch = roleRequiresBranch(inviteRole);
  const branchOptions = useMemo(() => {
    if (!needsBranch) {
      return [{ value: '', label: 'Head Office (company-wide)' }];
    }
    return inviteBranches
      .filter((branch) => !branch.isHeadOffice)
      .map((branch) => ({ value: branch.id, label: branch.name }));
  }, [inviteBranches, needsBranch]);

  const resetInviteForm = () => {
    setInviteRole(defaultInviteRole);
    setInviteBranchId(roleRequiresBranch(defaultInviteRole) ? defaultInviteBranchId : '');
  };

  const handleInviteRoleChange = (value: string) => {
    const nextRole = value as BusinessRole;
    setInviteRole(nextRole);
    if (roleRequiresBranch(nextRole)) {
      setInviteBranchId(
        inviteBranches.find((branch) => !branch.isHeadOffice)?.id ?? defaultInviteBranchId,
      );
    } else {
      setInviteBranchId('');
    }
  };

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    setInviting(true);
    try {
      const result = await businessTeamApi.invite({
        email,
        role: inviteRole,
        branchId: needsBranch ? inviteBranchId || null : null,
      });
      setInviteOpen(false);
      resetInviteForm();
      toast.success(`Invitation sent to ${email}`);
      // Only surface the raw link if Resend failed — otherwise email is enough.
      if (result.emailSent === false && result.inviteUrl) {
        toast.message('Email could not be sent. Copy this invite link:', {
          description: result.inviteUrl,
          duration: 20000,
        });
      }
      await load();
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const memberCanBeDeleted = (member: BusinessTeamMember) =>
    canDeleteTeamMember(role, member.role, {
      actorUserId: user?.id,
      targetUserId: member.id,
    }) || (canManageTeam && member.id !== user?.id && member.role !== 'super_admin');

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !memberCanBeDeleted(deleteTarget)) return;
    const name = `${deleteTarget.firstName} ${deleteTarget.lastName}`;
    try {
      await businessTeamApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      setMenuOpenId(null);
      setMenuPosition(null);
      toast.success(`${name} removed from team`);
      await load();
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not remove member');
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget || !canManageTeam) return;
    const nextStatus = suspendTarget.status === 'suspended' ? 'active' : 'suspended';
    try {
      await businessTeamApi.update(suspendTarget.id, { status: nextStatus });
      toast.success(
        nextStatus === 'suspended'
          ? `${suspendTarget.firstName} suspended`
          : `${suspendTarget.firstName} reactivated`,
      );
      setSuspendTarget(null);
      setMenuOpenId(null);
      await load();
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not update member');
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Team management"
          description={
            isSuperAdminRole(role)
              ? 'Create Head Office and branch roles across the company.'
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

      {loading ? (
        <p className="text-sm text-gray-500">Loading team…</p>
      ) : team.length === 0 ? (
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
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
                  const canSuspend =
                    canManageTeam &&
                    member.id !== user?.id &&
                    member.role !== 'super_admin' &&
                    member.status !== 'invited';
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
                          {canDelete || canSuspend ? (
                            <div className="relative inline-flex justify-end">
                              <button
                                type="button"
                                data-team-actions-trigger
                                onClick={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  setMenuOpenId((current) => {
                                    if (current === member.id) {
                                      setMenuPosition(null);
                                      return null;
                                    }
                                    setMenuPosition({
                                      top: rect.bottom + 4,
                                      right: Math.max(8, window.innerWidth - rect.right),
                                    });
                                    return member.id;
                                  });
                                }}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label={`${member.firstName} ${member.lastName} actions`}
                                aria-expanded={menuOpenId === member.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {menuOpenId === member.id && menuPosition ? (
                                <div
                                  data-team-actions-menu
                                  className="fixed z-50 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                                  style={{
                                    top: menuPosition.top,
                                    right: menuPosition.right,
                                  }}
                                >
                                  {canSuspend ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        setMenuPosition(null);
                                        setSuspendTarget(member);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      {member.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                    </button>
                                  ) : null}
                                  {canDelete ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenuOpenId(null);
                                        setMenuPosition(null);
                                        setDeleteTarget(member);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove member
                                    </button>
                                  ) : null}
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
        submitLabel={inviting ? 'Sending…' : 'Send invitation'}
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
          value={inviteBranchId}
          onChange={setInviteBranchId}
          disabled={isBranchAdminRole(role) || !needsBranch}
          options={
            branchOptions.length > 0
              ? branchOptions
              : [{ value: inviteBranchId || '', label: 'No branches available' }]
          }
        />
      </BusinessFormModal>

      <BusinessFormModal
        open={Boolean(deleteTarget) && canManageTeam}
        title="Remove team member"
        description={
          deleteTarget
            ? `Remove ${deleteTarget.firstName} ${deleteTarget.lastName} (${formatAdminRoleLabel(deleteTarget.role)})?`
            : 'Remove this team member?'
        }
        submitLabel="Remove member"
        onClose={() => setDeleteTarget(null)}
        onSubmit={(event) => {
          event.preventDefault();
          void handleConfirmDelete();
        }}
      >
        <p className="text-sm text-gray-600">
          This deactivates their access. Super Admin accounts cannot be removed when they are the
          last one.
        </p>
      </BusinessFormModal>

      <BusinessFormModal
        open={Boolean(suspendTarget) && canManageTeam}
        title={suspendTarget?.status === 'suspended' ? 'Reactivate member' : 'Suspend member'}
        description={
          suspendTarget
            ? `${suspendTarget.status === 'suspended' ? 'Reactivate' : 'Suspend'} ${suspendTarget.firstName} ${suspendTarget.lastName}?`
            : 'Update member status?'
        }
        submitLabel={suspendTarget?.status === 'suspended' ? 'Reactivate' : 'Suspend'}
        onClose={() => setSuspendTarget(null)}
        onSubmit={(event) => {
          event.preventDefault();
          void handleConfirmSuspend();
        }}
      >
        <p className="text-sm text-gray-600">
          Suspended members cannot sign in until reactivated.
        </p>
      </BusinessFormModal>
    </div>
  );
}
