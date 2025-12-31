/**
 * Payroll Utility Functions
 * Helper functions for payroll calculations and formatting
 */

/**
 * Format a number as USD currency
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate the next bi-weekly pay period based on the last end date
 * Payroll runs every 2 weeks (26 runs per year)
 *
 * @param lastEndDate - The end date of the last pay period (yyyy-MM-dd)
 * @returns Object with start and end dates for the next pay period
 */
export function getNextPayPeriod(lastEndDate: string): { start: string; end: string } {
  const lastEnd = new Date(lastEndDate);

  // Next period starts the day after the last period ended
  const nextStart = new Date(lastEnd);
  nextStart.setDate(nextStart.getDate() + 1);

  // Next period ends 13 days later (14-day period)
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 13);

  return {
    start: formatDate(nextStart),
    end: formatDate(nextEnd),
  };
}

/**
 * Calculate the check date based on the run date
 * Typically 3 days after the run date
 *
 * @param runDate - The payroll run date (yyyy-MM-dd)
 * @returns Check date (yyyy-MM-dd)
 */
export function getNextCheckDate(runDate: string): string {
  const run = new Date(runDate);
  const check = new Date(run);
  check.setDate(check.getDate() + 3);

  return formatDate(check);
}

/**
 * Format a Date object as yyyy-MM-dd string
 * @param date - Date object to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string in various formats to yyyy-MM-dd
 * Handles: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
 *
 * @param dateStr - Date string to parse
 * @returns Formatted date string (yyyy-MM-dd) or empty string if invalid
 */
export function parseDateString(dateStr: string): string {
  if (!dateStr) return '';

  // Already in yyyy-MM-dd format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // MM/DD/YYYY or MM-DD-YYYY format
  const match = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try parsing as Date and formatting
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return formatDate(date);
  }

  return '';
}

/**
 * Calculate total hours worked based on gross pay and hourly rate
 * @param grossPay - Total gross pay amount
 * @param hourlyRate - Hourly rate
 * @returns Total hours worked (rounded to 2 decimals)
 */
export function calculateHours(grossPay: number, hourlyRate: number): number {
  if (hourlyRate === 0) return 0;
  return Math.round((grossPay / hourlyRate) * 100) / 100;
}

/**
 * Get the current year for payroll filtering
 * @returns Current year as number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Get an array of recent years for payroll filtering
 * @param yearsBack - Number of years to go back (default: 3)
 * @returns Array of years [current, current-1, current-2, ...]
 */
export function getRecentYears(yearsBack: number = 3): number[] {
  const currentYear = getCurrentYear();
  const years: number[] = [];

  for (let i = 0; i < yearsBack; i++) {
    years.push(currentYear - i);
  }

  return years;
}

/**
 * Format a date string for display
 * @param dateStr - Date string (yyyy-MM-dd)
 * @returns Formatted date (e.g., "Jan 1, 2025")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Get status badge color based on payroll status
 * @param status - Payroll status
 * @returns MUI color variant
 */
export function getPayrollStatusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'Draft':
      return 'default';
    case 'Approved':
      return 'warning';
    case 'Processed':
      return 'success';
    default:
      return 'default';
  }
}

/**
 * Get status badge color based on reimbursement status
 * @param status - Reimbursement status
 * @returns MUI color variant
 */
export function getReimbursementStatusColor(status: string): 'default' | 'warning' | 'success' | 'error' {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'Approved':
      return 'default';
    case 'Reimbursed':
      return 'success';
    case 'Denied':
      return 'error';
    default:
      return 'default';
  }
}
