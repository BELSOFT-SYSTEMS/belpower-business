export type BusinessRole =
  | 'super_admin'
  | 'hq_finance'
  | 'hq_operations'
  | 'hq_viewer'
  | 'branch_admin'
  | 'branch_finance'
  | 'branch_operations'
  | 'branch_viewer';

export type BusinessProfile = {
  id: string;
  businessId: string;
  businessName: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: string;
};

export type BranchMeter = {
  id: string;
  branchId: string;
  branchName: string;
  meterNumber: string;
  disco: string;
  meterType: 'prepaid' | 'postpaid';
  isHeadOffice: boolean;
};

export type BusinessUserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BusinessRole;
  branchId: string | null;
  branchName: string | null;
};

export type BusinessWalletSummary = {
  balance: number;
  availableBalance: number;
  todaySpend: number;
  monthSpend: number;
  currency: 'NGN';
  isFrozen: boolean;
  dailyLimit: number;
};

export type VirtualAccountInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

export type WalletStatementRow = {
  id: string;
  reference: string;
  type: 'credit' | 'debit';
  description: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  branchName: string | null;
  performedByName: string;
  performedByRole: BusinessRole;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
};

export type BranchWalletOverview = {
  branchId: string;
  branchName: string;
  allocatedBalance: number;
  todaySpend: number;
  monthSpend: number;
  monthTransactions: number;
};

export type BusinessBranch = {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  isHeadOffice: boolean;
  userCount: number;
  meterCount: number;
  status: 'active' | 'inactive';
};

export type BusinessTeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BusinessRole;
  branchId: string | null;
  branchName: string | null;
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt: string | null;
};

export type BusinessBeneficiary = {
  id: string;
  label: string;
  /** `phone` is shared for airtime + data — one number list for both. */
  service: 'electricity' | 'phone' | 'cable' | 'airtime' | 'data';
  provider: string;
  accountNumber: string;
  branchName: string;
  createdAt: string;
  meterType?: 'prepaid' | 'postpaid';
  customerName?: string;
  address?: string;
  isPrimary?: boolean;
  verified?: boolean;
};

/** Phone entry inside a numbers group (for bulk airtime/data). */
export type BeneficiaryGroupMember = {
  id: string;
  label?: string;
  provider: string;
  accountNumber: string;
  verified?: boolean;
};

/** Named set of phone numbers — usable for airtime or data bulk pay. */
export type BeneficiaryGroup = {
  id: string;
  name: string;
  service: 'phone';
  branchName: string;
  createdAt: string;
  isPrimary?: boolean;
  members: BeneficiaryGroupMember[];
};

export type BusinessNotification = {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'wallet' | 'team' | 'system';
  read: boolean;
  createdAt: string;
};

export type BusinessTransactionPreview = {
  id: string;
  reference: string;
  service: string;
  provider: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  entryType: 'credit' | 'debit';
  branchName: string;
  userName: string;
  createdAt: string;
};

export type BranchSpendPeriod = 'today' | '7d' | '30d' | 'all';

export type BranchSpendItem = {
  branchId: string;
  branchName: string;
  amount: number;
};

export type BusinessDashboardData = {
  business: BusinessProfile;
  user: BusinessUserProfile;
  wallet: BusinessWalletSummary;
  meters: BranchMeter[];
  recentTransactions: BusinessTransactionPreview[];
  branchSpend: BranchSpendItem[];
};

export type BusinessAnalyticsData = {
  totalSpendThisMonth: number;
  totalTransactionsThisMonth: number;
  averageTransactionAmount: number;
  branchSpend: BranchSpendItem[];
  serviceBreakdown: { service: string; amount: number; count: number }[];
};
