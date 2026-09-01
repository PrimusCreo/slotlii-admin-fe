import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * MiniBar — inline SVG sparkbar for a `[{ date, count }, …]` array.
 *
 * No external chart library on purpose: keeps the admin bundle lean
 * and renders instantly on the Usage tab. Bars scale to the max value
 * in the series; hovering a bar shows the date + count via native
 * SVG <title> tooltips.
 *
 * `height` is a fixed pixel value (default 48). Width is 100% of the
 * parent — the SVG scales with viewBox.
 */
export function MiniBar({ data, height = 48, className, emptyLabel = 'No activity yet' }) {
  const { bars, max, total } = useMemo(() => {
    const values = (data || []).map((d) => Number(d.count) || 0);
    return {
      bars: data || [],
      max: values.length ? Math.max(...values, 1) : 1,
      total: values.reduce((sum, n) => sum + n, 0),
    };
  }, [data]);

  if (!bars.length || total === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground',
          className,
        )}
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  // Compute layout in a fixed 100×h viewBox so the SVG stretches
  // cleanly to any container width. Bars are 1px apart.
  const gap = 1;
  const barW = (100 - gap * (bars.length - 1)) / bars.length;

  return (
    <svg
      role="img"
      aria-label="Daily activity"
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={cn('block w-full', className)}
      style={{ height }}
    >
      {bars.map((d, i) => {
        const h = Math.max(1, (Number(d.count) / max) * (height - 4));
        const x = i * (barW + gap);
        const y = height - h;
        return (
          <rect
            key={d.date || i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={Math.min(0.5, barW / 4)}
            className="fill-primary/70 hover:fill-primary"
          >
            <title>{`${d.date}: ${d.count}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export default MiniBar;
