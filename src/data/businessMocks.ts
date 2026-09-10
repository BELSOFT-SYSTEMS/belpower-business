import type {
  BusinessAnalyticsData,
  BusinessBeneficiary,
  BeneficiaryGroup,
  BusinessBranch,
  BusinessDashboardData,
  BusinessNotification,
  BusinessRole,
  BranchSpendItem,
  BranchSpendPeriod,
  BranchWalletOverview,
  BusinessTeamMember,
  BusinessTransactionPreview,
  BusinessUserProfile,
  VirtualAccountInfo,
  WalletStatementRow,
} from '@/types/business';
import {
  canViewCompanyWallet,
  isBranchScopedRole,
} from '@/constants/businessRoles';

export const MOCK_SUPER_ADMIN: BusinessUserProfile = {
  id: 'user-hq-1',
  firstName: 'Belba',
  lastName: 'Ngoy',
  email: 'admin@belsoftsystems.com',
  role: 'super_admin',
  branchId: 'branch-hq',
  branchName: 'Head Office',
};

export const MOCK_HQ_FINANCE: BusinessUserProfile = {
  id: 'user-hq-finance-1',
  firstName: 'Chioma',
  lastName: 'Eze',
  email: 'finance.hq@belsoftsystems.com',
  role: 'hq_finance',
  branchId: 'branch-hq',
  branchName: 'Head Office',
};

export const MOCK_HQ_OPS: BusinessUserProfile = {
  id: 'user-hq-ops-1',
  firstName: 'Ifeanyi',
  lastName: 'Okoro',
  email: 'ops.hq@belsoftsystems.com',
  role: 'hq_operations',
  branchId: 'branch-hq',
  branchName: 'Head Office',
};

export const MOCK_HQ_VIEWER: BusinessUserProfile = {
  id: 'user-hq-viewer-1',
  firstName: 'Tunde',
  lastName: 'Bakare',
  email: 'viewer.hq@belsoftsystems.com',
  role: 'hq_viewer',
  branchId: 'branch-hq',
  branchName: 'Head Office',
};

export const MOCK_BRANCH_ADMIN_LAGOS: BusinessUserProfile = {
  id: 'user-lagos-admin-1',
  firstName: 'Emeka',
  lastName: 'Nwosu',
  email: 'admin.lagos@belsoftsystems.com',
  role: 'branch_admin',
  branchId: 'branch-lagos',
  branchName: 'Lagos Branch',
};

export const MOCK_BRANCH_FINANCE_LAGOS: BusinessUserProfile = {
  id: 'user-lagos-finance-1',
  firstName: 'Ngozi',
  lastName: 'Adeyemi',
  email: 'finance.lagos@belsoftsystems.com',
  role: 'branch_finance',
  branchId: 'branch-lagos',
  branchName: 'Lagos Branch',
};

export const MOCK_BRANCH_OPS_ABUJA: BusinessUserProfile = {
  id: 'user-abuja-ops-1',
  firstName: 'Amina',
  lastName: 'Okafor',
  email: 'ops.abuja@belsoftsystems.com',
  role: 'branch_operations',
  branchId: 'branch-abuja',
  branchName: 'Abuja Branch',
};

export const MOCK_BRANCH_VIEWER_ABUJA: BusinessUserProfile = {
  id: 'user-abuja-viewer-1',
  firstName: 'Fatima',
  lastName: 'Bello',
  email: 'viewer.abuja@belsoftsystems.com',
  role: 'branch_viewer',
  branchId: 'branch-abuja',
  branchName: 'Abuja Branch',
};

/** @deprecated Use MOCK_HQ_FINANCE — kept as alias for older imports during transition */
export const MOCK_FINANCE_MANAGER = MOCK_HQ_FINANCE;
/** @deprecated Use MOCK_BRANCH_OPS_ABUJA */
export const MOCK_OPS_OFFICER = MOCK_BRANCH_OPS_ABUJA;
/** @deprecated Use MOCK_HQ_VIEWER */
export const MOCK_VIEWER = MOCK_HQ_VIEWER;

export const DEMO_ROLE_PROFILES: Record<BusinessRole, BusinessUserProfile> = {
  super_admin: MOCK_SUPER_ADMIN,
  hq_finance: MOCK_HQ_FINANCE,
  hq_operations: MOCK_HQ_OPS,
  hq_viewer: MOCK_HQ_VIEWER,
  branch_admin: MOCK_BRANCH_ADMIN_LAGOS,
  branch_finance: MOCK_BRANCH_FINANCE_LAGOS,
  branch_operations: MOCK_BRANCH_OPS_ABUJA,
  branch_viewer: MOCK_BRANCH_VIEWER_ABUJA,
};

export const MOCK_VIRTUAL_ACCOUNT: VirtualAccountInfo = {
  bankName: 'Wema Bank',
  accountName: 'Belsoft Systems Ltd / BelPower Business',
  accountNumber: '8923456789',
};

