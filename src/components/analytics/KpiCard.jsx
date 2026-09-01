import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

/**
 * KpiCard — dead-simple single-metric card for the analytics KPI strip.
 *
 * value/label are the primary content. `hint` renders as a small caption
 * under the value (e.g. "vs prev 30d" or "42% returning"). `icon` is an
 * optional lucide icon rendered top-right in a soft primary chip.
 *
 * Keep this presentational — the value is expected to already be
 * formatted (currency, percent, etc.). Number formatting lives in the
 * page/section that owns the data.
 */
export function KpiCard({ label, value, hint, icon: Icon, className, tone }) {
  const toneRing =
    tone === 'success'
      ? 'ring-emerald-500/20'
      : tone === 'danger'
        ? 'ring-red-500/20'
        : tone === 'warning'
          ? 'ring-amber-500/20'
          : 'ring-border';

  return (
    <Card className={cn('ring-1 shadow-none', toneRing, className)}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 truncate text-2xl font-semibold tabular-nums text-foreground">
            {value ?? '—'}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default KpiCard;
