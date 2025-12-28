import type { PtoType } from '../types';

export const PTO_TYPE_COLORS = {
  Vacation: { main: '#2563eb', light: '#dbeafe', dark: '#1d4ed8' },
  Sick: { main: '#ef4444', light: '#fee2e2', dark: '#dc2626' },
  Other: { main: '#14b8a6', light: '#ccfbf1', dark: '#0d9488' },
} as const;

export const CALENDAR_COLORS = {
  holiday: { main: '#f59e0b', light: '#fef3c7' },
  blackout: { main: '#6b7280', light: '#e5e7eb' },
} as const;

export function getTypeColor(type: PtoType) {
  return PTO_TYPE_COLORS[type] || PTO_TYPE_COLORS.Other;
}

export function getTypeLabel(type: PtoType): string {
  return type;
}

export function isShortNotice(startDate: string, submittedDate: string, thresholdDays: number): boolean {
  const start = new Date(startDate);
  const submitted = new Date(submittedDate);
  const diffTime = start.getTime() - submitted.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= thresholdDays && diffDays >= 0;
}