export const MOCK_BRANCHES: BusinessBranch[] = [
  {
    id: 'branch-hq',
    name: 'Head Office',
    code: 'HQ',
    address: '12 Adetokunbo Ademola',
    city: 'Lagos',
    isHeadOffice: true,
    userCount: 4,
    meterCount: 1,
    status: 'active',
  },
  {
    id: 'branch-lagos',
    name: 'Lagos Branch',
    code: 'LAG',
    address: '42 Allen Avenue',
    city: 'Lagos',
    isHeadOffice: false,
    userCount: 2,
    meterCount: 1,
    status: 'active',
  },
  {
    id: 'branch-abuja',
    name: 'Abuja Branch',
    code: 'ABJ',
    address: '5 Aminu Kano Crescent',
    city: 'Abuja',
    isHeadOffice: false,
    userCount: 2,
    meterCount: 1,
    status: 'active',
  },
  {
    id: 'branch-ph',
    name: 'Port Harcourt Branch',
    code: 'PHC',
    address: '18 Aba Road',
    city: 'Port Harcourt',
    isHeadOffice: false,
    userCount: 1,
    meterCount: 0,
    status: 'active',
  },
  {
    id: 'branch-kano',
    name: 'Kano Branch',
    code: 'KAN',
    address: '14 Zoo Road',
    city: 'Kano',
    isHeadOffice: false,
    userCount: 1,
    meterCount: 0,
    status: 'active',
  },
  {
    id: 'branch-enugu',
    name: 'Enugu Branch',
    code: 'ENU',
    address: '7 Ogui Road',
    city: 'Enugu',
    isHeadOffice: false,
    userCount: 1,
    meterCount: 0,
    status: 'inactive',
  },
];

export const MOCK_TEAM: BusinessTeamMember[] = [
  {
    id: 'user-hq-1',
    firstName: 'Belba',
    lastName: 'Ngoy',
    email: 'admin@belsoftsystems.com',
    role: 'super_admin',
    branchId: 'branch-hq',
    branchName: 'Head Office',
    status: 'active',
    lastActiveAt: '2026-06-11T10:30:00.000Z',
  },
  {
    id: 'user-hq-finance-1',
    firstName: 'Chioma',
    lastName: 'Eze',
    email: 'finance.hq@belsoftsystems.com',
    role: 'hq_finance',
    branchId: 'branch-hq',
    branchName: 'Head Office',
    status: 'active',
    lastActiveAt: '2026-06-11T08:00:00.000Z',
  },
  {
    id: 'user-hq-ops-1',
    firstName: 'Ifeanyi',
    lastName: 'Okoro',
    email: 'ops.hq@belsoftsystems.com',
    role: 'hq_operations',
    branchId: 'branch-hq',
    branchName: 'Head Office',
    status: 'active',
    lastActiveAt: '2026-06-11T07:40:00.000Z',
  },
  {
    id: 'user-hq-viewer-1',
    firstName: 'Tunde',
    lastName: 'Bakare',
    email: 'viewer.hq@belsoftsystems.com',
    role: 'hq_viewer',
    branchId: 'branch-hq',
    branchName: 'Head Office',
    status: 'active',
    lastActiveAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'user-lagos-admin-1',
    firstName: 'Emeka',
    lastName: 'Nwosu',
    email: 'admin.lagos@belsoftsystems.com',
    role: 'branch_admin',
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    status: 'active',
    lastActiveAt: '2026-06-09T14:20:00.000Z',
  },
  {
    id: 'user-lagos-finance-1',
    firstName: 'Ngozi',
    lastName: 'Adeyemi',
    email: 'finance.lagos@belsoftsystems.com',
    role: 'branch_finance',
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    status: 'active',
    lastActiveAt: '2026-06-09T11:00:00.000Z',
  },
  {
    id: 'user-lagos-ops-1',
    firstName: 'Kunle',
    lastName: 'Balogun',
    email: 'ops.lagos@belsoftsystems.com',
    role: 'branch_operations',
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    status: 'active',
    lastActiveAt: '2026-06-09T10:15:00.000Z',
  },
  {
    id: 'user-lagos-viewer-1',
    firstName: 'Ada',
    lastName: 'Okeke',
    email: 'viewer.lagos@belsoftsystems.com',
    role: 'branch_viewer',
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    status: 'invited',
    lastActiveAt: null,
  },
  {
    id: 'user-abuja-admin-1',
    firstName: 'Hassan',
    lastName: 'Ibrahim',
    email: 'admin.abuja@belsoftsystems.com',
    role: 'branch_admin',
    branchId: 'branch-abuja',
    branchName: 'Abuja Branch',
    status: 'active',
    lastActiveAt: '2026-06-10T15:00:00.000Z',
  },
  {
    id: 'user-abuja-ops-1',
    firstName: 'Amina',
    lastName: 'Okafor',
    email: 'ops.abuja@belsoftsystems.com',
    role: 'branch_operations',
    branchId: 'branch-abuja',
    branchName: 'Abuja Branch',
    status: 'active',
    lastActiveAt: '2026-06-10T16:00:00.000Z',
  },
  {
    id: 'user-abuja-viewer-1',
    firstName: 'Fatima',
    lastName: 'Bello',
    email: 'viewer.abuja@belsoftsystems.com',
    role: 'branch_viewer',
    branchId: 'branch-abuja',
    branchName: 'Abuja Branch',
    status: 'active',
    lastActiveAt: '2026-06-08T09:00:00.000Z',
  },
];

