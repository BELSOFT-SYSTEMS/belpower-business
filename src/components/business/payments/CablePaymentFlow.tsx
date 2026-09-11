'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  CABLE_PROVIDERS,
  getPaymentBlockReason,
  getProviderName,
  isValidNigerianPhone,
  type CableProviderId,
} from '@/data/mockPaymentCatalog';
import {
  businessPaymentsApi,
  cableToDisco,
  normalizeBusinessPhone,
  paymentErrorMessage,
  type NormalizedUtilityPlan,
} from '@/lib/businessPaymentsApi';
import { mapCableProviderOptions } from '@/utils/businessPaymentCatalog';
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
  paymentBranchLabel,
  usePagedItems,
  usePaymentSession,
  usePlanPackagePageSize,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed' | 'pending';

const FALLBACK_CABLE_OPTIONS = CABLE_PROVIDERS.filter((item) => item.id !== 'showmax').map(
  (item) => ({ ...item, available: true }),
);

export function CablePaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const { business } = useBusinessAuth();
  const initialProviderRaw = params.get('provider')?.toLowerCase() || 'dstv';
  const initialProvider = (
    initialProviderRaw === 'showmax' ? 'dstv' : initialProviderRaw
  ) as CableProviderId;
  const defaultPhone = business?.phone ? normalizeBusinessPhone(business.phone) : '';
  const [view, setView] = useState<View>('form');
  const [provider, setProvider] = useState<CableProviderId>(initialProvider);
  const [cableOptions, setCableOptions] = useState(FALLBACK_CABLE_OPTIONS);
  const [smartCard, setSmartCard] = useState(params.get('smartCardNumber') ?? '');
  const [phone, setPhone] = useState(defaultPhone);
  const [packageKey, setPackageKey] = useState(params.get('package') ?? '');
  const [packages, setPackages] = useState<NormalizedUtilityPlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);

  const cableTiles = useMemo(() => {
    const available = cableOptions.filter((item) => item.available);
    const source = available.length > 0 ? available : cableOptions;
    return source.map(({ id, name, logo }) => ({ id, name, logo }));
  }, [cableOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await businessPaymentsApi.cableProviders();
        if (cancelled) return;
        const next = mapCableProviderOptions(status, CABLE_PROVIDERS);
        const options = next.length > 0 ? next : FALLBACK_CABLE_OPTIONS;
        setCableOptions(options);
        setProvider((current) => {
          const available = options.filter((item) => item.available);
          const source = available.length > 0 ? available : options;
          const match = source.find((item) => item.id === current)?.id;
          return (match ?? source[0]?.id ?? current) as CableProviderId;
        });
      } catch {
        if (!cancelled) setCableOptions(FALLBACK_CABLE_OPTIONS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!phone && business?.phone) {
      setPhone(normalizeBusinessPhone(business.phone));
    }
  }, [business?.phone, phone]);

  const selectedPackage = packages.find((item) => item.code === packageKey) ?? null;
  const amount = selectedPackage?.amount ?? 0;
  const phoneOk = isValidNigerianPhone(phone);
  const packagePageSize = usePlanPackagePageSize();
  const {
    pageItems: visiblePackages,
    page: packagePage,
    pageCount: packagePageCount,
    setPage: setPackagePage,
  } = usePagedItems(packages, provider, packagePageSize);

  const preferredPackage = params.get('package') ?? '';

  useEffect(() => {
    let cancelled = false;
    setPackagesLoading(true);
    setPackages([]);
    setPackageKey('');

    (async () => {
      try {
        const next = await businessPaymentsApi.cablePlans(provider);
        if (cancelled) return;
        setPackages(next);
        const match =
          (preferredPackage &&
            next.find(
              (plan) =>
                plan.code === preferredPackage ||
                plan.tariffClass === preferredPackage ||
                plan.name.toLowerCase() === preferredPackage.toLowerCase(),
            )) ||
          next[0];
        setPackageKey(match?.code ?? '');
      } catch (error) {
        if (cancelled) return;
        setPackages([]);
        setPackageKey('');
        toast.error(paymentErrorMessage(error, 'Could not load cable packages'));
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, preferredPackage]);

  const blockReason = getPaymentBlockReason({
    amount,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });

  const summary = useMemo(
    () => [
      {
        label: 'Provider',
        value: getProviderName('cable', provider),
        avatar: { service: 'cable', provider },
      },
      { label: 'Smartcard', value: smartCard || '—' },
      { label: 'Package', value: selectedPackage?.name ?? '—' },
      { label: 'Phone', value: phoneOk ? normalizeBusinessPhone(phone) : '—' },
      { label: 'Debit', value: amount ? formatPrice(amount) : '—' },
    ],
    [amount, phone, phoneOk, provider, selectedPackage, smartCard],
  );

  const reset = () => {
    setView('form');
    setSmartCard('');
    setResult(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!smartCard.replace(/\D/g, '') || smartCard.replace(/\D/g, '').length < 8) {
      toast.error('Enter a valid smartcard / IUC number');
      return;
    }
    if (!selectedPackage) {
      toast.error('Select a package');
      return;
    }
    if (!phoneOk) {
      toast.error('Enter a valid Nigerian phone number');
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      const data = await businessPaymentsApi.buyCable({
        meter: smartCard.replace(/\D/g, ''),
        disco: cableToDisco(provider),
        tariffClass: selectedPackage.tariffClass,
        amount: selectedPackage.amount,
        phone: normalizeBusinessPhone(phone),
        branchId: session.spendBranchId,
        walletId: session.spendWalletId,
      });
      setResult({ reference: data.reference, status: data.status });
      setView(data.pending || data.status === 'pending' ? 'pending' : 'success');
      toast.success(
        data.pending || data.status === 'pending'
          ? 'Cable payment is processing'
          : 'Cable subscription paid successfully',
      );
      await session.refreshWallet?.();
    } catch (error) {
      setView('failed');
      toast.error(paymentErrorMessage(error, 'Cable payment could not be completed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Cable TV"
        description="Renew DStv, GOtv, and StarTimes for office locations."
      />

      {view === 'success' && result && selectedPackage ? (
        <PaymentSuccessView
          title="Subscription paid"
          description={`${selectedPackage.name} has been renewed for ${smartCard}.`}
          reference={result.reference}
          rows={[...summary, { label: 'Branch', value: paymentBranchLabel(session.selectedBranch) }]}
          onAgain={reset}
          againLabel="Pay another subscription"
        />
      ) : view === 'pending' && result && selectedPackage ? (
        <PaymentSuccessView
          title="Subscription processing"
          description="Your renewal is being confirmed with the provider. The wallet debit will be refunded automatically if it fails."
          reference={result.reference}
          rows={[
            ...summary,
            { label: 'Status', value: 'Pending confirmation' },
            { label: 'Branch', value: paymentBranchLabel(session.selectedBranch) },
          ]}
          onAgain={reset}
          againLabel="Pay another subscription"
        />
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="The cable provider did not complete this renewal. The smartcard is still filled in so you can retry."
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
              service="cable"
              beneficiaries={session.beneficiaries}
              selectedAccount={smartCard}
              onSelect={(beneficiary) => {
                setSmartCard(beneficiary.accountNumber);
                const next = beneficiary.provider.toLowerCase() as CableProviderId;
                setProvider(next === 'showmax' ? 'dstv' : next);
              }}
            />

            <div>
              <FieldLabel>Provider</FieldLabel>
              <ProviderTiles
                options={cableTiles}
                value={provider}
                onChange={(id) => {
                  setProvider(id as CableProviderId);
                }}
              />
            </div>

            <div>
              <FieldLabel htmlFor="smartcard">Smartcard / IUC</FieldLabel>
              <input
                id="smartcard"
                inputMode="numeric"
                value={smartCard}
                onChange={(event) => {
                  setSmartCard(event.target.value.replace(/[^\d]/g, ''));
                }}
                placeholder="7012345678"
                className={fieldClass}
              />
            </div>

            <div>
              <FieldLabel htmlFor="cable-phone">Contact phone</FieldLabel>
              <input
                id="cable-phone"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Required by the cable provider. Defaults to your business phone when available.
              </p>
            </div>

            <div>
              <FieldLabel>Package</FieldLabel>
              {packagesLoading ? (
                <p className="mt-2 text-sm text-gray-500">Loading packages…</p>
              ) : packages.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No packages available for this provider.</p>
              ) : (
                <>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                    {visiblePackages.map((item) => {
                      const selected = item.code === selectedPackage?.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setPackageKey(item.code)}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-left',
                            selected
                              ? 'border-blue-normal bg-blue-50 ring-2 ring-blue-normal/20'
                              : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <p className="line-clamp-2 break-words text-sm font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{formatPrice(item.amount)}</p>
                        </button>
                      );
                    })}
                  </div>
                  <OptionPager
                    page={packagePage}
                    pageCount={packagePageCount}
                    onPageChange={setPackagePage}
                  />
                </>
              )}
            </div>

            <ReviewList rows={summary} />

            <PayButton
              pending={pending}
              disabled={
                smartCard.replace(/\D/g, '').length < 8 ||
                !selectedPackage ||
                !phoneOk ||
                packagesLoading ||
                Boolean(blockReason)
              }
              label={`Pay ${amount ? formatPrice(amount) : 'subscription'}`}
            />
          </form>
        </>
      )}
    </div>
  );
}
