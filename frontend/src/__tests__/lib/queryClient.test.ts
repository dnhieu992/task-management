// frontend/src/__tests__/lib/queryClient.test.ts
import { makeQueryClient } from '@/shared/lib/queryClient';
import { QueryClient } from '@tanstack/react-query';

describe('makeQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = makeQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('returns a new instance on each call', () => {
    const a = makeQueryClient();
    const b = makeQueryClient();
    expect(a).not.toBe(b);
  });

  it('has retry set to 1', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(1);
  });
});