export const MOCK_BENEFICIARIES: BusinessBeneficiary[] = [
  {
    id: 'ben-1',
    label: 'HQ prepaid meter',
    service: 'electricity',
    provider: 'ABUJA',
    accountNumber: '45022530096',
    branchName: 'Head Office',
    createdAt: '2026-05-01T09:00:00.000Z',
    meterType: 'prepaid',
    customerName: 'Belsoft Systems Ltd',
    address: '12 Adetokunbo Ademola, Victoria Island, Lagos',
    isPrimary: true,
    verified: true,
  },
  {
    id: 'ben-2',
    label: 'Abuja branch meter',
    service: 'electricity',
    provider: 'ABUJA',
    accountNumber: '62123456789',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-10T11:00:00.000Z',
    meterType: 'prepaid',
    customerName: 'Belsoft Systems — Abuja Branch',
    address: 'Plot 14 Gana Street, Maitama, Abuja',
    verified: true,
  },
  {
    id: 'ben-3',
    label: 'Lagos branch meter',
    service: 'electricity',
    provider: 'IKEJA',
    accountNumber: '04187654321',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-15T14:00:00.000Z',
    meterType: 'postpaid',
    customerName: 'Belsoft Systems — Lagos Branch',
    address: '18 Adeola Odeku, Victoria Island, Lagos',
    verified: true,
  },
  {
    id: 'ben-4',
    label: 'PH warehouse meter',
    service: 'electricity',
    provider: 'PH',
    accountNumber: '55221100998',
    branchName: 'Port Harcourt Branch',
    createdAt: '2026-05-20T10:00:00.000Z',
    meterType: 'prepaid',
    customerName: 'Belsoft Systems — PH Branch',
    address: '18 Aba Road, Port Harcourt',
    verified: true,
  },
  {
    id: 'ben-air-1',
    label: 'HQ office line',
    service: 'phone',
    provider: 'mtn',
    accountNumber: '08031234567',
    branchName: 'Head Office',
    createdAt: '2026-05-02T09:00:00.000Z',
    isPrimary: true,
    verified: true,
  },
  {
    id: 'ben-air-2',
    label: 'Abuja ops phone',
    service: 'phone',
    provider: 'airtel',
    accountNumber: '08021234567',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-12T11:00:00.000Z',
    verified: true,
  },
  {
    id: 'ben-air-3',
    label: 'Lagos front desk',
    service: 'phone',
    provider: 'glo',
    accountNumber: '08051234567',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-18T14:00:00.000Z',
    verified: true,
  },
  {
    id: 'ben-data-1',
    label: 'HQ router SIM',
    service: 'phone',
    provider: 'mtn',
    accountNumber: '08061234567',
    branchName: 'Head Office',
    createdAt: '2026-05-03T09:00:00.000Z',
    verified: true,
  },
  {
    id: 'ben-data-2',
    label: 'Abuja backup data',
    service: 'phone',
    provider: 'airtel',
    accountNumber: '08081234567',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-14T10:00:00.000Z',
    verified: true,
  },
  {
    id: 'ben-data-3',
    label: 'Lagos field tablet',
    service: 'phone',
    provider: '9mobile',
    accountNumber: '08091234567',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-22T12:00:00.000Z',
    verified: true,
  },
  {
    id: 'ben-cable-1',
    label: 'HQ conference TV',
    service: 'cable',
    provider: 'dstv',
    accountNumber: '7012345678',
    branchName: 'Head Office',
    createdAt: '2026-05-04T09:00:00.000Z',
    customerName: 'Belsoft Systems Ltd',
    isPrimary: true,
    verified: true,
  },
  {
    id: 'ben-cable-2',
    label: 'Lagos lounge GOtv',
    service: 'cable',
    provider: 'gotv',
    accountNumber: '8023456789',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-16T11:00:00.000Z',
    customerName: 'Belsoft Systems — Lagos Branch',
    verified: true,
  },
  {
    id: 'ben-cable-3',
    label: 'Abuja waiting room',
    service: 'cable',
    provider: 'startimes',
    accountNumber: '9034567890',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-25T15:00:00.000Z',
    customerName: 'Belsoft Systems — Abuja Branch',
    verified: true,
  },
];

/** Named number groups for airtime/data — consumed later by bulk payments. */
export const MOCK_BENEFICIARY_GROUPS: BeneficiaryGroup[] = [
  {
    id: 'grp-air-1',
    name: 'HQ Staff',
    service: 'phone',
    branchName: 'Head Office',
    createdAt: '2026-05-06T09:00:00.000Z',
    isPrimary: true,
    members: [
      {
        id: 'grp-air-1-m1',
        label: 'Ops lead',
        provider: 'mtn',
        accountNumber: '08034567890',
        verified: true,
      },
      {
        id: 'grp-air-1-m2',
        label: 'Finance desk',
        provider: 'airtel',
        accountNumber: '08023456789',
        verified: true,
      },
      {
        id: 'grp-air-1-m3',
        label: 'Front desk',
        provider: 'glo',
        accountNumber: '08056789012',
        verified: true,
      },
    ],
  },
  {
    id: 'grp-air-2',
    name: 'Lagos field team',
    service: 'phone',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-19T10:00:00.000Z',
    members: [
      {
        id: 'grp-air-2-m1',
        label: 'Driver 1',
        provider: 'mtn',
        accountNumber: '08123456789',
        verified: true,
      },
      {
        id: 'grp-air-2-m2',
        label: 'Driver 2',
        provider: 'mtn',
        accountNumber: '08134567890',
        verified: true,
      },
    ],
  },
  {
    id: 'grp-data-1',
    name: 'Branch routers',
    service: 'phone',
    branchName: 'Head Office',
    createdAt: '2026-05-07T11:00:00.000Z',
    members: [
      {
        id: 'grp-data-1-m1',
        label: 'Lagos router',
        provider: 'mtn',
        accountNumber: '08067890123',
        verified: true,
      },
      {
        id: 'grp-data-1-m2',
        label: 'Abuja router',
        provider: 'airtel',
        accountNumber: '08078901234',
        verified: true,
      },
      {
        id: 'grp-data-1-m3',
        label: 'PH backup',
        provider: 'glo',
        accountNumber: '08089012345',
        verified: true,
      },
    ],
  },
  {
    id: 'grp-data-2',
    name: 'Abuja tablets',
    service: 'phone',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-21T14:00:00.000Z',
    members: [
      {
        id: 'grp-data-2-m1',
        provider: '9mobile',
        accountNumber: '08090123456',
        verified: true,
      },
      {
        id: 'grp-data-2-m2',
        provider: 'airtel',
        accountNumber: '08012345678',
        verified: true,
      },
    ],
  },
];

