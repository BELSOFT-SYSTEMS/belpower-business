'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { PasswordInput } from '@/components/business/PasswordInput';

export default function BusinessSignInPage() {
  const router = useRouter();
  const { signInMock, isAuthenticated, isLoading } = useBusinessAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/business');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    signInMock('super_admin');

    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '/business';
    router.push(from); 
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-normal" aria-hidden />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="auth-hero-panel relative hidden min-h-screen w-1/2 overflow-hidden bg-linear-to-br from-blue-normal via-blue-dark to-blue-darker p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-hero-blob1" aria-hidden />
        <div className="auth-hero-blob2" aria-hidden />
        <div className="relative z-10">
          <Image src="/transparent_belpower.png" alt="BelPower" width={160} height={48} />
          <h1 className="mt-10 text-3xl font-semibold">BelPower Business</h1>
          <p className="mt-4 max-w-md text-blue-light">
            Fund your company wallet and pay electricity, airtime, data, and cable bills across all
            branches — from one platform.
          </p>
        </div>
        <p className="relative z-10 text-xs text-blue-light/80">
          &copy; {new Date().getFullYear()} BelPower. All rights reserved. · Powered by{' '}
          <a
            href="https://belsoftsystems.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline-offset-2 hover:underline"
          >
            Belsoft Systems Ltd
          </a>
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="-mt-2.5 mb-6 flex justify-center">
              <Image
                src="/belpower_full.png"
                alt="BelPower"
                width={160}
                height={48}
                priority
                className="h-10 w-auto"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your business dashboard to manage utility payments.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                Work email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
              />
            </div>

            <div>
              <PasswordInput
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <div className="mt-2 text-right">
                <Link
                  href="/business/forgot-password"
                  className="text-xs font-medium text-blue-normal hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-normal px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-normal-hover disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-xs text-gray-500">
              Mock sign-in — any email and password signs in as Super Admin until the API is connected.
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New business?{' '}
            <Link href="/business/register" className="font-medium text-blue-normal hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
