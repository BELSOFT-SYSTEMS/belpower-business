'use client';

import Image from 'next/image';
import Link from 'next/link';
import { RegisterWizard } from '@/components/business/register/RegisterWizard';

export default function BusinessRegisterPage() {
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
            <li>• Verify your head office meter</li>
            <li>• You become Super Admin at Head Office</li>
            <li>• Add branches and invite your team</li>
          </ul>
        </div>
        <p className="relative z-10 text-xs text-blue-light/80">
          &copy; {new Date().getFullYear()} BelPower. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-lg">
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
            <h2 className="text-2xl font-semibold text-gray-900">Register your business</h2>
            <p className="mt-2 text-sm text-gray-600">
              Complete each step on this page to set up your business account.
            </p>
          </div>

          <RegisterWizard />

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
