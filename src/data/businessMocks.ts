import type {
  BusinessBeneficiary,
  BusinessBranch,
  BusinessDashboardData,
  BusinessNotification,
  BusinessRole,
  BranchWalletOverview,
  BusinessTeamMember,
  BusinessTransactionPreview,
  BusinessUserProfile,
  VirtualAccountInfo,
  WalletStatementRow,
} from '@/types/business';

export const MOCK_SUPER_ADMIN: BusinessUserProfile = {
  id: 'user-hq-1',
  firstName: 'Belba',
  lastName: 'Ngoy',
  email: 'admin@belsoftsystems.com',
  role: 'super_admin',
  branchId: 'branch-hq',
  branchName: 'Head Office',
};

export const MOCK_FINANCE_MANAGER: BusinessUserProfile = {
  id: 'user-finance-1',
  firstName: 'Chioma',
  lastName: 'Eze',
  email: 'finance@belsoftsystems.com',
  role: 'finance_manager',
  branchId: null,
  branchName: null,
};

export const MOCK_OPS_OFFICER: BusinessUserProfile = {
  id: 'user-abuja-1',
  firstName: 'Amina',
  lastName: 'Okafor',
  email: 'ops.abuja@belsoftsystems.com',
  role: 'operations_officer',
  branchId: 'branch-abuja',
  branchName: 'Abuja Branch',
};

export const MOCK_VIEWER: BusinessUserProfile = {
  id: 'user-viewer-1',
  firstName: 'Tunde',
  lastName: 'Bakare',
  email: 'viewer@belsoftsystems.com',
  role: 'viewer',
  branchId: 'branch-hq',
  branchName: 'Head Office',
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
    id: 'user-finance-1',
    firstName: 'Chioma',
    lastName: 'Eze',
    email: 'finance@belsoftsystems.com',
    role: 'finance_manager',
    branchId: null,
    branchName: 'All branches',
    status: 'active',
    lastActiveAt: '2026-06-11T08:00:00.000Z',
  },
  {
    id: 'user-abuja-1',
    firstName: 'Amina',
    lastName: 'Okafor',
    email: 'ops.abuja@belsoftsystems.com',
    role: 'operations_officer',
    branchId: 'branch-abuja',
    branchName: 'Abuja Branch',
    status: 'active',
    lastActiveAt: '2026-06-10T16:00:00.000Z',
  },
  {
    id: 'user-lagos-1',
    firstName: 'Emeka',
    lastName: 'Nwosu',
    email: 'ops.lagos@belsoftsystems.com',
    role: 'operations_officer',
    branchId: 'branch-lagos',
    branchName: 'Lagos Branch',
    status: 'active',
    lastActiveAt: '2026-06-09T14:20:00.000Z',
  },
  {
    id: 'user-invite-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@belsoftsystems.com',
    role: 'viewer',
    branchId: 'branch-hq',
    branchName: 'Head Office',
    status: 'invited',
    lastActiveAt: null,
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
  },
  {
    id: 'ben-2',
    label: 'Abuja office line',
    service: 'airtime',
    provider: 'mtn',
    accountNumber: '08031234567',
    branchName: 'Abuja Branch',
    createdAt: '2026-05-10T11:00:00.000Z',
  },
  {
    id: 'ben-3',
    label: 'Lagos staff data',
    service: 'data',
    provider: 'airtel',
    accountNumber: '08099887766',
    branchName: 'Lagos Branch',
    createdAt: '2026-05-15T14:00:00.000Z',
  },
  {
    id: 'ben-4',
    label: 'HQ DSTV',
    service: 'cable',
    provider: 'dstv',
    accountNumber: '7012345678',
    branchName: 'Head Office',
    createdAt: '2026-05-20T10:00:00.000Z',
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
];

export const MOCK_TRANSACTIONS: BusinessTransactionPreview[] = [
  {
    id: 'tx-1',
    reference: 'BEL-BIZ-20260611001',
    service: 'electricity',
    provider: 'ABUJA',
    amount: 85000,
    status: 'completed',
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
    branchName: 'Port Harcourt Branch',
    userName: 'Belba Ngoy',
    createdAt: '2026-06-08T09:00:00.000Z',
  },
];

