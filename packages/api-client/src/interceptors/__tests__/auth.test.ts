import axios, { InternalAxiosRequestConfig } from 'axios';
import { applyAuthInterceptor } from '../auth';
import { ClientConfig } from '../../types';

function makeConfig(getToken: ClientConfig['getToken']): ClientConfig {
  return { getToken };
}

describe('applyAuthInterceptor', () => {
  it('attaches Authorization header when getToken returns a non-null string', async () => {
    const instance = axios.create();
    applyAuthInterceptor(instance, makeConfig(() => 'my-token'));

    // Simulate what the interceptor does on a request
    const reqConfig: InternalAxiosRequestConfig = { headers: axios.defaults.headers.common as any } as any;
    // Get the request interceptor handler
    const handlers = (instance.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const result = await fulfilled(reqConfig);

    expect(result.headers['Authorization']).toBe('Bearer my-token');
  });

  it('does NOT attach Authorization header when getToken returns null', async () => {
    const instance = axios.create();
    applyAuthInterceptor(instance, makeConfig(() => null));

    const reqConfig: InternalAxiosRequestConfig = { headers: {} as any } as any;
    const handlers = (instance.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const result = await fulfilled(reqConfig);

    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('resolves an async getToken before attaching header', async () => {
    const instance = axios.create();
    applyAuthInterceptor(instance, makeConfig(async () => 'async-token'));

    const reqConfig: InternalAxiosRequestConfig = { headers: {} as any } as any;
    const handlers = (instance.interceptors.request as any).handlers;
    const fulfilled = handlers[0].fulfilled;
    const result = await fulfilled(reqConfig);

    expect(result.headers['Authorization']).toBe('Bearer async-token');
  });
});
