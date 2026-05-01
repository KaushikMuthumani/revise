import { create } from 'zustand';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client with SecureStore adapter
const supabaseStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initSession: async () => {
    set({ isLoading: true });
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoading: false,
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.access_token) {
        SecureStore.setItemAsync('access_token', session.access_token);
      }
    });
  },

  signUp: async (email, password, displayName, referralCode) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          referred_by: referralCode ?? null,
        },
      },
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    if (data.session?.access_token) {
      await SecureStore.setItemAsync('access_token', data.session.access_token);
    }
    set({ user: data.user, session: data.session, isLoading: false });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    if (data.session?.access_token) {
      await SecureStore.setItemAsync('access_token', data.session.access_token);
    }
    set({ user: data.user, session: data.session, isLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));
