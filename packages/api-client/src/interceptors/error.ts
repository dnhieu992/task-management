import { AxiosInstance } from 'axios';
import { ApiError } from '../types';

export function applyErrorInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        error.response !== undefined &&
        error.response !== null
      ) {
        const res = error.response as { status: number; data: unknown };
        const data = res.data as Record<string, unknown> | undefined;
        const message =
          typeof data?.message === 'string'
            ? data.message
            : (error as { message?: string }).message ?? 'Unknown error';
        return Promise.reject(new ApiError(res.status, message, res.data));
      }

      // Network error (no response)
      const message =
        error !== null &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Network error';
      return Promise.reject(new ApiError(0, message));
    },
  );
}
