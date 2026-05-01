import { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabase } from '../plugins/supabase.js';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }

  // Attach user to request
  (req as any).userId = data.user.id;
  (req as any).userEmail = data.user.email;
}

export async function authenticateInternal(req: FastifyRequest, reply: FastifyReply) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}
