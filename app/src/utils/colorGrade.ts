import { Colors } from '../theme/colors';
import { DEFAULT_INTERVALS, TOTAL_STEPS } from './constants';

export function computeColorGrade(
  nextDue: string | null,
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

export function gradeToColor(grade: string): string {
  switch (grade) {
    case 'new': return Colors.gradeNew;
    case 'due': return Colors.gradeDue;
    case 'overdue': return Colors.gradeOverdue;
    case 'done': return Colors.gradeDone;
    default: return Colors.gradeUpcoming;
  }
}

export function calcNextDueDate(step: number, intervals: number[] = DEFAULT_INTERVALS): string {
  if (step >= TOTAL_STEPS) return '';
  const days = intervals[step];
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
}
