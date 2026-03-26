'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi, LoginPayload, RegisterPayload } from './api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.me,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginPayload) => authApi.login(data),
    onSuccess: (user) => {
      qc.setQueryData(['currentUser'], user);
      router.push('/projects');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: RegisterPayload) => authApi.register(data),
    onSuccess: () => router.push('/login'),
  });
}
