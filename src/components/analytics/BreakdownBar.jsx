import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * BreakdownBar — horizontal segmented bar showing the share of each
 * `{ key, label, count, colorClass }` entry in a total.
 *
 * Used for appointment-status donuts (drawn as a flat bar because it
 * stacks and reads faster on a dashboard row), consent conversion, and
 * any "N of M" split. Zero-count segments collapse silently so the
 * bar is always fully-populated visually.
 *
 * Colors come from Tailwind utility classes on the segment (e.g.
 * `bg-emerald-500`), not inline styles, so the palette stays theme-
 * aware and can be tweaked from tailwind config.
 */
export function BreakdownBar({ items, className, height = 10, showLegend = true }) {
  const { visible, total } = useMemo(() => {
    const filtered = (items || []).filter((it) => (it.count ?? 0) > 0);
    const sum = filtered.reduce((s, it) => s + it.count, 0);
    return { visible: filtered, total: sum };
  }, [items]);

  if (!visible.length || total === 0) {
    return (
      <div className={cn('text-xs text-muted-foreground', className)}>
        No data
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className="flex w-full overflow-hidden rounded-full bg-muted"
        style={{ height }}
      >
        {visible.map((it) => {
          const pct = (it.count / total) * 100;
          return (
            <div
              key={it.key || it.label}
              className={cn('h-full', it.colorClass || 'bg-primary')}
              style={{ width: `${pct}%` }}
              title={`${it.label}: ${it.count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      {showLegend ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {visible.map((it) => {
            const pct = (it.count / total) * 100;
            return (
              <div
                key={it.key || it.label}
                className="flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    'inline-block h-2.5 w-2.5 rounded-sm',
                    it.colorClass || 'bg-primary',
                  )}
                />
                <span className="text-muted-foreground">{it.label}</span>
                <span className="tabular-nums font-medium text-foreground">
                  {it.count}
                </span>
                <span className="text-muted-foreground">
                  ({pct.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default BreakdownBar;
