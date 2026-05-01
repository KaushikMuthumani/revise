import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth.js';
import { getSupabase } from '../plugins/supabase.js';
import { toDateString } from '../services/spacedRepetition.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/v1/dashboard/today
  app.get('/dashboard/today', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();

    const today = toDateString(new Date());
    const in7Days = toDateString(new Date(Date.now() + 7 * 86400000));

    // Due today
    const { data: dueToday } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .eq('next_revision_due', today)
      .eq('is_completed', false)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    // Overdue (before today, not completed)
    const { data: overdue } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .lt('next_revision_due', today)
      .eq('is_completed', false)
      .is('deleted_at', null)
      .order('next_revision_due', { ascending: true });

    // Upcoming 7 days
    const { data: upcoming } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .gt('next_revision_due', today)
      .lte('next_revision_due', in7Days)
      .eq('is_completed', false)
      .is('deleted_at', null)
      .order('next_revision_due', { ascending: true });

    // Profile stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_days, total_revisions, display_name')
      .eq('id', userId)
      .single();

    return reply.send({
      due_today: dueToday ?? [],
      overdue: overdue ?? [],
      upcoming_7_days: upcoming ?? [],
      streak: profile?.streak_days ?? 0,
      total_revisions: profile?.total_revisions ?? 0,
      display_name: profile?.display_name ?? '',
    });
  });

  // GET /api/v1/dashboard/calendar?month=YYYY-MM
  app.get('/dashboard/calendar', { preHandler: authenticate }, async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = (req as any).userId;
    const supabase = getSupabase();
    const query = req.query as any;

    // Default to current month
    const month = query.month ?? toDateString(new Date()).slice(0, 7);
    const [year, mon] = month.split('-').map(Number);

    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDate = new Date(year, mon, 0); // last day of month
    const endDateStr = toDateString(endDate);

    const { data: topics } = await supabase
      .from('topics')
      .select('next_revision_due, color_grade, is_completed')
      .eq('user_id', userId)
      .gte('next_revision_due', startDate)
      .lte('next_revision_due', endDateStr)
      .eq('is_completed', false)
      .is('deleted_at', null);

    // Group by date
    const calendarMap: Record<string, { count: number; grades: string[] }> = {};

    for (const t of topics ?? []) {
      const dateKey = t.next_revision_due;
      if (!calendarMap[dateKey]) calendarMap[dateKey] = { count: 0, grades: [] };
      calendarMap[dateKey].count++;
      if (!calendarMap[dateKey].grades.includes(t.color_grade)) {
        calendarMap[dateKey].grades.push(t.color_grade);
      }
    }

    return reply.send({ calendar: calendarMap, month });
  });
}
