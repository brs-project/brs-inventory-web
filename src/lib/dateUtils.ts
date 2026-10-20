/**
 * Date and Time utilities for Indian Standard Time (IST / Asia/Kolkata).
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Parses any date/timestamp input into a valid Date object or null if invalid.
 */
function parseDateInput(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  // Date-only format "YYYY-MM-DD"
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const [y, m, d] = input.trim().split('-').map(Number);
    // 06:30 UTC = 12:00 PM IST on that day
    return new Date(Date.UTC(y, m - 1, d, 6, 30));
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date/timestamp to Indian Standard Time (IST) Date & Time.
 * Example: "14 Oct 2026, 04:39 PM"
 */
export function formatISTDateTime(
  dateStr: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  const d = parseDateInput(dateStr);
  if (!d) return fallback;

  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return formatted.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
  } catch (err) {
    console.error('Error in formatISTDateTime:', err);
    return fallback;
  }
}

/**
 * Formats a date to Indian Standard Time (IST) Date.
 * Example: "14 Oct 2026"
 */
export function formatISTDate(
  dateStr: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  const d = parseDateInput(dateStr);
  if (!d) return fallback;

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch (err) {
    console.error('Error in formatISTDate:', err);
    return fallback;
  }
}

/**
 * Returns Indian date string (YYYY-MM-DD) for HTML date pickers.
 * Example: "2026-10-16"
 */
export function getISTTodayDateString(date: Date = new Date()): string {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Formats time in IST (e.g. "04:39 PM").
 */
export function formatISTTime(
  dateStr: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  const d = parseDateInput(dateStr);
  if (!d) return fallback;

  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return formatted.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
  } catch {
    return fallback;
  }
}

export default {
  formatISTDateTime,
  formatISTDate,
  getISTTodayDateString,
  formatISTTime,
  IST_TIMEZONE,
};