export const MOCK_NOTIFICATIONS: BusinessNotification[] = [
  {
    id: 'notif-1',
    title: 'Wallet funded',
    message: '₦500,000 credited to your business wallet via bank transfer.',
    type: 'wallet',
    read: false,
    createdAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'notif-2',
    title: 'Electricity payment completed',
    message: 'Head Office — ₦85,000 AEDC prepaid token delivered.',
    type: 'transaction',
    read: false,
    createdAt: '2026-06-11T10:30:00.000Z',
  },
  {
    id: 'notif-3',
    title: 'Team invite accepted',
    message: 'Amina Okafor joined as Operations Officer at Abuja Branch.',
    type: 'team',
    read: true,
    createdAt: '2026-06-10T12:00:00.000Z',
  },
  {
    id: 'notif-4',
    title: 'Scheduled maintenance',
    message: 'BelPower Business will undergo brief maintenance on Sunday 2–4 AM WAT.',
    type: 'system',
    read: true,
    createdAt: '2026-06-09T08:00:00.000Z',
  },
  {
    id: 'notif-5',
    title: 'Branch allocation completed',
    message: '₦250,000 allocated to Lagos Branch from the company wallet.',
    type: 'wallet',
    read: false,
    createdAt: '2026-06-11T11:05:00.000Z',
  },
];

export const MOCK_TRANSACTIONS: BusinessTransactionPreview[] = [
  {
    id: 'tx-0',
    reference: 'BEL-BIZ-20260612001',
    service: 'wallet',
    provider: 'bank_transfer',
    amount: 500000,
    status: 'completed',
    entryType: 'credit',
    branchName: 'Head Office',
    userName: 'Belba Ngoy',
    createdAt: '2026-06-12T08:00:00.000Z',
  },
  {
    id: 'tx-1',
    reference: 'BEL-BIZ-20260611001',
    service: 'electricity',
    provider: 'ABUJA',
    amount: 85000,
    status: 'completed',
    entryType: 'debit',
    branchName: 'Head Office',
    userName: 'Belba Ngoy',
    createdAt: '2026-06-11T10:30:00.000Z',
  },
  {
    id: 'tx-2',
    reference: 'BEL-BIZ-20260611002',
    service: 'airtime',
    provider: 'mtn',
    amount: 50000,
    status: 'completed',
    entryType: 'debit',
    branchName: 'Abuja Branch',
    userName: 'Amina Okafor',
    createdAt: '2026-06-11T09:15:00.000Z',
  },
  {
    id: 'tx-3',
    reference: 'BEL-BIZ-20260610003',
    service: 'data',
    provider: 'airtel',
    amount: 25000,
    status: 'pending',
    entryType: 'debit',
    branchName: 'Lagos Branch',
    userName: 'Belba Ngoy',
    createdAt: '2026-06-10T16:45:00.000Z',
  },
  {
    id: 'tx-4',
    reference: 'BEL-BIZ-20260610004',
    service: 'cable',
    provider: 'dstv',
    amount: 24500,
    status: 'completed',
    entryType: 'debit',
    branchName: 'Head Office',
    userName: 'Chioma Eze',
    createdAt: '2026-06-10T11:00:00.000Z',
  },
  {
    id: 'tx-5',
    reference: 'BEL-BIZ-20260609005',
    service: 'electricity',
    provider: 'IKEJA',
    amount: 120000,
    status: 'failed',
    entryType: 'debit',
    branchName: 'Lagos Branch',
    userName: 'Emeka Nwosu',
    createdAt: '2026-06-09T14:30:00.000Z',
  },
  {
    id: 'tx-6',
    reference: 'BEL-BIZ-20260608006',
    service: 'airtime',
    provider: 'glo',
    amount: 10000,
    status: 'completed',
    entryType: 'debit',
    branchName: 'Port Harcourt Branch',
    userName: 'Belba Ngoy',
    createdAt: '2026-06-08T09:00:00.000Z',
  },
];

/** Head Office holds the company wallet — it is not an allocated branch pot. */
export const HEAD_OFFICE_BRANCH_ID = 'branch-hq';

/**
 * Allocated balances for operating branches only.
 * Company funds sit at Head Office (`MOCK_DASHBOARD.wallet.availableBalance`).
 */
