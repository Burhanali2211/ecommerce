import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [mobileAuthMode, setMobileAuthMode] = useState<'login' | 'signup' | 'profile'>('login');

  const mapSupabaseUserToAppUser = (sbUser: any, profile: any): User => {
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name: profile?.full_name || sbUser.user_metadata?.full_name || 'User',
      fullName: profile?.full_name || sbUser.user_metadata?.full_name || 'User',
      role: profile?.role || 'customer',
      avatar: profile?.avatar_url || sbUser.user_metadata?.avatar_url,
      phone: profile?.phone || sbUser.user_metadata?.phone,
      dateOfBirth: profile?.date_of_birth,
      gender: profile?.gender,
      isActive: profile?.is_active ?? true,
      emailVerified: sbUser.email_confirmed_at ? true : false,
      businessName: profile?.business_name,
      businessAddress: profile?.business_address,
      businessPhone: profile?.business_phone,
      taxId: profile?.tax_id,
      preferredLanguage: profile?.preferred_language || 'en',
      newsletterSubscribed: profile?.newsletter_subscribed || false,
      createdAt: new Date(sbUser.created_at),
      updatedAt: profile?.updated_at ? new Date(profile.updated_at) : undefined,
    };
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error) return data;

    // PGRST116 = 0 rows — profile was never created (trigger missing / pre-trigger signup).
    // Use the SECURITY DEFINER RPC so RLS never blocks this fallback creation.
    if (error.code === 'PGRST116') {
      const { data: { user: sbUser } } = await supabase.auth.getUser();

      // If there is no active session, we can't create the profile safely.
      // This happens right after signUp when email confirmation is still required.
      // The trigger already created the profile row; it's just not visible to anon.
      if (!sbUser) return null;

      const { error: rpcErr } = await supabase.rpc('ensure_profile_exists', {
        p_user_id:   userId,
        p_email:     sbUser.email || '',
        p_full_name: sbUser.user_metadata?.full_name || 'User',
        p_role:      sbUser.user_metadata?.role || 'customer',
      });

      if (rpcErr) {
        console.error('Error creating missing profile:', rpcErr);
        return null;
      }

      // Re-fetch the profile that was just upserted
      const { data: created } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return created || null;
    }

    console.error('Error fetching profile:', error);
    return null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(mapSupabaseUserToAppUser(session.user, profile));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(mapSupabaseUserToAppUser(session.user, profile));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    // Do NOT touch the shared `loading` state here — that's only for the initial
    // session check. AuthPage manages its own button-level loading state.
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setUser(mapSupabaseUserToAppUser(data.user, profile));
    }
  };

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> => {
    // Do NOT touch the shared `loading` state here.
    let fullName = additionalData?.fullName as string;
    if (!fullName) {
      const firstName = (additionalData?.firstName as string) || '';
      const lastName = (additionalData?.lastName as string) || '';
      fullName = `${firstName} ${lastName}`.trim() || 'User';
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          role: additionalData?.role || 'customer',
        }
      }
    });

    if (error) throw error;

    // data.session is null when email confirmation is required.
    // Do NOT set user state in that case — the Supabase client has no JWT,
    // so any subsequent DB write (cart, wishlist, etc.) would use the anon
    // role and fail with RLS violations.  The caller (AuthPage) will
    // detect this and show a "check your email" message instead.
    if (data.user && data.session) {
      const profile = await fetchProfile(data.user.id);
      setUser(mapSupabaseUserToAppUser(data.user, profile));
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('cart_items');
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signIn(email, password);
      return null;
    } catch (error: any) {
      return error.message || 'Login failed';
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      await signUp(
        userData.email!,
        userData.password!,
        { fullName: userData.name || userData.fullName || 'User' }
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!user) {
        throw new Error('No user is currently authenticated');
      }

      // Update auth metadata if name changes
      if (updates.fullName || updates.name) {
        await supabase.auth.updateUser({
          data: { full_name: updates.fullName || updates.name }
        });
      }

      // Update profiles table
      const profileUpdates: any = {};
      if (updates.fullName || updates.name) profileUpdates.full_name = updates.fullName || updates.name;
      if (updates.avatar) profileUpdates.avatar_url = updates.avatar;
      if (updates.phone) profileUpdates.phone = updates.phone;
      if (updates.dateOfBirth) profileUpdates.date_of_birth = updates.dateOfBirth;
      if (updates.gender) profileUpdates.gender = updates.gender;
      if (updates.preferredLanguage) profileUpdates.preferred_language = updates.preferredLanguage;
      if (updates.newsletterSubscribed !== undefined) profileUpdates.newsletter_subscribed = updates.newsletterSubscribed;

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        setUser(mapSupabaseUserToAppUser(sbUser, data));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        const profile = await fetchProfile(sbUser.id);
        setUser(mapSupabaseUserToAppUser(sbUser, profile));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resendVerification = async (): Promise<void> => {
    if (!user?.email) throw new Error('No email found');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const openMobileAuth = (mode: 'login' | 'signup' | 'profile' = 'login') => {
    setMobileAuthMode(mode);
    setIsMobileAuthOpen(true);
  };

  const closeMobileAuth = () => {
    setIsMobileAuthOpen(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    refreshUser,
    openMobileAuth,
    closeMobileAuth,
    isMobileAuthOpen,
    mobileAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
