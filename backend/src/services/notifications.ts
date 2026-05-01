import { getMessaging } from '../plugins/firebase.js';
import { getSupabase } from '../plugins/supabase.js';

export async function sendDailyNotifications(): Promise<void> {
  const supabase = getSupabase();
  const nowHour = new Date().getUTCHours();
  const nowMinute = new Date().getUTCMinutes();

  // Find users whose notification_time matches the current UTC hour (within window)
  // notification_time is stored as HH:MM:SS in the DB
  // We send for users whose notification_time hour == current UTC hour
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, fcm_token, notification_time, display_name')
    .not('fcm_token', 'is', null)
    .gte('notification_time', `${String(nowHour).padStart(2, '0')}:00:00`)
    .lt('notification_time', `${String(nowHour + 1).padStart(2, '0')}:00:00`);

  if (error || !profiles || profiles.length === 0) return;

  const today = new Date().toISOString().split('T')[0];

  for (const profile of profiles) {
    if (!profile.fcm_token) continue;

    // Get topics due today for this user
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title')
      .eq('user_id', profile.id)
      .eq('next_revision_due', today)
      .eq('is_completed', false)
      .is('deleted_at', null);

    const count = topics?.length ?? 0;
    if (count === 0) continue;

    const title = 'Time to revise! 📚';
    const body =
      count === 1
        ? `Time to revise: ${topics![0].title}`
        : `You have ${count} revision${count > 1 ? 's' : ''} due today.`;

    try {
      await getMessaging().send({
        token: profile.fcm_token,
        notification: { title, body },
        android: {
          channelId: 'revise_reminders',
          priority: 'high',
          notification: { sound: 'default' },
        },
        data: { screen: 'home/today' },
      });
    } catch (err) {
      console.error(`FCM send failed for user ${profile.id}:`, err);
    }
  }
}
