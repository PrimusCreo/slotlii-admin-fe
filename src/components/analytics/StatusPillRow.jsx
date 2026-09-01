import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * StatusPillRow — inline row of small `{ label, count, variant }` pills.
 * Used inside the fleet table row for "booked / completed / cancelled /
 * no-show" style breakdowns where a badge cluster is more scannable
 * than a comma-separated string.
 *
 * Zero-count entries are hidden by default so a clinic with only
 * BOOKED appointments doesn't render 3 dead pills. Pass
 * `hideZero={false}` to force-render everything (useful for legends).
 */
export function StatusPillRow({ items, className, hideZero = true, size = 'sm' }) {
  const visible = (items || []).filter(
    (item) => !hideZero || (item.count ?? 0) > 0,
  );

  if (visible.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visible.map((item) => (
        <Badge
          key={item.key || item.label}
          variant={item.variant || 'secondary'}
          className={cn(
            'gap-1 font-medium',
            size === 'xs' && 'text-[10px] px-1.5 py-0',
          )}
          title={item.tooltip || `${item.label}: ${item.count}`}
        >
          <span>{item.label}</span>
          <span className="tabular-nums opacity-80">{item.count}</span>
        </Badge>
      ))}
    </div>
  );
}

export default StatusPillRow;
