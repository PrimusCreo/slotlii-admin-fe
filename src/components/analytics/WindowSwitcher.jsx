import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * WindowSwitcher — 7d / 30d / 90d trio used on both Dashboard and the
 * ClinicDetail Usage tab. Value is the raw day count (Number) so
 * consumers can pass it straight into the API wrapper's `windowDays`
 * param without another mapping layer.
 */
const OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

export function WindowSwitcher({ value, onChange, options = OPTIONS, className }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border bg-background p-0.5 shadow-xs',
        className,
      )}
      role="tablist"
      aria-label="Window"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Button
            key={opt.value}
            role="tab"
            aria-selected={active}
            variant={active ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'h-7 px-2.5 text-xs',
              active ? 'shadow-none' : 'text-muted-foreground',
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

export default WindowSwitcher;
