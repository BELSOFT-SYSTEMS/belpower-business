'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { StatusBadge } from '@/components/business/StatusBadge';
import { BusinessProviderAvatar } from '@/components/business/BusinessProviderAvatar';
import {
  AIRTIME_MAX,
  AIRTIME_MIN,
  AIRTIME_NETWORKS,
  CABLE_PROVIDERS,
  ELECTRICITY_DISCOS,
  ELECTRICITY_MAX,
  ELECTRICITY_MIN,
  createPaymentReference,
  findCablePackage,
  findDataPlan,
  getCablePackages,
  getDataPlansForNetwork,
  getPaymentBlockReason,
  getProviderName,
  isValidNigerianPhone,
  mockCompletePayment,
  normalizePhone,
  resolveDiscoCode,
  type PaymentService,
} from '@/data/mockPaymentCatalog';
import { getBeneficiaryGroupById } from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';
import {
  PaymentFailedView,
  PaymentSourceCard,
  PaymentSuccessView,
  demoNote,
  fieldClass,
  paymentBranchLabel,
  primaryButtonClass,
  secondaryButtonClass,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type RowStatus = 'pending' | 'paid' | 'failed';

type BulkRow = {
  id: string;
  service: PaymentService;
  provider: string;
  account: string;
  amount: string;
  plan: string;
  status: RowStatus;
  message: string;
};

type View = 'form' | 'success' | 'failed';

const SAMPLE_CSV = `service,provider,account,amount,plan
airtime,mtn,08031234567,1000,
data,airtel,08099887766,1500,3.5GB
electricity,ABUJA,45022530096,10000,
cable,dstv,7012345678,,Compact
`;

function newRow(partial?: Partial<BulkRow>): BulkRow {
  return {
    id: `row-${Math.random().toString(36).slice(2, 9)}`,
    service: 'airtime',
    provider: 'mtn',
    account: '',
    amount: '',
    plan: '',
    status: 'pending',
    message: '',
    ...partial,
  };
}

function defaultProvider(service: PaymentService): string {
  if (service === 'electricity') return 'ABUJA';
  if (service === 'cable') return 'dstv';
  return 'mtn';
}

function defaultPlan(service: PaymentService, provider: string): string {
  if (service === 'data') return getDataPlansForNetwork(provider)[0]?.id ?? '';
  if (service === 'cable') return getCablePackages(provider)[0]?.id ?? '';
  return '';
}

function providerOptions(service: PaymentService) {
  if (service === 'electricity') {
    return ELECTRICITY_DISCOS.map((item) => ({ value: item.id, label: item.name }));
  }
  if (service === 'cable') {
    return CABLE_PROVIDERS.map((item) => ({ value: item.id, label: item.name }));
  }
  return AIRTIME_NETWORKS.map((item) => ({ value: item.id, label: item.name }));
}

function planOptions(row: BulkRow) {
  if (row.service === 'data') {
    return getDataPlansForNetwork(row.provider).map((plan) => ({
      value: plan.id,
      label: `${plan.name} · ${plan.validity} · ${formatPrice(plan.amount)}`,
    }));
  }
  if (row.service === 'cable') {
    return getCablePackages(row.provider).map((item) => ({
      value: item.id,
      label: `${item.name} · ${formatPrice(item.amount)}`,
    }));
  }
  return [];
}

function rowAmount(row: BulkRow): number {
  if (row.service === 'data') {
    return findDataPlan(row.plan, row.provider)?.amount ?? 0;
  }
  if (row.service === 'cable') {
    return findCablePackage(row.plan, row.provider)?.amount ?? 0;
  }
  return Number(row.amount.replace(/,/g, '').trim()) || 0;
}

function validateRow(row: BulkRow): string | null {
  if (row.service === 'airtime' || row.service === 'data') {
    if (!isValidNigerianPhone(row.account)) return 'Invalid phone number';
  } else if (row.account.replace(/\D/g, '').length < 10) {
    return row.service === 'electricity' ? 'Invalid meter number' : 'Invalid smartcard';
  }

  if (row.service === 'data' && !findDataPlan(row.plan, row.provider)) return 'Select a data plan';
  if (row.service === 'cable' && !findCablePackage(row.plan, row.provider)) return 'Select a package';

  const amount = rowAmount(row);
  if (row.service === 'airtime' && (amount < AIRTIME_MIN || amount > AIRTIME_MAX)) {
    return `Airtime must be ${formatPrice(AIRTIME_MIN)}–${formatPrice(AIRTIME_MAX)}`;
  }
  if (row.service === 'electricity' && (amount < ELECTRICITY_MIN || amount > ELECTRICITY_MAX)) {
    return `Electricity must be ${formatPrice(ELECTRICITY_MIN)}–${formatPrice(ELECTRICITY_MAX)}`;
  }
  if (amount <= 0) return 'Enter an amount';
  return null;
}

function parseCsv(text: string): BulkRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const start = lines[0].toLowerCase().startsWith('service,') ? 1 : 0;
  return lines.slice(start).map((line) => {
    const [serviceRaw = 'airtime', provider = '', account = '', amount = '', plan = ''] = line
      .split(',')
      .map((part) => part.trim());
    const service = (['airtime', 'data', 'electricity', 'cable'].includes(serviceRaw)
      ? serviceRaw
      : 'airtime') as PaymentService;
    const normalizedProvider =
      service === 'electricity'
        ? resolveDiscoCode(provider)
        : provider.toLowerCase() || defaultProvider(service);
    const dataPlan = findDataPlan(plan, normalizedProvider);
    const cablePlan = findCablePackage(plan, normalizedProvider);

    return newRow({
      service,
      provider: normalizedProvider || defaultProvider(service),
      account,
      amount,
      plan:
        service === 'data'
          ? dataPlan?.id ?? defaultPlan('data', normalizedProvider)
          : service === 'cable'
            ? cablePlan?.id ?? defaultPlan('cable', normalizedProvider)
            : '',
    });
  });
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'belpower-bulk-payments.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkPaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const groupId = params.get('groupId');
  const groupService = params.get('service') === 'data' ? 'data' : 'airtime';
  const seededGroup = groupId
    ? getBeneficiaryGroupById(session.role, groupId)
    : undefined;

  const [view, setView] = useState<View>('form');
  const [rows, setRows] = useState<BulkRow[]>(() => {
    if (seededGroup) {
      return seededGroup.members.map((member) =>
        newRow({
          service: groupService,
          provider: member.provider,
          account: member.accountNumber,
          amount: groupService === 'airtime' ? '1000' : '',
          plan: groupService === 'data' ? '1GB' : '',
        }),
      );
    }
    return [
      newRow({ service: 'airtime', provider: 'mtn', account: '08031234567', amount: '1000' }),
      newRow({ service: 'electricity', provider: 'ABUJA', account: '45022530096', amount: '5000' }),
    ];
  });
  const [csv, setCsv] = useState('');
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState('');
  const [activeGroupName, setActiveGroupName] = useState(seededGroup?.name ?? '');

  useEffect(() => {
    if (!groupId) return;
    const group = getBeneficiaryGroupById(session.role, groupId);
    if (!group) {
      toast.error('That beneficiary group was not found');
      return;
    }
    const payService = groupService;
    setActiveGroupName(group.name);
    setRows(
      group.members.map((member) =>
        newRow({
          service: payService,
          provider: member.provider,
          account: member.accountNumber,
          amount: payService === 'airtime' ? '1000' : '',
          plan:
            payService === 'data'
              ? getDataPlansForNetwork(member.provider)[0]?.name ?? ''
              : '',
        }),
      ),
    );
    setView('form');
  }, [groupId, groupService, session.role]);

  const total = useMemo(() => rows.reduce((sum, row) => sum + rowAmount(row), 0), [rows]);
  const rowErrors = rows.map(validateRow);
  const invalidCount = rowErrors.filter(Boolean).length;
  const blockReason = getPaymentBlockReason({
    amount: total,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });

  const paidCount = rows.filter((row) => row.status === 'paid').length;
  const failedCount = rows.filter((row) => row.status === 'failed').length;

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch, status: 'pending', message: '' } : row)));
  }

  async function handlePay() {
    if (rows.length === 0) {
      toast.error('Add at least one payment line');
      return;
    }
    if (invalidCount > 0) {
      toast.error('Fix the highlighted lines before paying');
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      await mockCompletePayment();
      const next = rows.map((row) => {
        const declined = row.account.replace(/\D/g, '').endsWith('0000');
        return declined
          ? { ...row, status: 'failed' as const, message: 'Provider declined this account' }
          : { ...row, status: 'paid' as const, message: '' };
      });
      setRows(next);
      const paid = next.filter((row) => row.status === 'paid').length;
      if (paid === 0) {
        setView('failed');
        toast.error('Bulk payment failed');
      } else {
        setReference(createPaymentReference('BLK'));
        setView('success');
        toast.success(`${paid} of ${next.length} lines paid (demo)`);
      }
    } catch {
      setView('failed');
      toast.error('Bulk payment could not be completed');
    } finally {
      setPending(false);
    }
  }

  const reset = () => {
    setView('form');
    setReference('');
    setRows((current) => current.map((row) => ({ ...row, status: 'pending', message: '' })));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Bulk payments"
        description={
          activeGroupName
            ? `Paying group “${activeGroupName}” — edit amounts/plans, then debit the wallet once.`
            : 'Pay several airtime, data, electricity, and cable bills in one wallet debit.'
        }
      />

      {view === 'success' ? (
        <div className="space-y-4">
          <PaymentSuccessView
            title={failedCount ? 'Bulk payment completed with issues' : 'Bulk payment completed'}
            description={`${paidCount} of ${rows.length} lines were paid. Total ${formatPrice(rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + rowAmount(row), 0))} (demo).`}
            reference={reference}
            rows={[
              { label: 'Lines paid', value: String(paidCount) },
              { label: 'Failed', value: String(failedCount) },
              { label: 'Branch', value: paymentBranchLabel(session.selectedBranch) },
            ]}
            onAgain={reset}
            againLabel="Run another batch"
          />
          <ResultsTable rows={rows} />
        </div>
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="None of the lines could be paid. Check the accounts and try again."
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
            amount={total}
            frozen={session.frozen}
            todaySpend={session.todaySpend}
            dailyLimit={session.dailyLimit}
          />

          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment lines</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={downloadSample} className={secondaryButtonClass}>
                  Download sample CSV
                </button>
                <button
                  type="button"
                  onClick={() => setRows((current) => [...current, newRow()])}
                  className={secondaryButtonClass}
                >
                  <Plus className="h-4 w-4" />
                  Add line
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row, index) => (
                <BulkLine
                  key={row.id}
                  row={row}
                  error={rowErrors[index]}
                  onChange={(patch) => updateRow(row.id, patch)}
                  onRemove={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                />
              ))}
            </div>

            <div>
              <label htmlFor="bulk-csv" className="block text-sm font-medium text-gray-700">
                Or paste CSV
              </label>
              <textarea
                id="bulk-csv"
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
                rows={4}
                placeholder="service,provider,account,amount,plan"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = parseCsv(csv);
                  if (parsed.length === 0) {
                    toast.error('Paste at least one CSV line');
                    return;
                  }
                  setRows(parsed);
                  setCsv('');
                  toast.success(`${parsed.length} lines loaded`);
                }}
                className={`${secondaryButtonClass} mt-2`}
              >
                Load CSV
              </button>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                {rows.length} lines · Total <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
                {invalidCount ? ` · ${invalidCount} need attention` : ''}
              </p>
              <button
                type="button"
                onClick={handlePay}
                disabled={pending || rows.length === 0 || invalidCount > 0 || Boolean(blockReason)}
                className={primaryButtonClass}
              >
                {pending ? 'Paying…' : `Pay ${formatPrice(total)}`}
              </button>
            </div>
          </section>
          {demoNote()}
        </>
      )}
    </div>
  );
}

