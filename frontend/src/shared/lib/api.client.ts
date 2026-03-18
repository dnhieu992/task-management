// frontend/src/shared/lib/api.client.ts
// 'use client' — never import this file in a Server Component. Use api.server.ts instead.
'use client';

import { createApiClient } from '@task-management/api-client';

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('auth-token='));
  return match ? match.substring(match.indexOf('=') + 1) : null;
}

export const api = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  getToken: getTokenFromCookie,
});
