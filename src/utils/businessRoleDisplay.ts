import type { BusinessRole } from '@/types/business';
import { isBranchRole, isHeadOfficeRole } from '@/constants/businessRoles';

const ROLE_LABELS: Record<BusinessRole, string> = {
  super_admin: 'Super Admin',
  hq_finance: 'Finance (Head Office)',
  hq_operations: 'Operations (Head Office)',
  hq_viewer: 'Viewer (Head Office)',
  branch_admin: 'Admin (Branch)',
  branch_finance: 'Finance (Branch)',
  branch_operations: 'Operations (Branch)',
  branch_viewer: 'Viewer (Branch)',
};

export function formatAdminRoleLabel(role: BusinessRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function formatRoleScopeLabel(role: BusinessRole): string {
  if (role === 'super_admin') return 'Company';
  if (isHeadOfficeRole(role)) return 'Head Office';
  if (isBranchRole(role)) return 'Branch';
  return '—';
}
