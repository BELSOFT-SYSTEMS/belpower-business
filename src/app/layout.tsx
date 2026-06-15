import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { Toaster } from 'sonner';
import BelaChatWidget from '@/components/bela/BelaChatWidget';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BelPower Business',
    template: '%s · BelPower Business',
  },
  description:
    'BelPower Business — centralized utility payments for Nigerian companies. Fund wallet, pay bills, manage branches.',
  applicationName: 'BelPower Business',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} h-full antialiased`}>
      <body className={`${sora.className} min-h-full bg-white text-gray-900`}>
        {children}
        <BelaChatWidget />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
