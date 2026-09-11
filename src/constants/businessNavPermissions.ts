import type { BusinessRole } from '@/types/business';
import {
  canAllocateCompanyWallet,
  canFundCompanyWallet,
  isSuperAdminRole as isSuperAdminRoleHelper,
} from '@/constants/businessRoles';

export type BusinessNavItem = {
  name: string;
  href: string;
  permission?: string;
  locked?: boolean;
  children?: { name: string; href: string; permission?: string; locked?: boolean }[];
};

export const BUSINESS_NAV_ITEMS: BusinessNavItem[] = [
  { name: 'Dashboard', href: '/business', permission: 'business.view' },
  {
    name: 'Wallet',
    href: '/business/wallet',
    permission: 'wallet.view',
    children: [
      { name: 'Overview', href: '/business/wallet', permission: 'wallet.view' },
      { name: 'Fund Wallet', href: '/business/wallet/fund', permission: 'wallet.fund' },
      { name: 'Allocate Funds', href: '/business/wallet/allocate', permission: 'wallet.allocate' },
      { name: 'Statements', href: '/business/wallet/statements', permission: 'wallet.statements' },
    ],
  },
  {
    name: 'Payments',
    href: '/business/payments/airtime',
    permission: 'payments.single',
    children: [
      { name: 'Airtime', href: '/business/payments/airtime', permission: 'payments.single' },
      { name: 'Data', href: '/business/payments/data', permission: 'payments.single' },
      { name: 'Electricity', href: '/business/payments/electricity', permission: 'payments.single' },
      { name: 'Cable TV', href: '/business/payments/cable', permission: 'payments.single' },
      { name: 'Bulk Payments', href: '/business/payments/bulk', permission: 'payments.bulk', locked: true },
    ],
  },
  { name: 'Branches', href: '/business/branches', permission: 'branches.view' },
  { name: 'Beneficiaries', href: '/business/beneficiaries', permission: 'beneficiaries.view' },
  { name: 'Transactions', href: '/business/transactions', permission: 'transactions.view' },
  { name: 'Analytics', href: '/business/analytics', permission: 'analytics.view' },
  { name: 'Schedules', href: '/business/schedules', permission: 'schedules.view', locked: true },
  { name: 'Team Management', href: '/business/team', permission: 'team.view' },
  { name: 'Business Settings', href: '/business/settings', permission: 'business.settings.view' },
];

const HQ_FINANCE_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'wallet.fund',
  'wallet.allocate',
  'wallet.statements',
  'payments.single',
  'payments.bulk',
  'beneficiaries.view',
  'transactions.view',
  'transactions.export',
  'analytics.view',
  'analytics.export',
  'notifications.view',
  'branches.view',
];

const HQ_OPS_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'wallet.statements',
  'payments.single',
  'payments.bulk',
  'beneficiaries.view',
  'beneficiaries.manage',
  'transactions.view',
  'notifications.view',
];

const HQ_VIEWER_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'wallet.statements',
  'transactions.view',
  'analytics.view',
  'notifications.view',
  'audit.view',
  'branches.view',
];

const BRANCH_ADMIN_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'wallet.statements',
  'payments.single',
  'payments.bulk',
  'beneficiaries.view',
  'beneficiaries.manage',
  'transactions.view',
  'transactions.export',
  'analytics.view',
  'team.view',
  'team.invite',
  'team.manage',
  'notifications.view',
];

const BRANCH_FINANCE_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'wallet.statements',
  'payments.single',
  'payments.bulk',
  'beneficiaries.view',
  'transactions.view',
  'transactions.export',
  'analytics.view',
  'notifications.view',
];

const BRANCH_OPS_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'payments.single',
  'payments.bulk',
  'beneficiaries.view',
  'beneficiaries.manage',
  'transactions.view',
  'notifications.view',
];

const BRANCH_VIEWER_PERMISSIONS = [
  'business.view',
  'business.settings.view',
  'wallet.view',
  'transactions.view',
  'analytics.view',
  'notifications.view',
  'audit.view',
];

export const ROLE_PERMISSIONS: Record<BusinessRole, string[]> = {
  super_admin: [
    'business.view',
    'business.settings.view',
    'business.settings.manage',
    'wallet.view',
    'wallet.fund',
    'wallet.allocate',
    'wallet.statements',
    'wallet.freeze',
    'payments.single',
    'payments.bulk',
    'branches.view',
    'branches.manage',
    'beneficiaries.view',
    'beneficiaries.manage',
    'transactions.view',
    'transactions.export',
    'analytics.view',
    'analytics.export',
    'team.view',
    'team.invite',
    'team.manage',
    'schedules.view',
    'schedules.manage',
    'notifications.view',
    'audit.view',
  ],
  hq_finance: HQ_FINANCE_PERMISSIONS,
  hq_operations: HQ_OPS_PERMISSIONS,
  hq_viewer: HQ_VIEWER_PERMISSIONS,
  branch_admin: BRANCH_ADMIN_PERMISSIONS,
  branch_finance: BRANCH_FINANCE_PERMISSIONS,
  branch_operations: BRANCH_OPS_PERMISSIONS,
  branch_viewer: BRANCH_VIEWER_PERMISSIONS,
};

export const PUBLIC_BUSINESS_PATHS = [
  '/business/sign-in',
  '/business/register',
  '/business/forgot-password',
  '/business/reset-password',
  '/business/accept-invite',
] as const;

export function canAccessBusiness(role: BusinessRole | undefined, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isPublicBusinessRoute(pathname: string): boolean {
  return PUBLIC_BUSINESS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/** Longest-prefix match for route-level RBAC in the dashboard shell. */
export function getRequiredPermissionForRoute(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/business';

  if (isPublicBusinessRoute(normalized)) return null;

  const exact: Record<string, string> = {
    '/business': 'business.view',
    '/business/settings': 'business.settings.view',
    '/business/wallet/fund': 'wallet.fund',
    '/business/wallet/allocate': 'wallet.allocate',
    '/business/wallet/statements': 'wallet.statements',
    '/business/wallet': 'wallet.view',
    '/business/branches': 'branches.view',
    '/business/beneficiaries': 'beneficiaries.view',
    '/business/transactions': 'transactions.view',
    '/business/analytics': 'analytics.view',
    '/business/schedules': 'schedules.view',
    '/business/team': 'team.view',
  };

  if (exact[normalized]) return exact[normalized];

  if (normalized.startsWith('/business/payments/bulk')) return 'payments.single';
  if (normalized.startsWith('/business/payments/')) return 'payments.single';

  return 'business.view';
}

export function isSuperAdminRole(role: BusinessRole | undefined): boolean {
  return isSuperAdminRoleHelper(role);
}

export { canAllocateCompanyWallet, canFundCompanyWallet };
