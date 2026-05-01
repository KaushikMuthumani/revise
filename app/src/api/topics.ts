import { getApiClient } from './client';

export interface Topic {
  id: string;
  user_id: string;
  title: string;
  subject_tag: string;
  note: string | null;
  image_url: string | null;
  created_at: string;
  last_revised_at: string | null;
  revision_step: number;
  next_revision_due: string;
  is_completed: boolean;
  missed_count: number;
  color_grade: string;
  custom_intervals: number[] | null;
  is_vocab: boolean;
}

export interface Revision {
  id: string;
  topic_id: string;
  revised_at: string;
  step_completed: number;
  was_missed: boolean;
}

export async function getTopics(params?: {
  status?: 'due' | 'upcoming' | 'completed' | 'all';
  tag?: string;
  search?: string;
  is_vocab?: boolean;
}): Promise<Topic[]> {
  const res = await getApiClient().get('/topics', { params });
  return res.data.topics;
}

export async function getTopic(id: string): Promise<{ topic: Topic; revisions: Revision[] }> {
  const res = await getApiClient().get(`/topics/${id}`);
  return res.data;
}

export async function createTopic(data: {
  title: string;
  subject_tag: string;
  note?: string;
  image_base64?: string;
  image_mime_type?: string;
  is_vocab?: boolean;
}): Promise<Topic> {
  const res = await getApiClient().post('/topics', data);
  return res.data.topic;
}

export async function updateTopic(
  id: string,
  data: Partial<Pick<Topic, 'title' | 'subject_tag' | 'note'>> & {
    image_base64?: string;
    image_mime_type?: string;
  }
): Promise<Topic> {
  const res = await getApiClient().patch(`/topics/${id}`, data);
  return res.data.topic;
}

export async function deleteTopic(id: string): Promise<void> {
  await getApiClient().delete(`/topics/${id}`);
}

export async function markRevised(id: string): Promise<Topic> {
  const res = await getApiClient().post(`/topics/${id}/revise`);
  return res.data.topic;
}

export async function updateTopicIntervals(id: string, intervals: number[]): Promise<Topic> {
  const res = await getApiClient().patch(`/topics/${id}/intervals`, { intervals });
  return res.data.topic;
}
