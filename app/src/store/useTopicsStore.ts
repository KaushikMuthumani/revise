import { create } from 'zustand';
import { Topic, getTopics, markRevised as apiMarkRevised, deleteTopic as apiDeleteTopic, createTopic as apiCreateTopic } from '../api/topics';

interface TopicsState {
  topics: Topic[];
  dueToday: Topic[];
  overdue: Topic[];
  upcoming: Topic[];
  isLoading: boolean;
  error: string | null;
  fetchTopics: (params?: { status?: string; tag?: string; search?: string }) => Promise<void>;
  fetchDashboard: () => Promise<void>;
  markRevised: (id: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  addTopic: (data: { title: string; subject_tag: string; note?: string; image_base64?: string; image_mime_type?: string }) => Promise<{ error?: string; code?: string }>;
}

export const useTopicsStore = create<TopicsState>((set, get) => ({
  topics: [],
  dueToday: [],
  overdue: [],
  upcoming: [],
  isLoading: false,
  error: null,

  fetchTopics: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const topics = await getTopics(params as any);
      set({ topics, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchDashboard: async () => {
    set({ isLoading: true });
    try {
      const { getApiClient } = await import('../api/client');
      const res = await getApiClient().get('/dashboard/today');
      set({
        dueToday: res.data.due_today,
        overdue: res.data.overdue,
        upcoming: res.data.upcoming_7_days,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  markRevised: async (id: string) => {
    // Optimistic UI: remove from due/overdue lists
    const prev = {
      dueToday: get().dueToday,
      overdue: get().overdue,
      topics: get().topics,
    };
    set({
      dueToday: get().dueToday.filter((t) => t.id !== id),
      overdue: get().overdue.filter((t) => t.id !== id),
    });
    try {
      const updated = await apiMarkRevised(id);
      // Update in topics list
      set((state) => ({
        topics: state.topics.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (e: any) {
      // Rollback on failure
      set({ dueToday: prev.dueToday, overdue: prev.overdue, topics: prev.topics });
      throw e;
    }
  },

  deleteTopic: async (id: string) => {
    // Optimistic
    const prev = { topics: get().topics, dueToday: get().dueToday, overdue: get().overdue };
    set({
      topics: get().topics.filter((t) => t.id !== id),
      dueToday: get().dueToday.filter((t) => t.id !== id),
      overdue: get().overdue.filter((t) => t.id !== id),
    });
    try {
      await apiDeleteTopic(id);
    } catch (e) {
      set(prev);
      throw e;
    }
  },

  addTopic: async (data) => {
    try {
      await apiCreateTopic(data);
      await get().fetchDashboard();
      return {};
    } catch (e: any) {
      const code = e.response?.data?.error;
      return { error: e.response?.data?.error ?? e.message, code };
    }
  },
}));
