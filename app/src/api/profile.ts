import { getApiClient } from './client';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  referral_code: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  streak_days: number;
  total_revisions: number;
  notification_time: string;
  fcm_token: string | null;
  dark_mode: boolean;
}

export interface ProfileStats {
  topic_count: number;
  completed_count: number;
  streak_days: number;
  total_revisions: number;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  total_revisions: number;
  streak_days: number;
}

export async function getProfile(): Promise<{ profile: Profile; stats: ProfileStats }> {
  const res = await getApiClient().get('/profile');
  return res.data;
}

export async function updateProfile(data: Partial<{
  display_name: string;
  notification_time: string;
  dark_mode: boolean;
  fcm_token: string;
}>): Promise<Profile> {
  const res = await getApiClient().patch('/profile', data);
  return res.data.profile;
}

export async function getLeaderboard(): Promise<{
  leaderboard: LeaderboardEntry[];
  user_rank: number;
}> {
  const res = await getApiClient().get('/leaderboard');
  return res.data;
}

export async function getDashboardToday() {
  const res = await getApiClient().get('/dashboard/today');
  return res.data;
}

export async function getDashboardCalendar(month: string) {
  const res = await getApiClient().get('/dashboard/calendar', { params: { month } });
  return res.data;
}

export async function updateGlobalIntervals(intervals: number[]) {
  const res = await getApiClient().patch('/profile/intervals', { intervals });
  return res.data;
}
