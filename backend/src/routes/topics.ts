import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../plugins/supabase.js';
import {
  DEFAULT_INTERVALS,
  TOTAL_STEPS,
  calcNextDue,
  computeColorGrade,
  calcStreak,
  toDateString,
  getIntervals,
} from '../services/spacedRepetition.js';
import { uploadTopicImage } from '../services/imageUpload.js';

const FREE_TOPIC_LIMIT = 20;

export async function topicsRoutes(app: FastifyInstance) {
  // GET /api/v1/topics
  app.get('/topics', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();
    const query = req.query as any;

    let q = supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('next_revision_due', { ascending: true });

    if (query.tag) q = q.eq('subject_tag', query.tag);
    if (query.is_vocab) q = q.eq('is_vocab', query.is_vocab === 'true');

    const today = toDateString(new Date());

    if (query.status === 'due') {
      q = q.lte('next_revision_due', today).eq('is_completed', false);
    } else if (query.status === 'upcoming') {
      q = q.gt('next_revision_due', today).eq('is_completed', false);
    } else if (query.status === 'completed') {
      q = q.eq('is_completed', true);
    }

    if (query.search) {
      q = q.or(`title.ilike.%${query.search}%,subject_tag.ilike.%${query.search}%`);
    }

    const { data, error } = await q;
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ topics: data });
  });

  // POST /api/v1/topics
  app.post('/topics', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();
    const body = req.body as any;

    // Validate required fields
    if (!body.title?.trim()) {
      return reply.code(400).send({ error: 'title is required' });
    }
    if (!body.subject_tag?.trim()) {
      return reply.code(400).send({ error: 'subject_tag is required' });
    }

    // Check free-tier topic limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();

    if (!profile?.is_premium) {
      const { count } = await supabase
        .from('topics')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);

      if ((count ?? 0) >= FREE_TOPIC_LIMIT) {
        return reply.code(403).send({ error: 'TOPIC_LIMIT_REACHED', limit: FREE_TOPIC_LIMIT });
      }
    }

    // Handle image upload
    let imageUrl: string | null = null;
    if (body.image_base64 && body.image_mime_type) {
      try {
        imageUrl = await uploadTopicImage(userId, body.image_base64, body.image_mime_type);
      } catch (err: any) {
        return reply.code(500).send({ error: 'Image upload failed: ' + err.message });
      }
    }

    // Calculate first revision due date
    const intervals = DEFAULT_INTERVALS;
    const nextDue = calcNextDue(0, intervals)!;

    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        title: body.title.trim(),
        subject_tag: body.subject_tag.trim(),
        note: body.note?.trim() ?? null,
        image_url: imageUrl,
        next_revision_due: toDateString(nextDue),
        revision_step: 0,
        color_grade: 'new',
        is_vocab: body.is_vocab ?? false,
      })
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ topic });
  });

  // GET /api/v1/topics/:id
  app.get('/topics/:id', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { id } = req.params as any;
    const supabase = getSupabase();

    const { data: topic, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !topic) return reply.code(404).send({ error: 'Topic not found' });

    // Fetch revision history
    const { data: revisions } = await supabase
      .from('revisions')
      .select('*')
      .eq('topic_id', id)
      .order('revised_at', { ascending: false });

    return reply.send({ topic, revisions: revisions ?? [] });
  });

  // PATCH /api/v1/topics/:id
  app.patch('/topics/:id', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { id } = req.params as any;
    const body = req.body as any;
    const supabase = getSupabase();

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.subject_tag !== undefined) updates.subject_tag = body.subject_tag.trim();
    if (body.note !== undefined) updates.note = body.note;

    // Handle image update
    if (body.image_base64 && body.image_mime_type) {
      try {
        updates.image_url = await uploadTopicImage(userId, body.image_base64, body.image_mime_type);
      } catch (err: any) {
        return reply.code(500).send({ error: 'Image upload failed' });
      }
    }

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ error: 'No valid fields to update' });
    }

    const { data: topic, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error || !topic) return reply.code(404).send({ error: 'Topic not found' });
    return reply.send({ topic });
  });

  // DELETE /api/v1/topics/:id (soft delete)
  app.delete('/topics/:id', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { id } = req.params as any;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('topics')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ success: true });
  });

  // POST /api/v1/topics/:id/revise  — Mark as Revised
  app.post('/topics/:id/revise', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { id } = req.params as any;
    const supabase = getSupabase();

    // Get current topic
    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (topicErr || !topic) return reply.code(404).send({ error: 'Topic not found' });
    if (topic.is_completed) return reply.code(400).send({ error: 'Topic is already completed' });

    const intervals = getIntervals(topic.custom_intervals);
    const newStep = topic.revision_step + 1;
    const isCompleted = newStep >= TOTAL_STEPS;
    const nextDue = isCompleted ? null : calcNextDue(newStep, intervals);
    const wasOverdue =
      topic.next_revision_due &&
      new Date(topic.next_revision_due) < new Date(new Date().toDateString());

    const colorGrade = computeColorGrade(nextDue, newStep, isCompleted);

    const topicUpdates: Record<string, any> = {
      revision_step: newStep,
      last_revised_at: new Date().toISOString(),
      is_completed: isCompleted,
      color_grade: isCompleted ? 'done' : colorGrade,
    };
    if (nextDue) topicUpdates.next_revision_due = toDateString(nextDue);

    // Update topic
    const { data: updatedTopic, error: updateErr } = await supabase
      .from('topics')
      .update(topicUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return reply.code(500).send({ error: updateErr.message });

    // Log revision
    await supabase.from('revisions').insert({
      topic_id: id,
      user_id: userId,
      step_completed: topic.revision_step,
      was_missed: wasOverdue,
    });

    // Update profile stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, last_revision_date, total_revisions')
      .eq('id', userId)
      .single();

    if (profile) {
      const newStreak = calcStreak(profile.streak_days, profile.last_revision_date);
      await supabase.from('profiles').update({
        total_revisions: (profile.total_revisions ?? 0) + 1,
        streak_days: newStreak,
        last_revision_date: toDateString(new Date()),
      }).eq('id', userId);
    }

    return reply.send({ topic: updatedTopic });
  });

  // PATCH /api/v1/topics/:id/intervals — Premium: set custom intervals
  app.patch('/topics/:id/intervals', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { id } = req.params as any;
    const body = req.body as any;
    const supabase = getSupabase();

    // Check premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', userId)
      .single();

    if (!profile?.is_premium) {
      return reply.code(403).send({ error: 'PREMIUM_REQUIRED' });
    }

    const intervals = body.intervals;
    if (!Array.isArray(intervals) || intervals.length !== TOTAL_STEPS) {
      return reply.code(400).send({ error: `intervals must be an array of ${TOTAL_STEPS} numbers` });
    }
    if (!intervals.every((n: any) => typeof n === 'number' && n > 0)) {
      return reply.code(400).send({ error: 'All interval values must be positive numbers' });
    }

    const { data: topic, error } = await supabase
      .from('topics')
      .update({ custom_intervals: intervals })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ topic });
  });
}
