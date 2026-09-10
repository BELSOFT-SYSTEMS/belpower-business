'use client';

import { Suspense } from 'react';
import { FundWalletFlow } from '@/components/business/wallet/FundWalletFlow';

export default function FundWalletPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6 text-sm text-gray-500">Loading…</div>}>
      <FundWalletFlow />
    </Suspense>
  );
}
