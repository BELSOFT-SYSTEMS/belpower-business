'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Download, RotateCw, Repeat2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessTransactionDetail } from '@/types/businessTransactionDetail';
import { getMockTransactionDetailById } from '@/data/mockTransactionDetails';
import { BusinessApiError, businessTransactionsApi, businessWalletApi } from '@/lib/businessApi';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getDiscoDisplayName } from '@/constants/discoNames';
import {
  getCableBillingFromTransaction,
  getElectricityAmountPaid,
  getElectricityAmountPurchased,
  getElectricityBillingFromTransaction,
  getElectricityTokenFromTransaction,
  getElectricityUnitsFromTransaction,
  getElectricityVat,
  getPaymentMethodKey,
  getPaymentMethodLabel,
  getTransactionAddress,
  getTransactionCustomerName,
  getTrustedTransactionTotal,
} from '@/lib/transaction-display';
import { getTransactionTitle, isBusinessWalletAllocateTx, isBusinessWalletFundingTx } from '@/utils/transactionTitle';
import { downloadBusinessReceipt } from '@/utils/downloadBusinessReceipt';
import { getBusinessBuyAgainLabel, getBusinessBuyAgainPath } from '@/utils/transactionActions';
import { formatPrice } from '@/utils/formatPrice';
import { formatBusinessBranchLabel } from '@/utils/businessBranchLabel';
import { StatusBadge } from '@/components/business/StatusBadge';
import { BusinessTransactionProviderIcon } from '@/components/business/BusinessTransactionProviderIcon';
import { cn } from '@/lib/utils';

type BusinessTransactionDetailModalProps = {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (update: {
    id: string;
    status?: 'completed' | 'pending' | 'failed';
    amount?: number;
    reference?: string;
    service?: string;
    provider?: string;
    branchName?: string;
    userName?: string;
    createdAt?: string;
    entryType?: 'credit' | 'debit';
  }) => void;
};

function DetailRow({
  label,
  value,
  strong = false,
  children,
}: {
  label: string;
  value?: string | number | null;
  strong?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 text-sm last:border-b-0">
      <span className={cn('shrink-0 text-gray-500', strong && 'font-semibold text-gray-900')}>
        {label}
      </span>
      <div
        className={cn(
          'min-w-0 text-right font-medium text-gray-900',
          strong && 'font-semibold',
        )}
      >
        {children ?? (value != null && value !== '' ? String(value) : 'N/A')}
      </div>
    </div>
  );
}

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatDisplayTime(value: string | null | undefined) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

function normalizeStatusBadge(status: string): 'completed' | 'pending' | 'failed' {
  const key = status.toLowerCase();
  if (key === 'completed' || key === 'success') return 'completed';
  if (key === 'failed') return 'failed';
  return 'pending';
}

function resolveProviderValue(
  provider?: string | null,
  metadata?: BusinessTransactionDetail['metadata'],
): string {
  const candidates = [
    provider,
    metadata?.provider,
    metadata?.disco,
    metadata?.network,
  ];
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    const normalized = value.toLowerCase();
    if (
      value &&
      value !== '—' &&
      value !== '-' &&
      normalized !== 'n/a' &&
      normalized !== 'null' &&
      normalized !== 'unknown'
    ) {
      return value;
    }
  }
  return '';
}

function getProviderLabel(transaction: BusinessTransactionDetail) {
  const service = transaction.service.toLowerCase();
  const provider = resolveProviderValue(transaction.provider, transaction.metadata);
  if (service === 'electricity') {
    return getDiscoDisplayName(provider || transaction.metadata?.disco || '');
  }
  if (!provider) return '—';

  const providerKey = provider.toLowerCase();
  const telcoMap: Record<string, string> = {
    mtn: 'MTN',
    airtel: 'Airtel',
    glo: 'GLO',
    '9mobile': '9Mobile',
    dstv: 'DStv',
    gotv: 'GOtv',
    startimes: 'StarTimes',
  };
  return telcoMap[providerKey] || provider.toUpperCase();
}

