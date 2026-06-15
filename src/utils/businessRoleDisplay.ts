import type { BusinessRole } from '@/types/business';

const ROLE_LABELS: Record<BusinessRole, string> = {
  super_admin: 'Super Admin',
  finance_manager: 'Finance Manager',
  operations_officer: 'Operations Officer',
  viewer: 'Viewer / Auditor',
};

export function formatAdminRoleLabel(role: BusinessRole): string {
  return ROLE_LABELS[role] ?? role;
}
