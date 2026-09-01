/**
 * Billing presentation helpers, shared by the Plans and Subscriptions screens.
 *
 * Purely presentational — the plan catalog itself comes from the API, since it
 * lives in the database and an admin can change it at any time. Nothing about
 * pricing, limits or feature keys is duplicated here.
 */

/** Rs 1,50,000 — Indian digit grouping, no decimals since Slotlii has no paise. */
export function formatRupees(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** 1.2 GB / 340 MB / 0 B — one decimal place once we're past kilobytes. */
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  const value = n / 1024 ** i;
  return `${value.toFixed(i <= 1 ? 0 : 1)} ${units[i]}`;
}

/** A limit for display. `null` is unlimited, which is not the same as zero. */
export function formatLimit(limitKey, value) {
  if (value === null || value === undefined) return 'Unlimited';
  if (limitKey === 'maxStorageBytes') return formatBytes(value);
  return Number(value).toLocaleString('en-IN');
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Badge variant and label per subscription status. Only `trialing` and `active`
 * grant write access, so everything else reads as a warning or worse — the
 * colour is the fastest way to spot a soft-locked clinic in a long table.
 */
export const STATUS_STYLES = {
  trialing: { label: 'Trialing', variant: 'info' },
  active: { label: 'Active', variant: 'success' },
  bank_approval_pending: { label: 'Bank approval', variant: 'warning' },
  past_due: { label: 'Past due', variant: 'warning' },
  on_hold: { label: 'Paused', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  expired: { label: 'Expired', variant: 'danger' },
  none: { label: 'No subscription', variant: 'outline' },
};

export function statusStyle(status) {
  return STATUS_STYLES[status] || { label: status || '—', variant: 'outline' };
}

/** "in 12 days" / "tomorrow" / "3 days ago" — for an expiry column. */
export function describeRemaining(days) {
  if (days === null || days === undefined) return '—';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

/** `YYYY-MM-DD` for a date input, which won't accept an ISO timestamp. */
export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  // Local parts, not toISOString: a date typed as the 5th must not save as the
  // 4th for anyone west of UTC.
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
