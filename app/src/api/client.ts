import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Request interceptor: attach JWT
    apiClient.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response interceptor: handle 401
    apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear stored token — auth store will pick this up
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
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
