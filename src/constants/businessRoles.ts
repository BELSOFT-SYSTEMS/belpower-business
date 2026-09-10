import type { BusinessRole } from '@/types/business';

/** Company / Head Office roles */
export const HQ_ROLES: BusinessRole[] = [
  'super_admin',
  'hq_finance',
  'hq_operations',
  'hq_viewer',
];

/** Branch-scoped roles */
export const BRANCH_ROLES: BusinessRole[] = [
  'branch_admin',
  'branch_finance',
  'branch_operations',
  'branch_viewer',
];

export const ALL_BUSINESS_ROLES: BusinessRole[] = [...HQ_ROLES, ...BRANCH_ROLES];

export function isHeadOfficeRole(role: BusinessRole | undefined): boolean {
  return Boolean(role && HQ_ROLES.includes(role));
}

export function isBranchRole(role: BusinessRole | undefined): boolean {
  return Boolean(role && BRANCH_ROLES.includes(role));
}

export function isSuperAdminRole(role: BusinessRole | undefined): boolean {
  return role === 'super_admin';
}

export function isBranchAdminRole(role: BusinessRole | undefined): boolean {
  return role === 'branch_admin';
}

/** Can see company wallet at Head Office and all branch allocations. */
export function canViewCompanyWallet(role: BusinessRole | undefined): boolean {
  return role === 'super_admin' || role === 'hq_finance' || role === 'hq_operations' || role === 'hq_viewer';
}

/** Can fund the company wallet (Head Office only). */
export function canFundCompanyWallet(role: BusinessRole | undefined): boolean {
  return role === 'super_admin' || role === 'hq_finance';
}

/** Can allocate company wallet out to branches. */
export function canAllocateCompanyWallet(role: BusinessRole | undefined): boolean {
  return role === 'super_admin' || role === 'hq_finance';
}

/** Data is limited to the user's assigned branch. */
export function isBranchScopedRole(role: BusinessRole | undefined): boolean {
  return isBranchRole(role);
}

/** Roles the current user may invite in Team Management. */
export function getAssignableRolesForInviter(role: BusinessRole | undefined): BusinessRole[] {
  if (role === 'super_admin') {
    // Super Admin cannot invite another Super Admin.
    return ALL_BUSINESS_ROLES.filter((r) => r !== 'super_admin');
  }
  if (role === 'branch_admin') {
    return BRANCH_ROLES;
  }
  return [];
}

export function roleRequiresBranch(role: BusinessRole): boolean {
  return isBranchRole(role);
}

export function isHeadOfficeInviteRole(role: BusinessRole): boolean {
  return isHeadOfficeRole(role);
}

/**
 * Super Admin may remove any member except Super Admin (including self).
 * Covers Head Office and branch roles.
 */
export function canDeleteTeamMember(
  actorRole: BusinessRole | undefined,
  targetRole: BusinessRole,
  options?: { actorUserId?: string | null; targetUserId?: string },
): boolean {
  if (!isSuperAdminRole(actorRole)) return false;
  if (isSuperAdminRole(targetRole)) return false;
  if (options?.actorUserId && options.targetUserId && options.actorUserId === options.targetUserId) {
    return false;
  }
  return true;
}
