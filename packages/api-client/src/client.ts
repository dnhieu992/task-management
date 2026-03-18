import axios, { AxiosInstance } from 'axios';
import { ClientConfig } from './types';
import { applyAuthInterceptor } from './interceptors/auth';
import { applyErrorInterceptor } from './interceptors/error';

export function createApiClient(config: ClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL ?? 'http://localhost:3001/api',
    timeout: config.timeout ?? 10000,
  });

  applyAuthInterceptor(instance, config);
  applyErrorInterceptor(instance);

  return instance;
}