function mapApiTransactionToDetail(
  row: Awaited<ReturnType<typeof businessTransactionsApi.get>>,
): BusinessTransactionDetail {
  const metadata = (row.metadata || {}) as BusinessTransactionDetail['metadata'];
  const amount = Number(row.amount || 0);
  const status =
    row.status === 'completed' || row.status === 'pending' || row.status === 'failed'
      ? row.status
      : row.status === 'cancelled'
        ? 'failed'
        : 'pending';
  const provider = resolveProviderValue(row.provider, metadata);

  return {
    id: row.id,
    reference: row.reference,
    order_id: row.detail?.orderId || row.reference,
    receipt_number: row.reference,
    type: row.service,
    status,
    payment_method: row.paymentMethod || 'wallet',
    payment_type: row.service,
    amount_paid: amount,
    service_charge: 0,
    discount: 0,
    total_amount: amount,
    amount,
    created_at: row.createdAt || new Date().toISOString(),
    completed_at: row.completedAt || null,
    is_scheduled: false,
    scheduled_info: null,
    service: row.service || 'payment',
    provider: provider || '—',
    description: row.detail?.description || row.note || undefined,
    fullName: row.userName || '—',
    email: '',
    phoneNumber: '',
    branchName: formatBusinessBranchLabel(row.branchName),
    userName: row.userName || '—',
    entryType: row.entryType,
    metadata,
  };
}

function toListUpdate(detail: BusinessTransactionDetail) {
  const status = normalizeStatusBadge(detail.status);
  return {
    id: detail.id,
    status,
    amount: Number(detail.amount_paid || detail.amount || 0),
    reference: detail.reference,
    service: detail.service,
    provider: detail.provider,
    branchName: formatBusinessBranchLabel(detail.branchName),
    userName: detail.userName,
    createdAt: detail.created_at,
    entryType: detail.entryType,
  };
}

