export const Colors = {
  // Brand
  primary: '#1A56DB',
  primaryLight: '#E8F0FE',
  primaryDark: '#1341A8',

  // Grades
  gradeNew: '#1A56DB',
  gradeDue: '#F59E0B',
  gradeOverdue: '#EF4444',
  gradeUpcoming: '#6B7280',
  gradeDone: '#10B981',

  // Grade backgrounds
  gradeNewBg: '#EFF6FF',
  gradedueBg: '#FFFBEB',
  gradeOverdueBg: '#FEF2F2',
  gradeUpcomingBg: '#F9FAFB',
  gradeDoneBg: '#ECFDF5',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#3B82F6',

  // Dark mode
  darkBg: '#111827',
  darkCard: '#1F2937',
  darkBorder: '#374151',
  darkText: '#F9FAFB',
  darkTextSecondary: '#9CA3AF',
};

export const DarkColors = {
  ...Colors,
  white: '#1F2937',
  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray800: '#F9FAFB',
  gray900: '#FFFFFF',
  gray700: '#E5E7EB',
  gray600: '#D1D5DB',
};

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'new': return Colors.gradeNew;
    case 'due': return Colors.gradeDue;
    case 'overdue': return Colors.gradeOverdue;
    case 'done': return Colors.gradeDone;
    default: return Colors.gradeUpcoming;
  }
}

export function gradeBgColor(grade: string): string {
  switch (grade) {
    case 'new': return Colors.gradeNewBg;
    case 'due': return Colors.gradedueBg;
    case 'overdue': return Colors.gradeOverdueBg;
    case 'done': return Colors.gradeDoneBg;
    default: return Colors.gradeUpcomingBg;
  }
}
