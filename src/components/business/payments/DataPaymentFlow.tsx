'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import {
  AIRTIME_NETWORKS,
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
  type NormalizedUtilityPlan,
} from '@/lib/businessPaymentsApi';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';
import {
  FieldLabel,
  OptionPager,
  PayButton,
  PaymentFailedView,
  PaymentSourceCard,
  PaymentSuccessView,
  ProviderTiles,
  ReviewList,
  SavedBeneficiaryPicker,
  fieldClass,
  usePagedItems,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed' | 'pending';

export function DataPaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const initialNetwork = params.get('network')?.toLowerCase() || 'mtn';
  const [view, setView] = useState<View>('form');
  const [network, setNetwork] = useState(initialNetwork);
  const [phone, setPhone] = useState(params.get('phoneNumber') ?? '');
  const [planKey, setPlanKey] = useState(params.get('dataPlan') ?? '');
  const [plans, setPlans] = useState<NormalizedUtilityPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);

  const selectedPlan = plans.find((plan) => plan.code === planKey) ?? null;
  const amount = selectedPlan?.amount ?? 0;
  const phoneOk = isValidNigerianPhone(phone);
  const {
    pageItems: visiblePlans,
    page: planPage,
    pageCount: planPageCount,
    setPage: setPlanPage,
  } = usePagedItems(plans, network);

  const preferredPlan = params.get('dataPlan') ?? '';

  useEffect(() => {
    let cancelled = false;
    setPlansLoading(true);
    setPlans([]);
    setPlanKey('');

    (async () => {
      try {
        const next = await businessPaymentsApi.dataPlans(network);
        if (cancelled) return;
        setPlans(next);
        const match =
          (preferredPlan &&
            next.find(
              (plan) =>
                plan.code === preferredPlan ||
                plan.tariffClass === preferredPlan ||
                plan.name === preferredPlan,
            )) ||
          next[0];
        setPlanKey(match?.code ?? '');
      } catch (error) {
        if (cancelled) return;
        setPlans([]);
        setPlanKey('');
        toast.error(paymentErrorMessage(error, 'Could not load data plans'));
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [network, preferredPlan]);

  const blockReason = getPaymentBlockReason({
    amount,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });

  const summary = useMemo(
    () => [
      { label: 'Network', value: getProviderName('data', network) },
      { label: 'Phone', value: phone ? normalizePhone(phone) : '—' },
      {
        label: 'Plan',
        value: selectedPlan
          ? `${selectedPlan.name}${selectedPlan.validity ? ` · ${selectedPlan.validity}` : ''}`
          : '—',
      },
      { label: 'Debit', value: amount ? formatPrice(amount) : '—' },
    ],
    [amount, network, phone, selectedPlan],
  );

  const reset = () => {
    setView('form');
    setPhone('');
    setResult(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!phoneOk) {
      toast.error('Enter a valid Nigerian phone number');
      return;
    }
    if (!selectedPlan) {
      toast.error('Select a data plan');
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      const data = await businessPaymentsApi.buyData({
        phone: normalizeBusinessPhone(phone),
        amount: selectedPlan.amount,
        disco: networkToDisco(network),
        tariffClass: selectedPlan.tariffClass,
        branchId: session.spendBranchId,
        walletId: session.spendWalletId,
      });
      setResult({ reference: data.reference, status: data.status });
      setView(data.pending || data.status === 'pending' ? 'pending' : 'success');
      toast.success(
        data.pending || data.status === 'pending'
          ? 'Data purchase is processing'
          : 'Data bundle sent successfully',
      );
      await session.refreshWallet?.();
    } catch (error) {
      setView('failed');
      toast.error(paymentErrorMessage(error, 'Data payment could not be completed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Data"
        description="Buy data bundles for staff and branch lines from the company wallet."
      />

      {view === 'success' && result && selectedPlan ? (
        <PaymentSuccessView
          title="Data sent"
          description={`${selectedPlan.name}${selectedPlan.validity ? ` (${selectedPlan.validity})` : ''} has been sent to ${normalizePhone(phone)}.`}
          reference={result.reference}
          rows={[...summary, { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' }]}
          onAgain={reset}
          againLabel="Buy data again"
        />
      ) : view === 'pending' && result && selectedPlan ? (
        <PaymentSuccessView
          title="Data processing"
          description="Your purchase is being confirmed with the provider. The wallet debit will be refunded automatically if it fails."
          reference={result.reference}
          rows={[
            ...summary,
            { label: 'Status', value: 'Pending confirmation' },
            { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' },
          ]}
          onAgain={reset}
          againLabel="Buy data again"
        />
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="The data provider did not complete this request. Check the number and try again."
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
              service="data"
              beneficiaries={session.beneficiaries}
              selectedAccount={phone}
              onSelect={(beneficiary) => {
                setPhone(beneficiary.accountNumber);
                setNetwork(beneficiary.provider.toLowerCase());
              }}
            />

            <div>
              <FieldLabel>Network</FieldLabel>
              <ProviderTiles
                options={AIRTIME_NETWORKS}
                value={network}
                onChange={(next) => {
                  setNetwork(next);
                }}
              />
            </div>

            <div>
              <FieldLabel htmlFor="data-phone">Phone number</FieldLabel>
              <input
                id="data-phone"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                className={fieldClass}
              />
            </div>

            <div>
              <FieldLabel>Data plan</FieldLabel>
              {plansLoading ? (
                <p className="mt-2 text-sm text-gray-500">Loading plans…</p>
              ) : plans.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No plans available for this network.</p>
              ) : (
                <>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                    {visiblePlans.map((plan) => {
                      const selected = plan.code === selectedPlan?.code;
                      return (
                        <button
                          key={plan.code}
                          type="button"
                          onClick={() => setPlanKey(plan.code)}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-left',
                            selected
                              ? 'border-blue-normal bg-blue-50 ring-2 ring-blue-normal/20'
                              : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <p className="text-sm font-semibold text-gray-900">
                            {plan.name}
                            {plan.validity ? ` · ${plan.validity}` : ''}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{formatPrice(plan.amount)}</p>
                        </button>
                      );
                    })}
                  </div>
                  <OptionPager page={planPage} pageCount={planPageCount} onPageChange={setPlanPage} />
                </>
              )}
            </div>

            <ReviewList rows={summary} />

            <PayButton
              pending={pending}
              disabled={!phoneOk || !selectedPlan || plansLoading || Boolean(blockReason)}
              label={`Pay ${amount ? formatPrice(amount) : 'data'}`}
            />
          </form>
        </>
      )}
    </div>
  );
}
