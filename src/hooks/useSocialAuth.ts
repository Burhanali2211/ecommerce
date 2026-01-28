import React from 'react';
import { apiClient } from '../lib/apiClient';
import { useNotification } from '../contexts/NotificationContext';

// Hook for social auth state
export const useSocialAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { showNotification } = useNotification();

  const signInWithProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to sign in with ${provider}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const linkProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        throw error;
      }

      showNotification(`Successfully linked ${provider} account`, 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to link ${provider} account`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const unlinkProvider = async (provider: 'google' | 'facebook' | 'apple' | 'github' | 'twitter') => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.unlinkIdentity({
        provider,
      });

      if (error) {
        throw error;
      }

      showNotification(`Successfully unlinked ${provider} account`, 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to unlink ${provider} account`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signInWithProvider,
    linkProvider,
    unlinkProvider,
  };
};
