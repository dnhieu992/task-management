import axios from 'axios';
import { createApiClient } from '../client';
import { ApiError } from '../types';

describe('createApiClient', () => {
  it('returns an axios instance', () => {
    const client = createApiClient({});
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
  });

  it('uses provided baseURL', () => {
    const client = createApiClient({ baseURL: 'http://example.com/api' });
    expect((client.defaults as any).baseURL).toBe('http://example.com/api');
  });

  it('defaults baseURL to http://localhost:3001/api when not provided', () => {
    const client = createApiClient({});
    expect((client.defaults as any).baseURL).toBe('http://localhost:3001/api');
  });
});

describe('ApiError', () => {
  it('passes instanceof ApiError check', () => {
    const err = new ApiError(404, 'Not found');
    expect(err).toBeInstanceOf(ApiError);
  });

  it('passes instanceof Error check', () => {
    const err = new ApiError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
  });
});
