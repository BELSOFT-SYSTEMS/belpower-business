'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { BusinessApiError } from '@/lib/businessApi';
import {
  businessSchedulesApi,
  type CreateSchedulePayload,
} from '@/lib/businessSchedulesApi';
import type { BusinessSchedule } from '@/types/business';
import { formatPrice } from '@/utils/formatPrice';

const SERVICE_OPTIONS = [
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'cable', label: 'Cable TV' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function SchedulesPage() {
  const { canAccess } = useBusinessAuth();
  const canManage = canAccess('schedules.manage');

  const [schedules, setSchedules] = useState<BusinessSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceType, setServiceType] = useState<CreateSchedulePayload['serviceType']>('airtime');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await businessSchedulesApi.list();
      setSchedules(rows);
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const provider = String(form.get('provider') ?? '').trim();
    const recipient = String(form.get('recipient') ?? '').trim();
    const amount = Number(form.get('amount'));
    if (!provider || !recipient || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Provider, recipient, and amount are required');
      return;
    }
    setSubmitting(true);
    try {
      await businessSchedulesApi.create({
        serviceType,
        serviceProvider: provider,
        recipient,
        amount,
        frequency,
      });
      setCreateOpen(false);
      toast.success('Schedule created');
      await load();
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not create schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      await businessSchedulesApi.update(id, action);
      toast.success(
        action === 'pause' ? 'Schedule paused' : action === 'resume' ? 'Schedule resumed' : 'Schedule cancelled',
      );
      await load();
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not update schedule');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Schedules"
          description="Recurring utility payments. Auto-run will be enabled in a follow-up; schedules are stored with next run times."
        />
        {canManage ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Plus className="h-4 w-4" />
            New schedule
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading schedules…</p>
      ) : schedules.length === 0 ? (
        <EmptyState
          title="No schedules yet"
          description="Create a recurring airtime, data, electricity, or cable payment."
          action={
            canManage ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
              >
                New schedule
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Next run</th>
                  <th className="px-4 py-3">Status</th>
                  {canManage ? <th className="px-4 py-3 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-gray-900">
                      {row.serviceType} · {row.serviceProvider}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{row.recipient}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {formatPrice(row.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-gray-600">
                      {row.frequency}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.nextRunAt ? format(new Date(row.nextRunAt), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    {canManage ? (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          {row.status === 'active' ? (
                            <button
                              type="button"
                              onClick={() => void handleAction(row.id, 'pause')}
                              className="text-sm font-medium text-gray-700 hover:underline"
                            >
                              Pause
                            </button>
                          ) : null}
                          {row.status === 'paused' ? (
                            <button
                              type="button"
                              onClick={() => void handleAction(row.id, 'resume')}
                              className="text-sm font-medium text-blue-normal hover:underline"
                            >
                              Resume
                            </button>
                          ) : null}
                          {row.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => void handleAction(row.id, 'cancel')}
                              className="text-sm font-medium text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BusinessFormModal
        open={createOpen && canManage}
        title="Create schedule"
        description="Set up a recurring utility payment. The first run is scheduled based on frequency."
        submitLabel={submitting ? 'Saving…' : 'Create schedule'}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <BusinessSelect
          name="serviceType"
          value={serviceType}
          onChange={(value) => setServiceType(value as CreateSchedulePayload['serviceType'])}
          options={SERVICE_OPTIONS}
        />
        <input
          required
          name="provider"
          placeholder="Provider (e.g. MTN, AEDC, DSTV)"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <input
          required
          name="recipient"
          placeholder="Phone, meter, or smartcard number"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <input
          required
          name="amount"
          type="number"
          min={1}
          step="0.01"
          placeholder="Amount"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <BusinessSelect
          name="frequency"
          value={frequency}
          onChange={(value) => setFrequency(value as 'daily' | 'weekly' | 'monthly')}
          options={FREQUENCY_OPTIONS}
        />
      </BusinessFormModal>
    </div>
  );
}
