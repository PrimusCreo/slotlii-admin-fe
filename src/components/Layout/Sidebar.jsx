import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  MessageCircle,
  RadioTower,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../config/env';
import darkLogo from '../../assets/dark-logo.png';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/clinics', label: 'Clinics', icon: Building2 },
  { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { path: '/plans', label: 'Plans', icon: Layers },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { path: '/api-status', label: 'API Status', icon: RadioTower },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <img
          src={darkLogo}
          alt={APP_NAME}
          className="size-9 shrink-0 rounded-lg shadow-sm"
        />
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">{APP_NAME}</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admin Panel
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </div>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ path, label, icon: Icon, end }) => (
            <li key={path}>
              <NavLink
                to={path}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isActive &&
                      'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Separator />

      <div className="p-3">
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full justify-start gap-2 text-sm font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
