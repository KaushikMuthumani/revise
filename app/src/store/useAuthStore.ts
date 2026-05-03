import { create } from 'zustand';
import { createClient, Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,

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
    set({ user: data.user, session: data.session, isLoading: false });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({ user: data.user, session: data.session, isLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  clearError: () => set({ error: null }),
}));