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
