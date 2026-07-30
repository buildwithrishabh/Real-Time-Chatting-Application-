import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { connectSocket, disconnectSocket } from '../socket/client';
import type { LoginFormData, RegisterFormData } from '../lib/validators';

export function useAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const deviceId = useAuthStore((s) => s.deviceId);
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginFormData) =>
      authApi.login({ email: credentials.email, password: credentials.password, deviceId }),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user, data.isProfileComplete);
      connectSocket();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authApi.register({
        username: data.username,
        email: data.email,
        password: data.password,
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuth();
      disconnectSocket();
      queryClient.clear();
    },
    onError: () => {
      clearAuth();
      disconnectSocket();
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}
