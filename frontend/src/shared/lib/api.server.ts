// frontend/src/shared/lib/api.server.ts
import { createApiClient } from '@task-management/api-client';
import { cookies } from 'next/headers';

/**
 * Creates a new api-client instance per request using the auth token from cookies.
 * Call this at the top of every Server Component that needs to fetch data.
 * Never use a singleton for server-side requests — each request has its own token.
 */
export function createServerApiClient() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value ?? null;
  return createApiClient({
    baseURL: process.env.API_URL ?? 'http://localhost:3001/api',
    getToken: () => token,
  });
}