export const MOCK_BRANCH_WALLET_OVERVIEW: BranchWalletOverview[] = [
  {
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    allocatedBalance: 500000,
    todaySpend: 0,
    monthSpend: 1850000,
    monthTransactions: 36,
  },
  {
    branchId: 'branch-abuja',
    branchName: 'Abuja Branch',
    allocatedBalance: 450000,
    todaySpend: 50000,
    monthSpend: 1170000,
    monthTransactions: 29,
  },
  {
    branchId: 'branch-ph',
    branchName: 'Port Harcourt Branch',
    allocatedBalance: 350000,
    todaySpend: 50000,
    monthSpend: 980000,
    monthTransactions: 18,
  },
  {
    branchId: 'branch-kano',
    branchName: 'Kano Branch',
    allocatedBalance: 280000,
    todaySpend: 0,
    monthSpend: 760000,
    monthTransactions: 12,
  },
  {
    branchId: 'branch-enugu',
    branchName: 'Enugu Branch',
    allocatedBalance: 170000,
    todaySpend: 0,
    monthSpend: 540000,
    monthTransactions: 9,
  },
];

export const MOCK_WALLET_STATEMENTS: WalletStatementRow[] = [
  {
    id: 'ws-1',
    reference: 'FUND-20260611001',
    type: 'credit',
    description: 'Bank transfer — wallet funding',
    amount: 500000,
    balanceBefore: 1950000,
    balanceAfter: 2450000,
    branchName: null,
    performedByName: 'Chioma Eze',
    performedByRole: 'hq_finance',
    status: 'completed',
    createdAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'ws-2',
    reference: 'BEL-BIZ-20260611001',
    type: 'debit',
    description: 'Electricity — ABUJA prepaid',
    amount: 85000,
    balanceBefore: 2450000,
    balanceAfter: 2365000,
    branchName: 'Head Office',
    performedByName: 'Belba Ngoy',
    performedByRole: 'super_admin',
    status: 'completed',
    createdAt: '2026-06-11T10:30:00.000Z',
  },
  {
    id: 'ws-3',
    reference: 'BEL-BIZ-20260611002',
    type: 'debit',
    description: 'Airtime — MTN',
    amount: 50000,
    balanceBefore: 2365000,
    balanceAfter: 2315000,
    branchName: 'Abuja Branch',
    performedByName: 'Amina Okafor',
    performedByRole: 'branch_operations',
    status: 'completed',
    createdAt: '2026-06-11T09:15:00.000Z',
  },
  {
    id: 'ws-4',
    reference: 'BEL-BIZ-20260610004',
    type: 'debit',
    description: 'Cable TV — DSTV',
    amount: 24500,
    balanceBefore: 2315000,
    balanceAfter: 2290500,
    branchName: 'Head Office',
    performedByName: 'Belba Ngoy',
    performedByRole: 'super_admin',
    status: 'completed',
    createdAt: '2026-06-10T11:00:00.000Z',
  },
  {
    id: 'ws-5',
    reference: 'BEL-BIZ-20260610005',
    type: 'debit',
    description: 'Data bundle — Airtel',
    amount: 15000,
    balanceBefore: 2290500,
    balanceAfter: 2290500,
    branchName: 'Kano Branch',
    performedByName: 'Emeka Nwosu',
    performedByRole: 'branch_operations',
    status: 'pending',
    createdAt: '2026-06-10T16:00:00.000Z',
  },
  {
    id: 'ws-6',
    reference: 'BEL-BIZ-20260609005',
    type: 'debit',
    description: 'Electricity — IKEJA prepaid',
    amount: 120000,
    balanceBefore: 2290500,
    balanceAfter: 2290500,
    branchName: 'Lagos Branch',
    performedByName: 'Emeka Nwosu',
    performedByRole: 'branch_operations',
    status: 'failed',
    createdAt: '2026-06-09T14:30:00.000Z',
  },
  {
    id: 'ws-7',
    reference: 'BEL-BIZ-20260609006',
    type: 'debit',
    description: 'Airtime — MTN',
    amount: 20000,
    balanceBefore: 2410500,
    balanceAfter: 2290500,
    branchName: 'Abuja Branch',
    performedByName: 'Amina Okafor',
    performedByRole: 'branch_operations',
    status: 'completed',
    createdAt: '2026-06-09T09:00:00.000Z',
  },
  {
    id: 'ws-8',
    reference: 'ALLOC-20260608001',
    type: 'debit',
    description: 'Branch allocation — Kano Branch',
    amount: 280000,
    balanceBefore: 2230000,
    balanceAfter: 1950000,
    branchName: 'Kano Branch',
    performedByName: 'Chioma Eze',
    performedByRole: 'hq_finance',
    status: 'completed',
    createdAt: '2026-06-08T10:00:00.000Z',
  },
  {
    id: 'ws-9',
    reference: 'BEL-BIZ-20260608006',
    type: 'debit',
    description: 'Airtime — Glo',
    amount: 10000,
    balanceBefore: 2240000,
    balanceAfter: 2230000,
    branchName: 'Port Harcourt Branch',
    performedByName: 'Belba Ngoy',
    performedByRole: 'super_admin',
    status: 'completed',
    createdAt: '2026-06-08T09:00:00.000Z',
  },
  {
    id: 'ws-10',
    reference: 'FUND-20260608001',
    type: 'credit',
    description: 'Bank transfer — wallet funding',
    amount: 1000000,
    balanceBefore: 1240000,
    balanceAfter: 2240000,
    branchName: null,
    performedByName: 'Chioma Eze',
    performedByRole: 'hq_finance',
    status: 'completed',
    createdAt: '2026-06-08T08:00:00.000Z',
  },
  {
    id: 'ws-11',
    reference: 'BEL-BIZ-20260607001',
    type: 'debit',
    description: 'Electricity — ENUGU prepaid',
    amount: 45000,
    balanceBefore: 1285000,
    balanceAfter: 1240000,
    branchName: 'Enugu Branch',
    performedByName: 'Belba Ngoy',
    performedByRole: 'super_admin',
    status: 'completed',
    createdAt: '2026-06-07T15:00:00.000Z',
  },
  {
    id: 'ws-12',
    reference: 'BEL-BIZ-20260606001',
    type: 'debit',
    description: 'Data bundle — MTN',
    amount: 8000,
    balanceBefore: 1293000,
    balanceAfter: 1285000,
    branchName: 'Kano Branch',
    performedByName: 'Emeka Nwosu',
    performedByRole: 'branch_operations',
    status: 'completed',
    createdAt: '2026-06-06T11:30:00.000Z',
  },
  {
    id: 'ws-13',
    reference: 'BEL-BIZ-20260605001',
    type: 'debit',
    description: 'Electricity — ABUJA prepaid',
    amount: 65000,
    balanceBefore: 1358000,
    balanceAfter: 1293000,
    branchName: 'Abuja Branch',
    performedByName: 'Amina Okafor',
    performedByRole: 'branch_operations',
    status: 'completed',
    createdAt: '2026-06-05T14:00:00.000Z',
  },
  {
    id: 'ws-14',
    reference: 'BEL-BIZ-20260604001',
    type: 'debit',
    description: 'Cable TV — GOTV',
    amount: 11000,
    balanceBefore: 1369000,
    balanceAfter: 1358000,
    branchName: 'Head Office',
    performedByName: 'Belba Ngoy',
    performedByRole: 'super_admin',
    status: 'completed',
    createdAt: '2026-06-04T09:45:00.000Z',
  },
  {
    id: 'ws-15',
    reference: 'FUND-20260603001',
    type: 'credit',
    description: 'Card payment — wallet funding',
    amount: 750000,
    balanceBefore: 619000,
    balanceAfter: 1369000,
    branchName: null,
    performedByName: 'Chioma Eze',
    performedByRole: 'hq_finance',
    status: 'completed',
    createdAt: '2026-06-03T08:30:00.000Z',
  },
];

