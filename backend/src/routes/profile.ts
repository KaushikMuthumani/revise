import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../plugins/supabase.js';

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/v1/profile
  app.get('/profile', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) return reply.code(404).send({ error: 'Profile not found' });

    // Get topic count
    const { count: topicCount } = await supabase
      .from('topics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Get completed topic count
    const { count: completedCount } = await supabase
      .from('topics')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true)
      .is('deleted_at', null);

    return reply.send({
      profile,
      stats: {
        topic_count: topicCount ?? 0,
        completed_count: completedCount ?? 0,
        streak_days: profile.streak_days,
        total_revisions: profile.total_revisions,
      },
    });
  });

  // PATCH /api/v1/profile
  app.patch('/profile', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const body = req.body as any;
    const supabase = getSupabase();

    const allowed = ['display_name', 'notification_time', 'dark_mode', 'fcm_token'];
    const updates: Record<string, any> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'No valid fields to update' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ profile });
  });

  // GET /api/v1/leaderboard
  app.get('/leaderboard', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    // Top 100 by total_revisions
    const { data: leaders, error } = await supabase
      .from('profiles')
      .select('id, display_name, total_revisions, streak_days')
      .order('total_revisions', { ascending: false })
      .limit(100);

    if (error) return reply.code(500).send({ error: error.message });

    // Find current user's rank
    const userIndex = (leaders ?? []).findIndex((l) => l.id === userId);
    let userRank = userIndex + 1;

    // If user not in top 100, calculate rank
    if (userIndex === -1) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('total_revisions')
        .eq('id', userId)
        .single();

      if (userProfile) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('total_revisions', userProfile.total_revisions);
        userRank = (count ?? 0) + 1;
      }
    }

    return reply.send({ leaderboard: leaders ?? [], user_rank: userRank });
  });

  // PATCH /api/v1/profile/intervals — Premium: update global custom intervals
  app.patch('/profile/intervals', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const body = req.body as any;
    const supabase = getSupabase();

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();

    if (!profile?.is_premium) {
      return reply.code(403).send({ error: 'PREMIUM_REQUIRED' });
    }

    const intervals = body.intervals;
    if (!Array.isArray(intervals) || intervals.length !== 7) {
      return reply.code(400).send({ error: 'intervals must be an array of 7 positive numbers' });
    }

    // Update all non-completed topics for this user with the new intervals
    const { error } = await supabase
      .from('topics')
      .update({ custom_intervals: intervals })
      .eq('user_id', userId)
      .eq('is_completed', false)
      .is('deleted_at', null);

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ success: true, intervals });
  });
}
