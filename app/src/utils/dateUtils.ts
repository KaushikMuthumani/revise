import { format, differenceInDays, isToday, isBefore, startOfDay } from 'date-fns';

export function toDateString(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy');
}

export function getDueLabelForTopic(nextDue: string | null, isCompleted: boolean): string {
  if (isCompleted) return 'Completed ✓';
  if (!nextDue) return '';

  const dueDate = startOfDay(new Date(nextDue));
  const today = startOfDay(new Date());
  const diff = differenceInDays(dueDate, today);

  if (diff === 0) return 'Due today';
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`;
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff} days`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function formatTime(timeStr: string): string {
  // timeStr is HH:MM:SS
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}