export const MOCK_DASHBOARD: BusinessDashboardData = {
  business: {
    id: 'biz-1',
    businessId: 'BP-123456',
    businessName: 'Belsoft Systems Ltd',
    logoUrl: '/belsoft-logo-2.jpg',
    email: 'contact@belsoftsystems.com',
    phone: '+234 801 234 5678',
    address: '12 Adetokunbo Ademola, Victoria Island, Lagos',
  },
  user: MOCK_SUPER_ADMIN,
  wallet: {
    // Company wallet held at Head Office (after allocations to other branches).
    balance: 700000,
    availableBalance: 700000,
    todaySpend: 85000,
    monthSpend: 2100000,
    currency: 'NGN',
    isFrozen: false,
    dailyLimit: 2000000,
  },
  meters: [
    {
      id: 'meter-hq',
      branchId: 'branch-hq',
      branchName: 'Head Office',
      meterNumber: '45022530096',
      disco: 'ABUJA',
      meterType: 'prepaid',
      isHeadOffice: true,
    },
    {
      id: 'meter-abuja',
      branchId: 'branch-abuja',
      branchName: 'Abuja Branch',
      meterNumber: '62123456789',
      disco: 'ABUJA',
      meterType: 'prepaid',
      isHeadOffice: false,
    },
    {
      id: 'meter-lagos',
      branchId: 'branch-lagos',
      branchName: 'Lagos Branch',
      meterNumber: '04187654321',
      disco: 'IKEJA',
      meterType: 'prepaid',
      isHeadOffice: false,
    },
  ],
  recentTransactions: MOCK_TRANSACTIONS.slice(0, 3),
  branchSpend: [
    { branchId: 'branch-hq', branchName: 'Head Office', amount: 2100000 },
    { branchId: 'branch-lagos', branchName: 'Lagos Branch', amount: 1850000 },
    { branchId: 'branch-abuja', branchName: 'Abuja Branch', amount: 1170000 },
    { branchId: 'branch-ph', branchName: 'Port Harcourt Branch', amount: 980000 },
    { branchId: 'branch-kano', branchName: 'Kano Branch', amount: 760000 },
    { branchId: 'branch-enugu', branchName: 'Enugu Branch', amount: 540000 },
  ],
};

