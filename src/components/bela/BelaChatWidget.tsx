'use client';

import { BelaChatProvider } from '@/context/BelaChatContext';
import BelaChatFAB from './BelaChatFAB';
import BelaChatPanel from './BelaChatPanel';

export default function BelaChatWidget() {
  return (
    <BelaChatProvider>
      <BelaChatFAB />
      <BelaChatPanel />
    </BelaChatProvider>
  );
}
