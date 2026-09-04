/**
 * Vocabulary shared by the three panels.
 *
 * The task types and areas are the columns and rows of the Subcontractor
 * Daily Report this project already publishes, not an invented scheme — that
 * is what lets the weekly rollup be computed rather than typed.
 */

export const TASK_TYPES = [
  'Commissioning',
  'Checkout',
  'Software',
  'Supervision',
  'Rework',
];

/** Default areas. A project with different buildings just types its own. */
export const AREAS = ['NOX', 'UTL', 'MSGR', 'CCAC', 'MCAC', 'PCAC'];

export const HOUR_TYPES = [
  'regular',
  'overtime',
  'doubleTime',
  'travel',
  'standby',
];

export const PUNCH_STATUSES = [
  'open',
  'inProgress',
  'readyForReview',
  'closed',
  'wontFix',
];

export const PUNCH_PRIORITIES = ['low', 'normal', 'high', 'blocker'];

export const PART_STATUSES = [
  'needed',
  'quoted',
  'ordered',
  'shipped',
  'received',
  'installed',
  'returned',
];

/** antd Tag colours, keyed so status reads at a glance and not only as text. */
export const STATUS_COLOR: Record<string, string> = {
  open: 'red',
  inProgress: 'orange',
  readyForReview: 'purple',
  closed: 'green',
  wontFix: 'default',

  draft: 'default',
  submitted: 'orange',
  approved: 'green',
  rejected: 'red',

  needed: 'red',
  quoted: 'default',
  ordered: 'orange',
  shipped: 'blue',
  received: 'purple',
  installed: 'green',
  returned: 'default',
};

export const PRIORITY_COLOR: Record<string, string> = {
  blocker: 'red',
  high: 'orange',
  normal: 'default',
  low: 'default',
};

/** '861' + 'PL' + 14 -> '861-PL-014'; without a prefix, 'PL-014'. */
export function formatRef(
  prefix: string | undefined,
  kind: string,
  seq: number
): string {
  const tail = `${kind}-${String(seq ?? 0).padStart(3, '0')}`;
  return prefix ? `${prefix}-${tail}` : tail;
}

export function formatDate(value: string | Date | undefined): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString();
}

/**
 * Hours are stored as a decimal — 8.5 — because that is what sums and the
 * paper report both want. `h:mm` is a display format laid over that, and the
 * only format crews say out loud.
 *
 * The total is rounded to whole minutes ONCE and only then split. Rounding
 * the hour and the minute apart is how 7.999 renders as "7:60".
 */
export function formatHm(hours: number | undefined | null): string {
  const value = Number(hours ?? 0);
  if (!Number.isFinite(value)) {
    return '0:00';
  }

  const sign = value < 0 ? '-' : '';
  const total = Math.round(Math.abs(value) * 60);

  return `${sign}${Math.floor(total / 60)}:${String(total % 60).padStart(
    2,
    '0'
  )}`;
}

/** `8:30` — hours, then minutes, which must be a real minute count. */
const HOURS_MINUTES = /^(\d{1,3})\s*:\s*([0-5]\d)$/;
const DECIMAL = /^\d{1,3}(\.\d{1,4})?$/;

/**
 * Read what someone typed into the hours field, in either format they might
 * reach for: `8.5` or `8:30`. Both mean the same stored number.
 *
 * Returns null for anything that is not one of those — an empty box, a stray
 * word, `8:75`. The caller shows the field error; nothing invalid is coerced
 * to a number, because `Number('8:30')` is NaN and NaN hours silently books a
 * day of work as nothing.
 */
export function parseHours(input: unknown): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? input : null;
  }

  if (typeof input !== 'string') {
    return null;
  }

  const text = input.trim();

  const hm = HOURS_MINUTES.exec(text);
  if (hm) {
    return Number(hm[1]) + Number(hm[2]) / 60;
  }

  return DECIMAL.test(text) ? Number(text) : null;
}
