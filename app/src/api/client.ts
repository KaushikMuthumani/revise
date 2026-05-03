import axios, { AxiosInstance } from 'axios';
import { supabase } from '../store/useAuthStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    apiClient.interceptors.request.use(async (config) => {
      try {
        // First try to get current session
        const { data } = await supabase.auth.getSession();
        let token = data.session?.access_token;

        // If no session, try to refresh
        if (!token) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          token = refreshData.session?.access_token;
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('API call made with no auth token');
        }
      } catch (e) {
        console.warn('Failed to get auth token:', e);
      }
      return config;
    });

    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('Got 401 - attempting token refresh');
          try {
            const { data } = await supabase.auth.refreshSession();
            if (data.session) {
              // Retry the request with new token
              error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
              return axios(error.config);
            }
          } catch (e) {
            console.log('Token refresh failed, signing out');
            await supabase.auth.signOut();
          }
        }
        return Promise.reject(error);
      }
    );
  }
  return apiClient;
}

export function resetApiClient() {
  apiClient = null;
}