const MOCK_BRANCH_SPEND_BY_PERIOD: Record<BranchSpendPeriod, BranchSpendItem[]> = {
  today: [
    { branchId: 'branch-hq', branchName: 'Head Office', amount: 85000 },
    { branchId: 'branch-lagos', branchName: 'Lagos Branch', amount: 50000 },
    { branchId: 'branch-abuja', branchName: 'Abuja Branch', amount: 32000 },
    { branchId: 'branch-ph', branchName: 'Port Harcourt Branch', amount: 24500 },
    { branchId: 'branch-kano', branchName: 'Kano Branch', amount: 10000 },
    { branchId: 'branch-enugu', branchName: 'Enugu Branch', amount: 0 },
  ],
  '7d': [
    { branchId: 'branch-hq', branchName: 'Head Office', amount: 420000 },
    { branchId: 'branch-lagos', branchName: 'Lagos Branch', amount: 385000 },
    { branchId: 'branch-abuja', branchName: 'Abuja Branch', amount: 210000 },
    { branchId: 'branch-ph', branchName: 'Port Harcourt Branch', amount: 175000 },
    { branchId: 'branch-kano', branchName: 'Kano Branch', amount: 98000 },
    { branchId: 'branch-enugu', branchName: 'Enugu Branch', amount: 65000 },
  ],
  '30d': [
    { branchId: 'branch-hq', branchName: 'Head Office', amount: 2100000 },
    { branchId: 'branch-lagos', branchName: 'Lagos Branch', amount: 1850000 },
    { branchId: 'branch-abuja', branchName: 'Abuja Branch', amount: 1170000 },
    { branchId: 'branch-ph', branchName: 'Port Harcourt Branch', amount: 980000 },
    { branchId: 'branch-kano', branchName: 'Kano Branch', amount: 760000 },
    { branchId: 'branch-enugu', branchName: 'Enugu Branch', amount: 540000 },
  ],
  all: [
    { branchId: 'branch-hq', branchName: 'Head Office', amount: 8450000 },
    { branchId: 'branch-lagos', branchName: 'Lagos Branch', amount: 7120000 },
    { branchId: 'branch-abuja', branchName: 'Abuja Branch', amount: 4980000 },
    { branchId: 'branch-ph', branchName: 'Port Harcourt Branch', amount: 3650000 },
    { branchId: 'branch-kano', branchName: 'Kano Branch', amount: 2890000 },
    { branchId: 'branch-enugu', branchName: 'Enugu Branch', amount: 1920000 },
  ],
};

export function getMockBranchSpendForPeriod(
  period: BranchSpendPeriod,
  role: BusinessRole,
): BranchSpendItem[] {
  const spend = MOCK_BRANCH_SPEND_BY_PERIOD[period];
  const profile = DEMO_ROLE_PROFILES[role];

  if (isBranchScopedRole(role) && profile.branchId) {
    return spend.filter((item) => item.branchId === profile.branchId);
  }

  if (canViewCompanyWallet(role)) {
    return spend;
  }

  return spend;
}

export function getMockDashboardForRole(role: BusinessRole): BusinessDashboardData {
  const base = MOCK_DASHBOARD;
  const profile = DEMO_ROLE_PROFILES[role];

  if (isBranchScopedRole(role) && profile.branchId) {
    return {
      ...base,
      user: profile,
      meters: base.meters.filter((m) => m.branchId === profile.branchId),
      recentTransactions: MOCK_TRANSACTIONS.filter((t) => t.branchName === profile.branchName),
      branchSpend: base.branchSpend.filter((b) => b.branchId === profile.branchId),
      wallet:
        role === 'branch_viewer' || role === 'branch_operations' || role === 'branch_finance' || role === 'branch_admin'
          ? {
              ...base.wallet,
              availableBalance:
                MOCK_BRANCH_WALLET_OVERVIEW.find((b) => b.branchId === profile.branchId)?.allocatedBalance ??
                0,
              balance:
                MOCK_BRANCH_WALLET_OVERVIEW.find((b) => b.branchId === profile.branchId)?.allocatedBalance ??
                0,
            }
          : base.wallet,
    };
  }

  return { ...base, user: profile };
}

export function getMockTransactionsForRole(role: BusinessRole): BusinessTransactionPreview[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchName) {
    return MOCK_TRANSACTIONS.filter((t) => t.branchName === profile.branchName);
  }
  return MOCK_TRANSACTIONS;
}

export function getMockBranchesForRole(role: BusinessRole): BusinessBranch[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchId) {
    return MOCK_BRANCHES.filter((b) => b.id === profile.branchId);
  }
  return MOCK_BRANCHES;
}

/** Operating locations only — Head Office is company HQ, not a branch. */
export function getOperatingBranchesForRole(role: BusinessRole): BusinessBranch[] {
  return getMockBranchesForRole(role).filter((branch) => !branch.isHeadOffice);
}

export function getMockTeamForRole(role: BusinessRole): BusinessTeamMember[] {
  const profile = DEMO_ROLE_PROFILES[role];

  if (role === 'super_admin') {
    return MOCK_TEAM;
  }

  if (isBranchScopedRole(role) && profile.branchId) {
    return MOCK_TEAM.filter((m) => m.branchId === profile.branchId);
  }

  // HQ non-admin roles: Head Office roster only
  return MOCK_TEAM.filter((m) => m.branchId === HEAD_OFFICE_BRANCH_ID);
}

export function getMockBeneficiariesForRole(role: BusinessRole): BusinessBeneficiary[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchName) {
    return MOCK_BENEFICIARIES.filter((b) => b.branchName === profile.branchName);
  }
  return MOCK_BENEFICIARIES;
}

export function getMockBeneficiaryGroupsForRole(role: BusinessRole): BeneficiaryGroup[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchName) {
    return MOCK_BENEFICIARY_GROUPS.filter((group) => group.branchName === profile.branchName);
  }
  return MOCK_BENEFICIARY_GROUPS;
}

/** All phone groups — usable for airtime or data bulk (service picks the pay type). */
export function getBeneficiaryGroupsForBulk(
  role: BusinessRole,
  _service?: 'airtime' | 'data',
): BeneficiaryGroup[] {
  return getMockBeneficiaryGroupsForRole(role);
}

export function getBeneficiaryGroupById(
  role: BusinessRole,
  groupId: string,
): BeneficiaryGroup | undefined {
  return getMockBeneficiaryGroupsForRole(role).find((group) => group.id === groupId);
}

