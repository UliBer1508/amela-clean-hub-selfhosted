import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const AMELA_PROVIDER_ID = '9de6e071-7e89-4d66-9433-a5f01acaa493';

export interface PortalMessage {
  id: string;
  provider_id: string;
  sender_type: 'admin' | 'provider';
  message: string;
  is_read: boolean;
  related_task_id?: string | null;
  related_linen_order_id?: string | null;
  created_at: string;
}

export const usePortalMessages = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Nachrichten laden
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['portal-messages', AMELA_PROVIDER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_messages')
        .select('*')
        .eq('provider_id', AMELA_PROVIDER_ID)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as PortalMessage[];
    },
  });

  // Ungelesene Admin-Nachrichten zählen
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['portal-unread-count', AMELA_PROVIDER_ID],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('provider_messages')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', AMELA_PROVIDER_ID)
        .eq('sender_type', 'admin')
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
  });

  // Nachricht senden (als Provider)
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data, error } = await supabase
        .from('provider_messages')
        .insert({
          provider_id: AMELA_PROVIDER_ID,
          sender_type: 'provider',
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages', AMELA_PROVIDER_ID] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    },
  });

  // Admin-Nachrichten als gelesen markieren
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('provider_messages')
        .update({ is_read: true })
        .eq('provider_id', AMELA_PROVIDER_ID)
        .eq('sender_type', 'admin')
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-messages', AMELA_PROVIDER_ID] });
      queryClient.invalidateQueries({ queryKey: ['portal-unread-count', AMELA_PROVIDER_ID] });
    },
  });

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('amela-portal-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_messages',
          filter: `provider_id=eq.${AMELA_PROVIDER_ID}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-messages', AMELA_PROVIDER_ID] });
          queryClient.invalidateQueries({ queryKey: ['portal-unread-count', AMELA_PROVIDER_ID] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    messages,
    isLoading,
    unreadCount,
    sendMessage: sendMessageMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
  };
};