export const MOCK_BRANCH_WALLET_OVERVIEW: BranchWalletOverview[] = [
  {
    branchId: 'branch-hq',
    branchName: 'Head Office',
    allocatedBalance: 600000,
    todaySpend: 85000,
    monthSpend: 2100000,
    monthTransactions: 48,
  },
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
    balanceAfter: 2450000,
    branchName: null,
    createdAt: '2026-06-11T09:00:00.000Z',
  },
  {
    id: 'ws-2',
    reference: 'BEL-BIZ-20260611001',
    type: 'debit',
    description: 'Electricity — ABUJA prepaid',
    amount: 85000,
    balanceAfter: 2365000,
    branchName: 'Head Office',
    createdAt: '2026-06-11T10:30:00.000Z',
  },
  {
    id: 'ws-3',
    reference: 'BEL-BIZ-20260611002',
    type: 'debit',
    description: 'Airtime — MTN',
    amount: 50000,
    balanceAfter: 2315000,
    branchName: 'Abuja Branch',
    createdAt: '2026-06-11T09:15:00.000Z',
  },
  {
    id: 'ws-4',
    reference: 'BEL-BIZ-20260610004',
    type: 'debit',
    description: 'Cable TV — DSTV',
    amount: 24500,
    balanceAfter: 2290500,
    branchName: 'Head Office',
    createdAt: '2026-06-10T11:00:00.000Z',
  },
  {
    id: 'ws-5',
    reference: 'BEL-BIZ-20260609005',
    type: 'debit',
    description: 'Electricity — IKEJA prepaid',
    amount: 120000,
    balanceAfter: 2170500,
    branchName: 'Lagos Branch',
    createdAt: '2026-06-09T14:30:00.000Z',
  },
  {
    id: 'ws-6',
    reference: 'BEL-BIZ-20260608006',
    type: 'debit',
    description: 'Airtime — Glo',
    amount: 10000,
    balanceAfter: 2160500,
    branchName: 'Port Harcourt Branch',
    createdAt: '2026-06-08T09:00:00.000Z',
  },
  {
    id: 'ws-7',
    reference: 'FUND-20260608001',
    type: 'credit',
    description: 'Bank transfer — wallet funding',
    amount: 1000000,
    balanceAfter: 1950000,
    branchName: null,
    createdAt: '2026-06-08T08:00:00.000Z',
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
    balance: 2450000,
    availableBalance: 2450000,
    todaySpend: 185000,
    monthSpend: 5120000,
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

export function getMockDashboardForRole(role: BusinessRole): BusinessDashboardData {
  const base = MOCK_DASHBOARD;
  if (role === 'operations_officer') {
    const branchId = MOCK_OPS_OFFICER.branchId!;
    return {
      ...base,
      user: MOCK_OPS_OFFICER,
      meters: base.meters.filter((m) => m.branchId === branchId),
      recentTransactions: MOCK_TRANSACTIONS.filter((t) => t.branchName === MOCK_OPS_OFFICER.branchName),
      branchSpend: base.branchSpend.filter((b) => b.branchId === branchId),
    };
  }
  if (role === 'finance_manager') {
    return { ...base, user: MOCK_FINANCE_MANAGER };
  }
  if (role === 'viewer') {
    return { ...base, user: MOCK_VIEWER };
  }
  return base;
}

export function getMockTransactionsForRole(role: BusinessRole): BusinessTransactionPreview[] {
  if (role === 'operations_officer') {
    return MOCK_TRANSACTIONS.filter((t) => t.branchName === MOCK_OPS_OFFICER.branchName);
  }
  return MOCK_TRANSACTIONS;
}

export function getMockBranchesForRole(role: BusinessRole): BusinessBranch[] {
  if (role === 'operations_officer') {
    return MOCK_BRANCHES.filter((b) => b.id === MOCK_OPS_OFFICER.branchId);
  }
  return MOCK_BRANCHES;
}

export function getMockTeamForRole(role: BusinessRole): BusinessTeamMember[] {
  if (role === 'operations_officer') {
    return MOCK_TEAM.filter((m) => m.branchId === MOCK_OPS_OFFICER.branchId || m.role === 'super_admin');
  }
  return MOCK_TEAM;
}

export function getMockBeneficiariesForRole(role: BusinessRole): BusinessBeneficiary[] {
  if (role === 'operations_officer') {
    return MOCK_BENEFICIARIES.filter((b) => b.branchName === MOCK_OPS_OFFICER.branchName);
  }
  return MOCK_BENEFICIARIES;
}

export function getMockBranchWalletOverviewForRole(role: BusinessRole): BranchWalletOverview[] {
  if (role === 'operations_officer') {
    return MOCK_BRANCH_WALLET_OVERVIEW.filter((b) => b.branchId === MOCK_OPS_OFFICER.branchId);
  }
  if (role === 'viewer' && MOCK_VIEWER.branchId) {
    return MOCK_BRANCH_WALLET_OVERVIEW.filter((b) => b.branchId === MOCK_VIEWER.branchId);
  }
  if (role === 'super_admin' || role === 'finance_manager') {
    return MOCK_BRANCH_WALLET_OVERVIEW;
  }
  return MOCK_BRANCH_WALLET_OVERVIEW;
}

export function getTotalAllocatedBalance(): number {
  return MOCK_BRANCH_WALLET_OVERVIEW.reduce((sum, b) => sum + b.allocatedBalance, 0);
}

export function getUnallocatedCompanyBalance(): number {
  return MOCK_DASHBOARD.wallet.availableBalance - getTotalAllocatedBalance();
}

export function getMockWalletStatementsForRole(role: BusinessRole): WalletStatementRow[] {
  if (role === 'operations_officer') {
    return MOCK_WALLET_STATEMENTS.filter(
      (row) => row.branchName === MOCK_OPS_OFFICER.branchName || row.branchName === null
    );
  }
  return MOCK_WALLET_STATEMENTS;
}

export function canViewAllBranchWalletInfo(role: BusinessRole): boolean {
  return role === 'super_admin' || role === 'finance_manager';
}

export function getWalletBalanceDisplayForRole(role: BusinessRole): {
  label: string;
  balance: number;
} {
  if (canViewAllBranchWalletInfo(role)) {
    return {
      label: 'Company wallet balance',
      balance: MOCK_DASHBOARD.wallet.availableBalance,
    };
  }

  const branchId =
    role === 'operations_officer' ? MOCK_OPS_OFFICER.branchId : MOCK_VIEWER.branchId;
  const branch = MOCK_BRANCH_WALLET_OVERVIEW.find((b) => b.branchId === branchId);

  return {
    label: 'Branch wallet balance',
    balance: branch?.allocatedBalance ?? 0,
  };
}
