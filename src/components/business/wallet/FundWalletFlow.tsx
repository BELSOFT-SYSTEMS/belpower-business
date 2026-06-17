'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Check,
  Clock,
  Copy,
  Loader2,
  Lock,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import {
  createMockWalletFundInvoice,
  formatFundCountdown,
  getRemainingFundSeconds,
  MAX_WALLET_FUND_AMOUNT,
  MIN_WALLET_FUND_AMOUNT,
  mockInitWalletCardFund,
  mockPollWalletFundPayment,
  type MockWalletFundInvoice,
} from '@/data/mockWalletFundFlow';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';

type PaymentMethod = 'card' | 'bank';
type FlowView = 'form' | 'card-redirect' | 'bank-waiting' | 'success' | 'failed' | 'expired';

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function FundWalletFlow() {
  const [amountInput, setAmountInput] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [invoice, setInvoice] = useState<MockWalletFundInvoice | null>(null);
  const [view, setView] = useState<FlowView>('form');
  const [countdown, setCountdown] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isInitializingBank, setIsInitializingBank] = useState(false);
  const [isStartingCard, setIsStartingCard] = useState(false);
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);
  const pollingRef = useRef(false);

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);
  const amountIsValid =
    amount >= MIN_WALLET_FUND_AMOUNT && amount <= MAX_WALLET_FUND_AMOUNT;

  const resetFlow = useCallback(() => {
    setMethod(null);
    setInvoice(null);
    setView('form');
    setCountdown(0);
    setCopiedField(null);
    setIsInitializingBank(false);
    setIsStartingCard(false);
    setIsConfirmingTransfer(false);
    pollingRef.current = false;
  }, []);

  const handleCopy = useCallback((value: string, field: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${label} copied`);
    window.setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleAmountChange = (value: string) => {
    setAmountInput(value);
    if (method || invoice) {
      resetFlow();
    }
  };

  const handleSelectBank = useCallback(async () => {
    if (!amountIsValid || isInitializingBank) return;

    setMethod('bank');
    setIsInitializingBank(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      const nextInvoice = createMockWalletFundInvoice(amount);
      setInvoice(nextInvoice);
      setView('form');
      toast.success('Transfer details ready. Complete payment within 30 minutes.');
    } catch {
      toast.error('Could not create transfer details');
      setMethod(null);
    } finally {
      setIsInitializingBank(false);
    }
  }, [amount, amountIsValid, isInitializingBank]);

  const handleCardPay = useCallback(async () => {
    if (!amountIsValid || isStartingCard) return;

    setMethod('card');
    setIsStartingCard(true);
    setView('card-redirect');

    try {
      const init = await mockInitWalletCardFund(amount);
      toast.message('Opening Paystack checkout (demo)…');
      await new Promise((resolve) => window.setTimeout(resolve, 1800));
      void init.authorization_url;
      setView('success');
      toast.success('Wallet funded successfully (demo)');
    } catch {
      setView('failed');
      toast.error('Card payment could not be started');
    } finally {
      setIsStartingCard(false);
    }
  }, [amount, amountIsValid, isStartingCard]);

  const handleConfirmTransfer = useCallback(async () => {
    if (!invoice || isConfirmingTransfer || pollingRef.current) return;

    setIsConfirmingTransfer(true);
    setView('bank-waiting');
    pollingRef.current = true;

    try {
      const result = await mockPollWalletFundPayment(invoice.transaction_id, () => {
        setView('bank-waiting');
      });

      if (result === 'completed') {
        setView('success');
        toast.success('Payment successful! Your wallet has been credited.');
        return;
      }

      if (result === 'expired') {
        setView('expired');
        return;
      }

      setView('failed');
      toast.error('Transfer could not be confirmed');
    } catch {
      setView('failed');
      toast.error('Transfer could not be confirmed');
    } finally {
      setIsConfirmingTransfer(false);
      pollingRef.current = false;
    }
  }, [invoice, isConfirmingTransfer]);

  useEffect(() => {
    if (!invoice?.expires_at || view === 'success') return;

    const tick = () => {
      const remaining = getRemainingFundSeconds(invoice.expires_at);
      setCountdown(remaining);
      if (remaining <= 0 && (view === 'form' || view === 'bank-waiting') && method === 'bank') {
        setView('expired');
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [invoice?.expires_at, method, view]);

  if (view === 'success') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Fund wallet" description="Add money to your company wallet." />
        <section className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-white">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Payment successful</h2>
          <p className="mt-2 text-sm text-gray-600">
            {formatPrice(amount)} has been credited to your business wallet (demo).
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/business/wallet"
              className="rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
            >
              Back to wallet
            </Link>
            <button
              type="button"
              onClick={() => {
                setAmountInput('');
                resetFlow();
              }}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fund again
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (view === 'failed' || view === 'expired') {
    const isExpired = view === 'expired';
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Fund wallet" description="Add money to your company wallet." />
        <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white',
              isExpired ? 'border-amber-200' : 'border-red-200',
            )}
          >
            {isExpired ? (
              <Clock className="h-8 w-8 text-amber-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isExpired ? 'Invoice expired' : 'Payment failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isExpired
              ? 'This payment window has ended. Start a new transfer to continue.'
              : 'We could not confirm your payment. If you transferred the wrong amount, funds may still be credited to your wallet.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setAmountInput(String(amount));
              resetFlow();
            }}
            className="mt-6 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Fund wallet"
        description="Enter an amount, then choose card or bank transfer — all on this page."
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="fund-amount" className="text-sm font-medium text-gray-900">
          How much do you want to add?
        </label>
        <input
          id="fund-amount"
          type="number"
          min={MIN_WALLET_FUND_AMOUNT}
          max={MAX_WALLET_FUND_AMOUNT}
          value={amountInput}
          onChange={(event) => handleAmountChange(event.target.value)}
          placeholder={`Enter amount (min ${formatPrice(MIN_WALLET_FUND_AMOUNT)})`}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
          disabled={view === 'card-redirect' || view === 'bank-waiting'}
        />
        <p className="mt-2 text-xs text-gray-500">
          Minimum {formatPrice(MIN_WALLET_FUND_AMOUNT)} · Maximum {formatPrice(MAX_WALLET_FUND_AMOUNT)}
        </p>
        {amountInput && !amountIsValid ? (
          <p className="mt-2 text-xs text-red-600">
            Enter an amount between {formatPrice(MIN_WALLET_FUND_AMOUNT)} and{' '}
            {formatPrice(MAX_WALLET_FUND_AMOUNT)}.
          </p>
        ) : null}
      </section>

      {amountIsValid ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Choose payment method</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setMethod('card');
                setInvoice(null);
              }}
              disabled={view === 'card-redirect' || view === 'bank-waiting'}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:bg-gray-50',
                method === 'card' ? 'border-blue-normal ring-2 ring-blue-normal/20' : 'border-gray-200',
              )}
            >
              <Image src="/paystack.png" alt="Paystack" width={32} height={32} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Pay with Paystack</p>
                <p className="text-xs text-gray-500">Top up using your debit card</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleSelectBank}
              disabled={isInitializingBank || view === 'card-redirect' || view === 'bank-waiting'}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:bg-gray-50',
                method === 'bank' ? 'border-blue-normal ring-2 ring-blue-normal/20' : 'border-gray-200',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-light text-blue-normal">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bank transfer</p>
                <p className="text-xs text-gray-500">
                  {isInitializingBank ? 'Preparing details…' : 'Transfer from your bank account'}
                </p>
              </div>
            </button>
          </div>
        </section>
      ) : null}

      {amountIsValid && method === 'card' ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Secured by Paystack</span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-gray-900">{formatPrice(amount)}</p>
          <p className="mt-1 text-sm text-gray-500">You will be redirected to Paystack to complete payment.</p>
          <button
            type="button"
            onClick={handleCardPay}
            disabled={isStartingCard || view === 'card-redirect'}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-normal px-4 py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStartingCard || view === 'card-redirect' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Paystack…
              </>
            ) : (
              'Pay with Paystack'
            )}
          </button>
        </section>
      ) : null}

      {amountIsValid && method === 'bank' && invoice ? (
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Invoice expires in
              </p>
              <p className="text-2xl font-bold tabular-nums text-amber-900">
                {formatFundCountdown(countdown)}
              </p>
            </div>
            <Clock className="h-7 w-7 text-amber-600" />
          </div>

          <div className="rounded-lg border-2 border-blue-normal/20 bg-blue-light/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-normal">
              Transfer exactly
            </p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(invoice.amount)}</p>
              <button
                type="button"
                onClick={() => handleCopy(String(invoice.amount), 'amount', 'Amount')}
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                aria-label="Copy amount"
              >
                {copiedField === 'amount' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Transfer to this account</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Bank name</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {invoice.bank_name} ({invoice.bank_code})
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Account number
                  </dt>
                  <dd className="mt-1 text-xl font-bold tracking-wider text-gray-900">
                    {invoice.account_number}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(invoice.account_number, 'account', 'Account number')
                  }
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                  aria-label="Copy account number"
                >
                  {copiedField === 'account' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Account name
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{invoice.account_name}</dd>
              </div>
            </dl>
          </div>

          {view === 'bank-waiting' ? (
            <div className="flex items-center gap-3 rounded-lg bg-blue-light/40 p-4">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-normal" />
              <p className="text-sm text-blue-normal">Waiting for payment confirmation…</p>
            </div>
          ) : null}

          <div className="rounded-lg bg-blue-light/40 p-4 text-xs leading-relaxed text-blue-normal">
            Transfer the exact amount shown above to this account within 30 minutes. Your wallet
            will be credited automatically once payment is confirmed. Wallet funding is for utility
            payments only — not a bank deposit.
          </div>

          {view !== 'bank-waiting' ? (
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isConfirmingTransfer}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-normal px-4 py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              I have made the payment
            </button>
          ) : null}
        </section>
      ) : null}

      <p className="text-center text-xs text-gray-500">
        Demo UI — no real payments processed. Phase 3 will connect live Paystack and BuyPower DVA APIs.
      </p>
    </div>
  );
}
