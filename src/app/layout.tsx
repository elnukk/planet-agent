import type { Metadata } from 'next';
import { Encode_Sans_Expanded } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const font = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Project Centinela',
  description: 'Satellite intelligence for your workflows',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={font.className}>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
