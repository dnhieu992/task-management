import axios from 'axios';
import { applyErrorInterceptor } from '../error';
import { ApiError } from '../../types';

describe('applyErrorInterceptor', () => {
  it('normalizes a 4xx/5xx response into ApiError with correct status and message', async () => {
    const instance = axios.create();
    applyErrorInterceptor(instance);

    const handlers = (instance.interceptors.response as any).handlers;
    const rejected = handlers[0].rejected;

    const axiosError = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
      message: 'Request failed with status code 404',
    };

    await expect(rejected(axiosError)).rejects.toBeInstanceOf(ApiError);

    try {
      await rejected(axiosError);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).message).toBe('Not found');
      expect((err as ApiError).data).toEqual({ message: 'Not found' });
    }
  });

  it('normalizes a network error (no response) into ApiError with status 0', async () => {
    const instance = axios.create();
    applyErrorInterceptor(instance);

    const handlers = (instance.interceptors.response as any).handlers;
    const rejected = handlers[0].rejected;

    const networkError = {
      response: undefined,
      message: 'Network Error',
    };

    try {
      await rejected(networkError);
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(0);
      expect((err as ApiError).message).toBe('Network Error');
    }
  });
});
