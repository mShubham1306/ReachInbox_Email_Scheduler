import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/api';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const devLoginMutation = useMutation({
    mutationFn: ({ email, name }: { email?: string; name?: string }) =>
      authApi.devLogin(email, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    logout: logoutMutation.mutate,
    devLogin: devLoginMutation.mutate,
    isDevLoginLoading: devLoginMutation.isPending,
  };
}
