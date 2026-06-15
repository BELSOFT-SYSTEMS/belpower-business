'use client';

import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockDashboardForRole } from '@/data/businessMocks';

export default function BusinessSettingsPage() {
  const { user, demoRole, business } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const mockBusiness = business ?? getMockDashboardForRole(role).business;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    toast.success('Business settings saved (demo)');
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Business settings"
        description="Update your company profile and preferences."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Company profile</h2>
          <div className="mb-6 flex items-center gap-4">
            <Image
              src={mockBusiness.logoUrl ?? '/belsoft-logo-2.jpg'}
              alt="Business logo"
              width={64}
              height={64}
              className="rounded-xl border border-gray-200 object-contain p-1"
            />
            <button
              type="button"
              onClick={() => toast.message('Logo upload — API coming soon')}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change logo
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Business ID</label>
              <input
                readOnly
                value={mockBusiness.businessId}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Business name</label>
              <input
                name="businessName"
                defaultValue={mockBusiness.businessName}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact email</label>
              <input
                name="email"
                type="email"
                defaultValue={mockBusiness.email}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                defaultValue={mockBusiness.phone}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                rows={2}
                defaultValue={mockBusiness.address}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="space-y-3">
            {[
              'Email me when wallet is funded',
              'Email me on failed transactions',
              'Notify team on large payments (> ₦100,000)',
            ].map((label) => (
              <label key={label} className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                {label}
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-normal px-6 py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