export function BusinessTransactionDetailModal({
  transactionId,
  open,
  onClose,
  onUpdated,
}: BusinessTransactionDetailModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useBusinessAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [isRequerying, setIsRequerying] = useState(false);
  const [transaction, setTransaction] = useState<BusinessTransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const onUpdatedRef = useRef(onUpdated);
  onUpdatedRef.current = onUpdated;

  useEffect(() => {
    if (!open || !transactionId) {
      setTransaction(null);
      return;
    }

    if (!isAuthenticated) {
      setTransaction(getMockTransactionDetailById(transactionId));
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    void (async () => {
      try {
        const row = await businessTransactionsApi.get(transactionId);
        if (!cancelled) {
          const detail = mapApiTransactionToDetail(row);
          setTransaction(detail);
          onUpdatedRef.current?.(toListUpdate(detail));
        }
      } catch (error) {
        if (!cancelled) {
          setTransaction(null);
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load transaction',
          );
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, open, transactionId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCopiedToken(false);
      setIsRequerying(false);
    }
  }, [open, transactionId]);

  const reloadDetail = useCallback(async () => {
    if (!transactionId || !isAuthenticated) return null;
    const row = await businessTransactionsApi.get(transactionId);
    const detail = mapApiTransactionToDetail(row);
    setTransaction(detail);
    onUpdatedRef.current?.(toListUpdate(detail));
    return detail;
  }, [isAuthenticated, transactionId]);

  const handleBuyAgain = useCallback(() => {
    if (!transaction) return;
    const href = getBusinessBuyAgainPath(transaction);
    onClose();
    router.push(href);
  }, [onClose, router, transaction]);

  const handleRequery = useCallback(async () => {
    if (!transaction || isRequerying) return;

    setIsRequerying(true);
    try {
      if (isBusinessWalletFundingTx(transaction)) {
        const method = getPaymentMethodKey(transaction);
        if (method === 'buypower-dva' || method === 'dva') {
          const status = await businessWalletApi.fundingStatus(transaction.id);
          if (status.status === 'completed') {
            toast.success('Payment confirmed. Wallet credited.');
          } else if (status.status === 'expired') {
            toast.error('Transfer invoice expired');
          } else if (status.status === 'failed') {
            toast.error('Payment failed');
          } else {
            toast.message('Payment still pending. Transfer the exact amount if you have not yet.');
          }
        } else {
          const result = await businessWalletApi.verifyFund(transaction.reference);
          if (result.status === 'completed') {
            toast.success(
              result.alreadyProcessed
                ? 'Payment already credited'
                : 'Payment verified. Wallet credited.',
            );
          } else {
            toast.message('Payment not completed on Paystack yet');
          }
        }
        await reloadDetail();
        return;
      }

      const result = await businessTransactionsApi.requery(transaction.id);
      toast.success(result.message || 'Requery completed');
      await reloadDetail();
    } catch (error) {
      toast.error(
        error instanceof BusinessApiError ? error.message : 'Could not verify transaction',
      );
    } finally {
      setIsRequerying(false);
    }
  }, [isRequerying, reloadDetail, transaction]);

  const handleDownloadReceipt = useCallback(async () => {
    if (!transaction || downloadingReceipt) return;

    setDownloadingReceipt(true);
    try {
      const ok = await downloadBusinessReceipt(transaction);
      if (ok) {
        toast.success('Receipt PDF downloaded');
      } else {
        toast.error('Could not generate receipt PDF');
      }
    } catch {
      toast.error('Could not generate receipt PDF');
    } finally {
      setDownloadingReceipt(false);
    }
  }, [downloadingReceipt, transaction]);

  const copyToken = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(true);
      toast.success('Token copied to clipboard');
      window.setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      toast.error('Could not copy token');
    }
  }, []);

  if (!open) return null;

  const service = transaction?.service.toLowerCase() ?? '';
  const isElectricity = service === 'electricity';
  const isCable = service === 'cable';
  const isAirtime = service === 'airtime';
  const isData = service === 'data';
  const isWalletFunding = transaction ? isBusinessWalletFundingTx(transaction) : false;
  const isAllocate = transaction ? isBusinessWalletAllocateTx(transaction) : false;
  const isWalletCredit = isWalletFunding || isAllocate;

  const paymentMethodKey = transaction ? getPaymentMethodKey(transaction) : '';
  const paymentMethodLabel = getPaymentMethodLabel(paymentMethodKey);
  const electricityBilling = transaction && isElectricity ? getElectricityBillingFromTransaction(transaction) : null;
  const cableBilling = transaction && isCable ? getCableBillingFromTransaction(transaction) : null;
  const displayTotal =
    electricityBilling?.totalPaid ??
    cableBilling?.totalPaid ??
    (transaction ? getTrustedTransactionTotal(transaction) : 0);
  const electricityToken = transaction && isElectricity ? getElectricityTokenFromTransaction(transaction) : '';
  const electricityUnits = transaction && isElectricity ? getElectricityUnitsFromTransaction(transaction) : '';
  const transactionStatus = transaction ? normalizeStatusBadge(transaction.status) : null;
  const canRequeryFunding = Boolean(
    transaction &&
      transactionStatus === 'pending' &&
      (isWalletFunding || isElectricity || isCable || isAirtime || isData),
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close transaction details"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
        className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl sm:max-w-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-normal">
              Transaction details
            </p>
            <h2 id="transaction-detail-title" className="mt-1 truncate text-lg font-semibold text-gray-900">
              {transaction ? getTransactionTitle(transaction) : 'Transaction'}
            </h2>
            {transaction ? (
              <p className="mt-0.5 truncate text-xs text-gray-500">{transaction.reference}</p>
            ) : loadingDetail ? (
              <p className="mt-0.5 text-xs text-gray-500">Loading…</p>
            ) : (
              <p className="mt-0.5 text-xs text-gray-500">Transaction not found</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {transaction && transactionStatus === 'completed' && !isAllocate ? (
              <button
                type="button"
                onClick={handleBuyAgain}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-normal px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-normal-hover"
              >
                <Repeat2 className="h-3.5 w-3.5" />
                {getBusinessBuyAgainLabel(transaction)}
              </button>
            ) : null}
            {transaction && canRequeryFunding ? (
              <button
                type="button"
                onClick={handleRequery}
                disabled={isRequerying}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-normal px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCw className={cn('h-3.5 w-3.5', isRequerying && 'animate-spin')} />
                {isRequerying
                  ? 'Verifying…'
                  : isWalletFunding
                    ? 'Verify payment'
                    : 'Requery'}
              </button>
            ) : null}
            {transaction ? (
              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingReceipt ? 'Generating…' : 'Receipt PDF'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!transaction ? (
            <p className="py-10 text-center text-sm text-gray-500">Transaction not found.</p>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-2">
                    <BusinessTransactionProviderIcon
                      transaction={{
                        type: transaction.service,
                        service: transaction.service,
                        provider: resolveProviderValue(
                          transaction.provider,
                          transaction.metadata,
                        ),
                      }}
                      alt={transaction.service}
                      size={40}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {getTransactionTitle(transaction)}
                      {isElectricity ? ' — Prepaid' : ''}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {isWalletCredit
                        ? paymentMethodLabel
                        : getProviderLabel(transaction)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={normalizeStatusBadge(transaction.status)} />
                      <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-medium text-blue-normal">
                        {transaction.branchName}
                      </span>
                    </div>
                  </div>
                </div>

                {isElectricity ? (
                  <div className="mt-4 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="text-gray-500">Meter:</span>{' '}
                      {transaction.meter_number || transaction.metadata?.meter || 'N/A'}
                    </p>
                    <p>
                      <span className="text-gray-500">Disco:</span> {getProviderLabel(transaction)}
                    </p>
                  </div>
                ) : null}

                {isCable ? (
                  <div className="mt-4 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="text-gray-500">Smartcard:</span>{' '}
                      {transaction.smartcard_number ||
                        transaction.metadata?.cable_data?.smartCardNumber ||
                        'N/A'}
                    </p>
                  </div>
                ) : null}

                {(isAirtime || isData) && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>
                      <span className="text-gray-500">Phone:</span>{' '}
                      {transaction.phone_number || transaction.metadata?.phone || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {isElectricity && electricityToken ? (
                <div className="rounded-xl border border-blue-200 bg-blue-light/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-normal">
                    Token
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="break-all font-mono text-sm font-semibold text-gray-900">
                      {electricityToken}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToken(electricityToken)}
                      className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50"
                      title={copiedToken ? 'Copied' : 'Copy token'}
                      aria-label="Copy token"
                    >
                      <Copy className={cn('h-4 w-4', copiedToken && 'text-green-600')} />
                    </button>
                  </div>
                </div>
              ) : null}

              {isElectricity && transaction.status === 'pending' && !electricityToken ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Token is being generated. Please check back shortly.
                </div>
              ) : null}

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-1">
                <h3 className="border-b border-gray-100 py-3 text-sm font-semibold text-gray-900">
                  Amount breakdown
                </h3>

                {isElectricity ? (
                  <>
                    <DetailRow label="Payer" value={transaction.userName} />
                    <DetailRow
                      label="Customer name"
                      value={getTransactionCustomerName(transaction)}
                    />
                    <DetailRow label="Address" value={getTransactionAddress(transaction)} />
                    <DetailRow label="Payment method" value={paymentMethodLabel} />
                    <DetailRow label="Amount paid" value={formatPrice(getElectricityAmountPaid(transaction))} />
                    <DetailRow
                      label="Service charge"
                      value={formatPrice(electricityBilling?.serviceCharge ?? transaction.service_charge)}
                    />
                    <DetailRow
                      label="Amount purchased"
                      value={formatPrice(getElectricityAmountPurchased(transaction))}
                    />
                    <DetailRow label="VAT" value={formatPrice(getElectricityVat(transaction))} />
                    <DetailRow label="Total amount" value={formatPrice(displayTotal)} strong />
                    {electricityUnits ? (
                      <DetailRow label="Units" value={`${electricityUnits} kWh`} />
                    ) : null}
                  </>
                ) : null}

                {isCable ? (
                  <>
                    <DetailRow
                      label="Smartcard number"
                      value={
                        transaction.smartcard_number ||
                        transaction.metadata?.cable_data?.smartCardNumber
                      }
                    />
                    <DetailRow
                      label="Package"
                      value={
                        transaction.package_name ||
                        transaction.metadata?.cable_data?.packageName ||
                        transaction.metadata?.cable_data?.package
                      }
                    />
                    <DetailRow
                      label="Customer name"
                      value={getTransactionCustomerName(transaction) || transaction.customer_name}
                    />
                    <DetailRow label="Payment method" value={paymentMethodLabel} />
                    <DetailRow
                      label="Package amount"
                      value={formatPrice(cableBilling?.packageAmount ?? transaction.amount_paid)}
                    />
                    <DetailRow
                      label="Service charge"
                      value={formatPrice(cableBilling?.serviceCharge ?? transaction.service_charge)}
                    />
                    <DetailRow label="Total amount" value={formatPrice(displayTotal)} strong />
                  </>
                ) : null}

                {(isAirtime || isData) && (
                  <>
                    <DetailRow label="Network" value={getProviderLabel(transaction)} />
                    <DetailRow
                      label="Phone number"
                      value={transaction.phone_number || transaction.metadata?.phone}
                    />
                    {isData ? (
                      <DetailRow
                        label="Data plan"
                        value={transaction.data_plan || transaction.metadata?.dataBundle}
                      />
                    ) : null}
                    <DetailRow label="Payment method" value={paymentMethodLabel} />
                    <DetailRow label="Amount" value={formatPrice(transaction.amount_paid)} />
                    <DetailRow label="Service charge" value={formatPrice(transaction.service_charge)} />
                    <DetailRow label="Total amount" value={formatPrice(displayTotal)} strong />
                    {isData && transaction.status === 'completed' ? (
                      <p className="border-t border-gray-100 py-3 text-xs text-gray-500">
                        Data bundle will be delivered to the phone number shortly.
                      </p>
                    ) : null}
                    {isAirtime && transaction.status === 'completed' ? (
                      <p className="border-t border-gray-100 py-3 text-xs text-gray-500">
                        Airtime has been credited to the phone number.
                      </p>
                    ) : null}
                  </>
                )}

                {isWalletFunding ? (
                  <>
                    <DetailRow label="Type" value="Wallet funding" />
                    <DetailRow label="Payment method" value={paymentMethodLabel} />
                    <DetailRow
                      label="Description"
                      value={transaction.description || 'Company wallet top-up'}
                    />
                    <DetailRow label="Branch" value={transaction.branchName} />
                    <DetailRow
                      label="Amount credited"
                      value={formatPrice(transaction.amount_paid || transaction.amount || 0)}
                      strong
                    />
                  </>
                ) : null}

                {isAllocate ? (
                  <>
                    <DetailRow
                      label="Type"
                      value={
                        transaction.entryType === 'debit'
                          ? 'Allocation to branch'
                          : 'Allocation received'
                      }
                    />
                    <DetailRow label="Branch" value={transaction.branchName} />
                    <DetailRow
                      label="Description"
                      value={transaction.description || 'Wallet allocation'}
                    />
                    <DetailRow
                      label="Amount"
                      value={formatPrice(transaction.amount_paid || transaction.amount || 0)}
                      strong
                    />
                  </>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white px-4 py-1">
                <h3 className="border-b border-gray-100 py-3 text-sm font-semibold text-gray-900">
                  Reference &amp; dates
                </h3>
                <DetailRow label="Reference" value={transaction.reference} />
                <DetailRow label="Order ID" value={transaction.order_id} />
                <DetailRow label="Receipt number" value={transaction.receipt_number} />
                <DetailRow label="Branch" value={transaction.branchName} />
                <DetailRow label="Initiated by" value={transaction.userName} />
                <DetailRow label="Status" value={transaction.status} />
                <DetailRow
                  label="Created at"
                  value={`${formatDisplayDate(transaction.created_at)} ${formatDisplayTime(transaction.created_at)}`.trim()}
                />
                <DetailRow
                  label="Completed at"
                  value={
                    transaction.completed_at
                      ? `${formatDisplayDate(transaction.completed_at)} ${formatDisplayTime(transaction.completed_at)}`.trim()
                      : 'N/A'
                  }
                />
              </div>

              {transaction.status === 'failed' ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  This transaction could not be completed. Funds were not debited from the branch
                  wallet, or a reversal is in progress.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
