// frontend/src/shared/lib/Providers.tsx
'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from './queryClient';
import ThemeProvider from '@/components/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
