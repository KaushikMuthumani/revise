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

    // Attach JWT from Supabase session on every request
    apiClient.interceptors.request.use(async (config) => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 - session expired
    apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await supabase.auth.signOut();
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