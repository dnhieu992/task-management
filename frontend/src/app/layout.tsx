// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Providers } from '@/shared/lib/Providers';
import '@/styles/globals.scss';

export const metadata: Metadata = {
  title: 'Task Management',
  description: 'Task Management Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
