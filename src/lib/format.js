/**
 * Shared display formatters for the admin analytics surfaces.
 *
 * INR is the assumed currency for revenue metrics — matches how the
 * client-fe billing screens format Bill totals. Change here when the
 * platform goes multi-currency.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const COMPACT = new Intl.NumberFormat('en-IN', { notation: 'compact' });
const INT = new Intl.NumberFormat('en-IN');

/** ₹1,23,456 — 0 fraction digits so KPI cards stay scannable. */
export function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return INR.format(n);
}

/** Compact locale-aware number (1.2K / 3.4M) for tight table cells. */
export function formatCompactNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return COMPACT.format(n);
}

/** Full-precision integer with thousand separators. */
export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return INT.format(n);
}

/** `value / total` as a whole-percent string (e.g. "42%"). Blank when total = 0. */
export function formatPercent(value, total, { fractionDigits = 0 } = {}) {
  const v = Number(value);
  const t = Number(total);
  if (!Number.isFinite(v) || !Number.isFinite(t) || t <= 0) return '—';
  const pct = (v / t) * 100;
  return `${pct.toFixed(fractionDigits)}%`;
}

/** "just now" / "5 min ago" / "3 days ago" — tuned for the staff list. */
export function formatRelativeTime(input) {
  if (!input) return '—';
  const then = new Date(input);
  if (Number.isNaN(then.getTime())) return '—';
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
