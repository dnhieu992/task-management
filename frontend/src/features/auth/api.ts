import { api } from '@/shared/lib/api.client';
import type { User } from '@/shared/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  login: (data: LoginPayload) => api.post<User>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterPayload) => api.post<User>('/auth/register', data).then((r) => r.data),
  me: () => api.get<User>('/users/me').then((r) => r.data),
};