function BulkLine({
  row,
  error,
  onChange,
  onRemove,
}: {
  row: BulkRow;
  error: string | null;
  onChange: (patch: Partial<BulkRow>) => void;
  onRemove: () => void;
}) {
  const plans = planOptions(row);
  const showPlan = row.service === 'data' || row.service === 'cable';

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-2">
          <BusinessSelect
            value={row.service}
            onChange={(service) => {
              const next = service as PaymentService;
              onChange({
                service: next,
                provider: defaultProvider(next),
                amount: '',
                plan: defaultPlan(next, defaultProvider(next)),
              });
            }}
            aria-label="Service"
            options={[
              { value: 'airtime', label: 'Airtime' },
              { value: 'data', label: 'Data' },
              { value: 'electricity', label: 'Electricity' },
              { value: 'cable', label: 'Cable TV' },
            ]}
          />
        </div>
        <div className="lg:col-span-3">
          <BusinessSelect
            value={row.provider}
            onChange={(provider) => onChange({ provider, plan: defaultPlan(row.service, provider) })}
            aria-label="Provider"
            options={providerOptions(row.service)}
          />
        </div>
        <div className={showPlan ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <input
            value={row.account}
            onChange={(event) => onChange({ account: event.target.value })}
            placeholder={row.service === 'electricity' ? 'Meter number' : row.service === 'cable' ? 'Smartcard' : 'Phone number'}
            className={fieldClass.replace('mt-1.5 ', '')}
          />
        </div>
        {showPlan ? (
          <div className="lg:col-span-3">
            <BusinessSelect
              value={row.plan}
              onChange={(plan) => onChange({ plan })}
              placeholder="Select plan"
              options={plans}
            />
          </div>
        ) : (
          <div className="lg:col-span-2">
            <input
              inputMode="numeric"
              value={row.amount}
              onChange={(event) => onChange({ amount: event.target.value })}
              placeholder="Amount"
              className={fieldClass.replace('mt-1.5 ', '')}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 lg:col-span-1">
          <p className="text-sm font-medium text-gray-900 lg:hidden">{formatPrice(rowAmount(row))}</p>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
            aria-label="Remove line"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <p className={`flex min-w-0 items-center gap-2 ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {!error ? (
            <BusinessProviderAvatar
              service={row.service}
              provider={row.provider}
              size="sm"
              alt={getProviderName(row.service, row.provider)}
            />
          ) : null}
          <span className="min-w-0 truncate">
            {error ?? `${getProviderName(row.service, row.provider)} · ${formatPrice(rowAmount(row))}`}
          </span>
        </p>
      </div>
    </div>
  );
}

function ResultsTable({ rows }: { rows: BulkRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-gray-900">
                  <div className="flex items-center gap-2">
                    <BusinessProviderAvatar
                      service={row.service}
                      provider={row.provider}
                      size="sm"
                      alt={getProviderName(row.service, row.provider)}
                    />
                    <div className="min-w-0">
                      <span className="capitalize">{row.service}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {getProviderName(row.service, row.provider)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-gray-800">
                  {row.service === 'airtime' || row.service === 'data' ? normalizePhone(row.account) : row.account}
                </td>
                <td className="px-4 py-3 text-gray-900">{formatPrice(rowAmount(row))}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status === 'paid' ? 'completed' : 'failed'} label={row.status === 'paid' ? 'Paid' : 'Failed'} />
                  {row.message ? <p className="mt-1 text-xs text-red-600">{row.message}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
