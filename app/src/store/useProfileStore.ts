import { create } from 'zustand';
import { Profile, ProfileStats, getProfile, updateProfile as apiUpdateProfile } from '../api/profile';

interface ProfileState {
  profile: Profile | null;
  stats: ProfileStats | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setDarkMode: (val: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { profile, stats } = await getProfile();
      set({ profile, stats, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      const updated = await apiUpdateProfile(data as any);
      set((state) => ({ profile: state.profile ? { ...state.profile, ...updated } : updated }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  setDarkMode: (val) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, dark_mode: val } : null,
    }));
  },
}));
