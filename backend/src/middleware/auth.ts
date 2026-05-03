import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';

// Use service role client to verify tokens
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    // Use Supabase getUser - this validates the JWT against Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.log('Auth failed:', error?.message);
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    (req as any).userId = data.user.id;
    (req as any).userEmail = data.user.email;
  } catch (err: any) {
    console.log('Auth error:', err.message);
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

export async function authenticateInternal(req: FastifyRequest, reply: FastifyReply) {
  const secret = req.headers['x-internal-secret'];
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}