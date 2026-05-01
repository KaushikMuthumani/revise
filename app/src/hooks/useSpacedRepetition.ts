import { DEFAULT_INTERVALS, TOTAL_STEPS } from '../utils/constants';

export function useSpacedRepetition(customIntervals?: number[] | null) {
  const intervals = customIntervals?.length === TOTAL_STEPS ? customIntervals : DEFAULT_INTERVALS;

  function getNextDueDate(currentStep: number): Date | null {
    if (currentStep >= TOTAL_STEPS) return null;
    const days = intervals[currentStep];
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next;
  }

  function getProgressLabel(step: number): string {
    if (step === 0) return 'Not started';
    if (step >= TOTAL_STEPS) return 'Completed!';
    return `Revision ${step} of ${TOTAL_STEPS}`;
  }

  function getProgressPercent(step: number): number {
    return Math.min((step / TOTAL_STEPS) * 100, 100);
  }

  return { intervals, getNextDueDate, getProgressLabel, getProgressPercent, TOTAL_STEPS };
}
