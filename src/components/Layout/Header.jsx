import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import NotificationBell from './NotificationBell';

const PARENT_MAP = {
  clinics: { label: 'Clinics', path: '/clinics' },
  whatsapp: { label: 'WhatsApp', path: '/whatsapp' },
  'api-status': { label: 'API Status', path: '/api-status' },
  settings: { label: 'Settings', path: '/settings' },
};

function buildCrumbs(pathname, title) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return [{ label: title }];
  const parent = PARENT_MAP[segments[0]];
  if (!parent) return [{ label: title }];
  return [{ label: parent.label, path: parent.path }, { label: title }];
}

export default function Header({ title, onMenuClick }) {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname, title);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md md:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 ? (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                ) : null}
                {!isLast && crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className="truncate font-semibold text-foreground"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