export function getMockBranchWalletOverviewForRole(role: BusinessRole): BranchWalletOverview[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchId) {
    return MOCK_BRANCH_WALLET_OVERVIEW.filter((b) => b.branchId === profile.branchId);
  }
  return MOCK_BRANCH_WALLET_OVERVIEW;
}

export function canViewAllBranchWalletInfo(role: BusinessRole): boolean {
  return canViewCompanyWallet(role);
}

/** Branches that can receive allocations from Head Office (excludes HQ). */
export function getAllocatableBranchesForRole(role: BusinessRole): BranchWalletOverview[] {
  if (!canViewCompanyWallet(role)) return [];
  return MOCK_BRANCH_WALLET_OVERVIEW.filter((branch) => branch.branchId !== HEAD_OFFICE_BRANCH_ID);
}

export function getHeadOfficeCompanyBalance(): number {
  return MOCK_DASHBOARD.wallet.availableBalance;
}

/** Head Office company-wallet scope for wallet overview (not an allocated branch pot). */
export function getHeadOfficeWalletScope(): BranchWalletOverview {
  const hqTransactions = MOCK_TRANSACTIONS.filter((tx) => tx.branchName === 'Head Office');
  return {
    branchId: HEAD_OFFICE_BRANCH_ID,
    branchName: 'Head Office',
    allocatedBalance: getHeadOfficeCompanyBalance(),
    todaySpend: MOCK_DASHBOARD.wallet.todaySpend,
    monthSpend: MOCK_DASHBOARD.wallet.monthSpend,
    monthTransactions: hqTransactions.length,
  };
}

/**
 * Wallet page scopes: Head Office (company wallet) first for HQ roles,
 * then allocated branch wallets. Branch roles only see their branch.
 */
export function getWalletScopeOptionsForRole(role: BusinessRole): BranchWalletOverview[] {
  const branches = getMockBranchWalletOverviewForRole(role);
  if (!canViewCompanyWallet(role)) {
    return branches;
  }
  return [getHeadOfficeWalletScope(), ...branches];
}

export function isHeadOfficeWalletScope(branchId: string | null | undefined): boolean {
  return branchId === HEAD_OFFICE_BRANCH_ID;
}

/** Sum of funds already sent to operating branches (Head Office is not included). */
export function getTotalAllocatedBalance(): number {
  return MOCK_BRANCH_WALLET_OVERVIEW.reduce((sum, b) => sum + b.allocatedBalance, 0);
}

/** Company wallet remaining at Head Office — what can still be allocated out. */
export function getUnallocatedCompanyBalance(): number {
  return MOCK_DASHBOARD.wallet.availableBalance;
}

export function getTotalCompanyFunds(): number {
  return getHeadOfficeCompanyBalance() + getTotalAllocatedBalance();
}

export function getMockWalletStatementsForRole(role: BusinessRole): WalletStatementRow[] {
  const profile = DEMO_ROLE_PROFILES[role];
  if (isBranchScopedRole(role) && profile.branchName) {
    return MOCK_WALLET_STATEMENTS.filter((row) => row.branchName === profile.branchName);
  }
  return MOCK_WALLET_STATEMENTS;
}

export function getMockStatementBranchFilterOptions(role: BusinessRole): string[] {
  const statements = getMockWalletStatementsForRole(role);
  const branchNames = new Set<string>();
  const profile = DEMO_ROLE_PROFILES[role];

  for (const row of statements) {
    if (row.branchName) {
      branchNames.add(row.branchName);
    }
  }

  for (const branch of MOCK_BRANCH_WALLET_OVERVIEW) {
    if (!isBranchScopedRole(role) || branch.branchId === profile.branchId) {
      branchNames.add(branch.branchName);
    }
  }

  if (canViewCompanyWallet(role)) {
    branchNames.add('Head Office');
  }

  return Array.from(branchNames).sort((a, b) => a.localeCompare(b));
}

export function getWalletBalanceDisplayForRole(role: BusinessRole): {
  label: string;
  balance: number;
} {
  if (canViewCompanyWallet(role)) {
    return {
      label: 'Company wallet (Head Office)',
      balance: MOCK_DASHBOARD.wallet.availableBalance,
    };
  }

  const profile = DEMO_ROLE_PROFILES[role];
  const branch = MOCK_BRANCH_WALLET_OVERVIEW.find((b) => b.branchId === profile.branchId);

  return {
    label: 'Branch wallet balance',
    balance: branch?.allocatedBalance ?? 0,
  };
}

export function getMockAnalyticsForRole(role: BusinessRole): BusinessAnalyticsData {
  const dashboard = getMockDashboardForRole(role);
  const transactions = getMockTransactionsForRole(role);

  const serviceMap = new Map<string, { amount: number; count: number }>();
  for (const tx of transactions) {
    const current = serviceMap.get(tx.service) ?? { amount: 0, count: 0 };
    serviceMap.set(tx.service, {
      amount: current.amount + tx.amount,
      count: current.count + 1,
    });
  }

  const totalTransactionsThisMonth = transactions.length;
  const totalSpendThisMonth = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return {
    totalSpendThisMonth,
    totalTransactionsThisMonth,
    averageTransactionAmount:
      totalTransactionsThisMonth > 0 ? Math.round(totalSpendThisMonth / totalTransactionsThisMonth) : 0,
    branchSpend: dashboard.branchSpend,
    serviceBreakdown: Array.from(serviceMap.entries()).map(([service, data]) => ({
      service,
      amount: data.amount,
      count: data.count,
    })),
  };
}
