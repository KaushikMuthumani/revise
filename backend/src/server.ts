import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { topicsRoutes } from './routes/topics.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { vocabRoutes } from './routes/vocab.js';
import { profileRoutes } from './routes/profile.js';
import { billingRoutes } from './routes/billing.js';
import { sendDailyNotifications } from './services/notifications.js';
import { authenticateInternal } from './middleware/auth.js';

const app = Fastify({ logger: true });

// ── PLUGINS ──────────────────────────────────────────────
await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(rateLimit, {
  max: 200,
  timeWindow: '1 minute',
});

// ── HEALTH CHECK ─────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// ── API ROUTES ────────────────────────────────────────────
await app.register(async (api) => {
  await api.register(topicsRoutes);
  await api.register(dashboardRoutes);
  await api.register(vocabRoutes);
  await api.register(profileRoutes);
  await api.register(billingRoutes);
}, { prefix: '/api/v1' });

// ── INTERNAL ROUTES (called by pg_cron) ──────────────────
app.post('/internal/send-notifications', {
  preHandler: authenticateInternal,
}, async (_req, reply) => {
  await sendDailyNotifications();
  return reply.send({ success: true });
});

// ── START ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Revise backend running on port ${PORT}`);
});
