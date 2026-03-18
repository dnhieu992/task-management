import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ClientConfig } from '../types';

export function applyAuthInterceptor(
  instance: AxiosInstance,
  config: ClientConfig,
): void {
  instance.interceptors.request.use(
    async (reqConfig: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      if (!config.getToken) return reqConfig;

      const token = await config.getToken();
      if (token) {
        reqConfig.headers['Authorization'] = `Bearer ${token}`;
      }
      return reqConfig;
    },
  );
}
