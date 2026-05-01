import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../plugins/supabase.js';
import { verifyPlayStorePurchase } from '../services/billingVerify.js';

export async function billingRoutes(app: FastifyInstance) {
  // POST /api/v1/billing/verify
  app.post('/billing/verify', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const body = req.body as any;
    const supabase = getSupabase();

    const { purchaseToken, productId } = body;
    if (!purchaseToken || !productId) {
      return reply.code(400).send({ error: 'purchaseToken and productId are required' });
    }

    const result = await verifyPlayStorePurchase(purchaseToken, productId);

    if (!result.valid) {
      return reply.code(402).send({ error: 'Purchase verification failed', details: result });
    }

    // Update profile to premium
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: result.expiresAt?.toISOString() ?? null,
        play_purchase_token: purchaseToken,
      })
      .eq('id', userId);

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({
      success: true,
      is_premium: true,
      expires_at: result.expiresAt,
    });
  });

  // POST /api/v1/billing/restore
  app.post('/billing/restore', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    const { data: profile } = await supabase
      .from('profiles')
      .select('play_purchase_token, is_premium, premium_expires_at')
      .eq('id', userId)
      .single();

    if (!profile?.play_purchase_token) {
      return reply.code(404).send({ error: 'No previous purchase found' });
    }

    const result = await verifyPlayStorePurchase(
      profile.play_purchase_token,
      process.env.GOOGLE_PLAY_SKU ?? 'revise_premium_yearly'
    );

    if (!result.valid) {
      // Subscription expired — revoke premium
      await supabase
        .from('profiles')
        .update({ is_premium: false })
        .eq('id', userId);

      return reply.send({ success: false, is_premium: false, message: 'Subscription expired or invalid' });
    }

    // Still valid — ensure premium flag is set
    await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_expires_at: result.expiresAt?.toISOString() ?? null,
      })
      .eq('id', userId);

    return reply.send({
      success: true,
      is_premium: true,
      expires_at: result.expiresAt,
    });
  });
}
