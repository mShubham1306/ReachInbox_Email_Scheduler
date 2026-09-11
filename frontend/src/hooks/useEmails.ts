import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emailApi } from '../services/api';

export function useScheduledEmails(page = 1) {
  return useQuery({
    queryKey: ['emails', 'scheduled', page],
    queryFn: () => emailApi.getScheduled(page),
    refetchInterval: 10_000, // poll every 10s to show status changes
  });
}

export function useSentEmails(page = 1) {
  return useQuery({
    queryKey: ['emails', 'sent', page],
    queryFn: () => emailApi.getSent(page),
    refetchInterval: 15_000,
  });
}

export function useEmailSearch() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['emails', 'search', query, status],
    queryFn: () => emailApi.search(query, status || undefined),
    enabled: query.length > 0,
    staleTime: 5_000,
  });

  return { query, setQuery, status, setStatus, results: data ?? [], isLoading };
}

export function useScheduleEmails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: emailApi.schedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

export function useParseLeads() {
  return useMutation({
    mutationFn: emailApi.parseLeads,
  });
}
