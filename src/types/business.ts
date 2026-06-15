export type BusinessRole =
  | 'super_admin'
  | 'finance_manager'
  | 'operations_officer'
  | 'viewer';

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
  balanceAfter: number;
  branchName: string | null;
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
  service: 'electricity' | 'airtime' | 'data' | 'cable';
  provider: string;
  accountNumber: string;
  branchName: string;
  createdAt: string;
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
  branchName: string;
  userName: string;
  createdAt: string;
};

export type BusinessDashboardData = {
  business: BusinessProfile;
  user: BusinessUserProfile;
  wallet: BusinessWalletSummary;
  meters: BranchMeter[];
  recentTransactions: BusinessTransactionPreview[];
  branchSpend: { branchId: string; branchName: string; amount: number }[];
};
