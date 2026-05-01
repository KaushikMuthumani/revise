// Default 7-step interval schedule (days)
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 60, 90];
export const TOTAL_STEPS = DEFAULT_INTERVALS.length; // 7

export function getIntervals(customIntervals?: number[] | null): number[] {
  if (customIntervals && customIntervals.length === TOTAL_STEPS) {
    return customIntervals;
  }
  return DEFAULT_INTERVALS;
}

/**
 * Calculate the next revision due date given current step and intervals.
 * Returns null if all steps are complete.
 */
export function calcNextDue(
  currentStep: number,
  intervals: number[],
  fromDate: Date = new Date()
): Date | null {
  if (currentStep >= TOTAL_STEPS) return null;
  const daysToAdd = intervals[currentStep];
  const next = new Date(fromDate);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + daysToAdd);
  return next;
}

/**
 * Compute color grade from topic state.
 */
export function computeColorGrade(
  nextDue: Date | null,
  revisionStep: number,
  isCompleted: boolean
): string {
  if (isCompleted) return 'done';
  if (revisionStep === 0) return 'new';
  if (!nextDue) return 'done';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);

  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'due';
  return 'upcoming';
}

/**
 * Determine if a topic is due today or overdue.
 */
export function isDueOrOverdue(nextDue: Date | null): boolean {
  if (!nextDue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);
  return due <= today;
}

/**
 * Format date as YYYY-MM-DD string.
 */
export function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Calculate streak update.
 * Returns new streak value.
 */
export function calcStreak(
  currentStreak: number,
  lastRevisionDate: string | null
): number {
  const today = toDateString(new Date());
  if (!lastRevisionDate) return 1;
  if (lastRevisionDate === today) return currentStreak; // already counted today

  const last = new Date(lastRevisionDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = toDateString(yesterday);

  if (lastRevisionDate === yStr) return currentStreak + 1;
  return 1; // streak broken
}
