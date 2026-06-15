import type { BusinessRole } from '@/types/business';

export type BusinessNavItem = {
  name: string;
  href: string;
  permission?: string;
  children?: { name: string; href: string; permission?: string }[];
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
      { name: 'Bulk Payments', href: '/business/payments/bulk', permission: 'payments.bulk' },
    ],
  },
  { name: 'Branches', href: '/business/branches', permission: 'branches.view' },
  { name: 'Beneficiaries', href: '/business/beneficiaries', permission: 'beneficiaries.view' },
  { name: 'Transactions', href: '/business/transactions', permission: 'transactions.view' },
  { name: 'Analytics', href: '/business/analytics', permission: 'analytics.view' },
  { name: 'Team Management', href: '/business/team', permission: 'team.view' },
  { name: 'Notifications', href: '/business/notifications', permission: 'notifications.view' },
  { name: 'Business Settings', href: '/business/settings', permission: 'business.settings.manage' },
];

export const ROLE_PERMISSIONS: Record<BusinessRole, string[]> = {
  super_admin: [
    'business.view',
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
  finance_manager: [
    'business.view',
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
  ],
  operations_officer: [
    'business.view',
    'wallet.view',
    'payments.single',
    'payments.bulk',
    'beneficiaries.view',
    'beneficiaries.manage',
    'transactions.view',
    'notifications.view',
  ],
  viewer: [
    'business.view',
    'wallet.view',
    'transactions.view',
    'analytics.view',
    'notifications.view',
    'audit.view',
  ],
};

export const PUBLIC_BUSINESS_PATHS = [
  '/business/sign-in',
  '/business/register',
  '/business/forgot-password',
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

export function isSuperAdminRole(role: BusinessRole | undefined): boolean {
  return role === 'super_admin';
}
