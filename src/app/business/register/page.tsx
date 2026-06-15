'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBusinessAuth } from '@/context/BusinessAuthContext';

export default function BusinessRegisterPage() {
  const router = useRouter();
  const { signInMock } = useBusinessAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    toast.success('Business registered (demo). You are now Super Admin at Head Office.');
    signInMock('super_admin');
    router.push('/business');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="auth-hero-panel relative hidden min-h-screen w-1/2 overflow-hidden bg-linear-to-br from-blue-normal via-blue-dark to-blue-darker p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-hero-blob1" aria-hidden />
        <div className="auth-hero-blob2" aria-hidden />
        <div className="relative z-10">
          <Image src="/transparent_belpower.png" alt="BelPower" width={160} height={48} />
          <h1 className="mt-10 text-3xl font-semibold">Start with BelPower Business</h1>
          <p className="mt-4 max-w-md text-blue-light">
            Register your company, fund one wallet, and pay utility bills across all branches — no
            bank transfers between accounts.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-blue-light">
            <li>• You become Super Admin at Head Office</li>
            <li>• Add branches and invite your team</li>
            <li>• Assign Finance Manager and Operations Officers</li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-blue-light/80">
          &copy; {new Date().getFullYear()} BelPower. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-lg">
          <div className="mb-8">
            <div className="-mt-2.5 mb-6 flex justify-center lg:justify-start">
              <Image src="/belpower_full.png" alt="BelPower" width={160} height={48} className="h-10 w-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Register your business</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your business account. The first user becomes Super Admin at Head Office.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-gray-900">Business details</legend>
              <input
                required
                name="businessName"
                placeholder="Business name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
              <input
                required
                name="email"
                type="email"
                placeholder="Business email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
              <input
                required
                name="phone"
                type="tel"
                placeholder="Business phone"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
              <textarea
                required
                name="address"
                rows={2}
                placeholder="Head office address"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-gray-900">Your account (Super Admin)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  required
                  name="firstName"
                  placeholder="First name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                />
                <input
                  required
                  name="lastName"
                  placeholder="Last name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                />
              </div>
              <input
                required
                name="workEmail"
                type="email"
                placeholder="Work email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
              <input
                required
                name="password"
                type="password"
                minLength={8}
                placeholder="Password (min. 8 characters)"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
            </fieldset>

            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input required type="checkbox" className="mt-1 rounded border-gray-300" />
              I agree to the BelPower Business Terms of Use and Privacy Policy.
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-normal py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Create business account'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Demo mode — form submits locally until the API is connected.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{' '}
            <Link href="/business/sign-in" className="font-medium text-blue-normal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
