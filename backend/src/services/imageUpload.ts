import { getSupabase } from '../plugins/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'topic-images';

export async function uploadTopicImage(
  userId: string,
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const supabase = getSupabase();

  // Decode base64
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fileName = `${userId}/${uuidv4()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteTopicImage(imageUrl: string): Promise<void> {
  const supabase = getSupabase();
  // Extract path from URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split(`/${BUCKET}/`);
  if (pathParts.length < 2) return;
  const filePath = pathParts[1];
  await supabase.storage.from(BUCKET).remove([filePath]);
}
