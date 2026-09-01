import { useState } from 'react';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Placeholder notification bell for the admin dashboard. Renders the
 * same UI shape as slotlii-client-fe's NotificationBell but doesn't
 * wire up to any live notification stream yet — admin-fe has no
 * notification backend today. Kept as a stub so the header layout
 * matches client-fe exactly and we can hook it up later without
 * touching the shell.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Notifications</span>
            <span className="text-xs text-muted-foreground">
              You are all caught up
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Bell className="size-4" />
          </div>
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="text-xs text-muted-foreground">
            Admin notifications will show up here in the future.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
