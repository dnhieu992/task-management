// frontend/src/shared/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
      mutations: {
        onError: (error: unknown) => {
          if (
            typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            (error as { status: number }).status === 401
          ) {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        },
      },
    },
  });
}
