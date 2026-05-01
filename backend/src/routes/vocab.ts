import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../plugins/supabase.js';
import { DEFAULT_INTERVALS, calcNextDue, toDateString } from '../services/spacedRepetition.js';

export async function vocabRoutes(app: FastifyInstance) {
  // GET /api/v1/vocab — list all GRE words
  app.get('/vocab', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const supabase = getSupabase();
    const query = req.query as any;

    let q = supabase.from('vocab_words').select('*').order('id');

    if (query.search) {
      q = q.or(`word.ilike.%${query.search}%,definition.ilike.%${query.search}%`);
    }
    if (query.difficulty) {
      q = q.eq('difficulty', query.difficulty);
    }

    const { data, error } = await q;
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ words: data });
  });

  // GET /api/v1/vocab/my — words the user has added
  app.get('/vocab/my', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .eq('is_vocab', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ topics: data });
  });

  // POST /api/v1/vocab/:word_id/add — add a vocab word to user's revision plan
  app.post('/vocab/:word_id/add', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const { word_id } = req.params as any;
    const supabase = getSupabase();

    // Get the vocab word
    const { data: word, error: wordErr } = await supabase
      .from('vocab_words')
      .select('*')
      .eq('id', word_id)
      .single();

    if (wordErr || !word) return reply.code(404).send({ error: 'Word not found' });

    // Check not already added
    const { data: existing } = await supabase
      .from('topics')
      .select('id')
      .eq('user_id', userId)
      .eq('is_vocab', true)
      .eq('title', word.word)
      .is('deleted_at', null)
      .single();

    if (existing) return reply.code(409).send({ error: 'ALREADY_ADDED' });

    // Check free-tier limit
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

      if ((count ?? 0) >= 20) {
        return reply.code(403).send({ error: 'TOPIC_LIMIT_REACHED', limit: 20 });
      }
    }

    const nextDue = calcNextDue(0, DEFAULT_INTERVALS)!;

    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        user_id: userId,
        title: word.word,
        subject_tag: 'Vocabulary',
        note: `${word.definition}${word.example_sentence ? '\n\nExample: ' + word.example_sentence : ''}`,
        next_revision_due: toDateString(nextDue),
        revision_step: 0,
        color_grade: 'new',
        is_vocab: true,
      })
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });
    return reply.code(201).send({ topic });
  });
}
