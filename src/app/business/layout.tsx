import type { Metadata } from 'next';
import { BusinessAuthProvider } from '@/context/BusinessAuthContext';
import BusinessDashboardLayout from './BusinessDashboardLayout';

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s · BelPower Business',
  },
  description:
    'BelPower Business — fund your wallet and pay utility bills for your company branches.',
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessAuthProvider>
      <BusinessDashboardLayout>{children}</BusinessDashboardLayout>
    </BusinessAuthProvider>
  );
}
