'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import {
  AIRTIME_MAX,
  AIRTIME_MIN,
  AIRTIME_NETWORKS,
  AIRTIME_PRESETS,
  detectNetworkFromPhone,
  getPaymentBlockReason,
  getProviderName,
  isValidNigerianPhone,
  normalizePhone,
} from '@/data/mockPaymentCatalog';
import {
  businessPaymentsApi,
  networkToDisco,
  normalizeBusinessPhone,
  paymentErrorMessage,
} from '@/lib/businessPaymentsApi';
import { mapNetworkProviderOptions } from '@/utils/businessPaymentCatalog';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';
import {
  FieldLabel,
  PayButton,
  PaymentFailedView,
  PaymentSourceCard,
  PaymentSuccessView,
  ProviderTiles,
  SavedBeneficiaryPicker,
  ReviewList,
  fieldClass,
  paymentBranchLabel,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed' | 'pending';

const FALLBACK_NETWORKS = AIRTIME_NETWORKS.map((item) => ({ ...item, available: true }));

export function AirtimePaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const [view, setView] = useState<View>('form');
  const [network, setNetwork] = useState(params.get('network')?.toLowerCase() || 'mtn');
  const [networkOptions, setNetworkOptions] = useState(FALLBACK_NETWORKS);
  const [phone, setPhone] = useState(params.get('phoneNumber') ?? '');
  const [amountInput, setAmountInput] = useState(params.get('amount') ?? '');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);

  const networkTiles = useMemo(() => {
    const available = networkOptions.filter((item) => item.available);
    const source = available.length > 0 ? available : networkOptions;
    return source.map(({ id, name, logo }) => ({ id, name, logo }));
  }, [networkOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await businessPaymentsApi.networkProviders();
        if (cancelled) return;
        const next = mapNetworkProviderOptions(status, AIRTIME_NETWORKS);
        const options = next.length > 0 ? next : FALLBACK_NETWORKS;
        setNetworkOptions(options);
        setNetwork((current) => {
          const available = options.filter((item) => item.available);
          const source = available.length > 0 ? available : options;
          return source.find((item) => item.id === current)?.id ?? source[0]?.id ?? current;
        });
      } catch {
        if (!cancelled) setNetworkOptions(FALLBACK_NETWORKS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const amount = useMemo(() => Number(amountInput.replace(/,/g, '').trim()) || 0, [amountInput]);
  const phoneOk = isValidNigerianPhone(phone);
  const detected = detectNetworkFromPhone(phone);
  const blockReason = getPaymentBlockReason({
    amount,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });
  const amountInvalid = amount > 0 && (amount < AIRTIME_MIN || amount > AIRTIME_MAX);

  const reset = () => {
    setView('form');
    setPhone('');
    setAmountInput('');
    setResult(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!phoneOk) {
      toast.error('Enter a valid Nigerian phone number');
      return;
    }
    if (amount < AIRTIME_MIN || amount > AIRTIME_MAX) {
      toast.error(`Amount must be between ${formatPrice(AIRTIME_MIN)} and ${formatPrice(AIRTIME_MAX)}`);
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      const data = await businessPaymentsApi.buyAirtime({
        phone: normalizeBusinessPhone(phone),
        amount,
        disco: networkToDisco(network),
        branchId: session.spendBranchId,
        walletId: session.spendWalletId,
      });
      setResult({ reference: data.reference, status: data.status });
      setView(data.pending || data.status === 'pending' ? 'pending' : 'success');
      toast.success(
        data.pending || data.status === 'pending'
          ? 'Airtime purchase is processing'
          : 'Airtime sent successfully',
      );
      await session.refreshWallet?.();
    } catch (error) {
      setView('failed');
      toast.error(paymentErrorMessage(error, 'Airtime payment could not be completed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Airtime"
        description="Buy airtime for staff lines and office numbers from the company wallet."
      />

      {view === 'success' && result ? (
        <PaymentSuccessView
          title="Airtime sent"
          description={`${formatPrice(amount)} ${getProviderName('airtime', network)} airtime has been sent to ${normalizePhone(phone)}.`}
          reference={result.reference}
          rows={[
            { label: 'Network', value: getProviderName('airtime', network) },
            { label: 'Phone', value: normalizePhone(phone) },
            { label: 'Amount', value: formatPrice(amount) },
            { label: 'Branch', value: paymentBranchLabel(session.selectedBranch) },
          ]}
          onAgain={reset}
          againLabel="Buy airtime again"
        />
      ) : view === 'pending' && result ? (
        <PaymentSuccessView
          title="Airtime processing"
          description="Your purchase is being confirmed with the provider. The wallet debit will be refunded automatically if it fails."
          reference={result.reference}
          rows={[
            { label: 'Network', value: getProviderName('airtime', network) },
            { label: 'Phone', value: normalizePhone(phone) },
            { label: 'Amount', value: formatPrice(amount) },
            { label: 'Status', value: 'Pending confirmation' },
          ]}
          onAgain={reset}
          againLabel="Buy airtime again"
        />
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="The airtime provider did not complete this request. Check the number and try again."
          onRetry={() => setView('form')}
        />
      ) : (
        <>
          <PaymentSourceCard
            label={session.wallet.label}
            balance={session.wallet.balance}
            branches={session.branches}
            branchId={session.branchId}
            onBranchChange={session.setBranchId}
            canChargeToBranch={session.canChargeToBranch}
            chargeToBranch={session.chargeToBranch}
            onChargeToBranchChange={session.setChargeToBranch}
            amount={amount}
            frozen={session.frozen}
            todaySpend={session.todaySpend}
            dailyLimit={session.dailyLimit}
          />

          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <SavedBeneficiaryPicker
              service="airtime"
              beneficiaries={session.beneficiaries}
              selectedAccount={phone}
              onSelect={(beneficiary) => {
                setPhone(beneficiary.accountNumber);
                setNetwork(beneficiary.provider.toLowerCase());
              }}
            />

            <div>
              <FieldLabel>Network</FieldLabel>
              <ProviderTiles options={networkTiles} value={network} onChange={setNetwork} />
              {detected && detected !== network ? (
                <button
                  type="button"
                  onClick={() => setNetwork(detected)}
                  className="mt-2 text-xs font-medium text-blue-normal hover:underline"
                >
                  This number looks like {getProviderName('airtime', detected)}. Use that network?
                </button>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor="airtime-phone">Phone number</FieldLabel>
              <input
                id="airtime-phone"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                className={fieldClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="airtime-amount">Amount (NGN)</FieldLabel>
              <input
                id="airtime-amount"
                inputMode="numeric"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                placeholder="1000"
                className={fieldClass}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {AIRTIME_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(String(preset))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      amount === preset
                        ? 'border-blue-normal bg-blue-50 text-blue-normal'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    {formatPrice(preset)}
                  </button>
                ))}
              </div>
              {amountInvalid ? (
                <p className="mt-1.5 text-xs text-red-600">
                  Amount must be between {formatPrice(AIRTIME_MIN)} and {formatPrice(AIRTIME_MAX)}.
                </p>
              ) : null}
            </div>

            <ReviewList
              rows={[
                { label: 'Network', value: getProviderName('airtime', network) },
                { label: 'Phone', value: phoneOk ? normalizePhone(phone) : '—' },
                { label: 'Amount', value: amount ? formatPrice(amount) : '—' },
                { label: 'Debit from', value: session.wallet.label },
              ]}
            />

            <PayButton
              pending={pending}
              disabled={!phoneOk || amountInvalid || Boolean(blockReason) || amount <= 0}
              label={`Pay ${amount ? formatPrice(amount) : ''}`}
            />
          </form>
        </>
      )}
    </div>
  );
}
