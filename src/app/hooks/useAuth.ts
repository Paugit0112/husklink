/**
 * Authentication Hooks
 *
 * Hooks for user authentication and session management.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

/**
 * Hook for user authentication
 *
 * Usage:
 * const { user, loading, error, signUp, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'producer' | 'buyer' | 'admin'
  ) => {
    setError(null);
    try {
      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) throw signUpError;
      if (!newUser) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          email,
          full_name: fullName,
          role
        });

      if (profileError) throw profileError;

      return newUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { data: { user: signedInUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      setUser(signedInUser);
      return signedInUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { user, loading, error, signUp, signIn, signOut };
}

/**
 * Hook for password reset
 *
 * Usage:
 * const { resetPassword, loading, error } = usePasswordReset();
 * await resetPassword(email);
 */
export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) throw resetError;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { resetPassword, loading, error };
}
