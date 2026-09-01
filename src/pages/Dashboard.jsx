import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  FileText,
  IndianRupee,
  MessageCircle,
  Search,
  Users,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import Layout from '../components/Layout/Layout';
import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KpiCard } from '@/components/analytics/KpiCard';
import { StatusPillRow } from '@/components/analytics/StatusPillRow';
import { WindowSwitcher } from '@/components/analytics/WindowSwitcher';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/format';

const APPT_STATUS_PILL = [
  { key: 'BOOKED', label: 'Booked', variant: 'info' },
  { key: 'COMPLETED', label: 'Done', variant: 'success' },
  { key: 'CANCELLED', label: 'Cancel', variant: 'danger' },
  { key: 'NO_SHOW', label: 'No-show', variant: 'warning' },
];

const APPT_SOURCE_PILL = [
  { key: 'CHATBOT', label: 'Chatbot', variant: 'info' },
  { key: 'PORTAL', label: 'Portal', variant: 'soft' },
  { key: 'WALK_IN', label: 'Walk-in', variant: 'secondary' },
  { key: 'unknown', label: 'Unknown', variant: 'outline' },
];

function statusItemsFrom(source, breakdown) {
  return source.map((entry) => ({
    ...entry,
    count: breakdown?.[entry.key] || 0,
  }));
}

function sumByStatus(breakdown, keys) {
  if (!breakdown) return 0;
  return keys.reduce((sum, k) => sum + (breakdown[k] || 0), 0);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async (days) => {
    setLoading(true);
    try {
      const res = await api.adminGetAnalyticsOverview({ windowDays: days });
      setData(res.data.data || null);
    } catch (err) {
      console.error('Dashboard analytics load failed:', err);
      toast.error('Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(windowDays);
  }, [load, windowDays]);

  const totals = data?.totals;
  // Memoise the clinics array so the filter below has a stable
  // dependency reference — otherwise `data?.clinics || []` allocates
  // a fresh array on every render and thrashes the useMemo cache.
  const clinics = useMemo(() => data?.clinics || [], [data]);

  // Fleet KPI values are derived from the `totals` block returned by
  // the API, so no client-side aggregation is needed. Falling back to
  // 0/— keeps the strip stable while the payload is loading.
  const kpiCards = useMemo(() => {
    if (!totals) return [];
    const returningRate = formatPercent(
      totals.patients?.returning,
      totals.patients?.total,
    );
    return [
      {
        label: 'Clinics',
        value: formatNumber(totals.clinics?.total),
        hint: `${totals.clinics?.active || 0} active · ${totals.clinics?.whatsappActive || 0} on WhatsApp`,
        icon: Building2,
      },
      {
        label: `Appointments · ${windowDays}d`,
        value: formatNumber(totals.appointments?.inWindow),
        hint: `${totals.appointments?.total || 0} lifetime`,
        icon: CalendarCheck,
      },
      {
        label: 'Patients',
        value: formatNumber(totals.patients?.total),
        hint: `${returningRate} returning · ${totals.patients?.newInWindow || 0} new in ${windowDays}d`,
        icon: UserRound,
      },
      {
        label: 'Documents shared',
        value: formatNumber(totals.documents?.shared),
        hint: `${totals.documents?.signed || 0} signed · ${totals.documents?.total || 0} total`,
        icon: FileText,
      },
      {
        label: 'Staff users',
        value: formatNumber(totals.users?.total),
        hint: `${totals.users?.active || 0} active`,
        icon: Users,
      },
      {
        label: `Revenue · ${windowDays}d`,
        value: formatCurrency(totals.bills?.collectedInWindow),
        hint: `${formatCurrency(totals.bills?.outstandingBalance)} outstanding`,
        icon: IndianRupee,
      },
    ];
  }, [totals, windowDays]);

  const filteredClinics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clinics;
    return clinics.filter((c) => {
      const hay = `${c.name || ''} ${c.email || ''} ${c.whatsappNumber || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [clinics, search]);

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fleet analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cross-clinic usage snapshot for the Slotlii platform
            </p>
          </div>
          <WindowSwitcher value={windowDays} onChange={setWindowDays} />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {loading && !data
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            : kpiCards.map((c) => (
                <KpiCard
                  key={c.label}
                  label={c.label}
                  value={c.value}
                  hint={c.hint}
                  icon={c.icon}
                />
              ))}
        </div>

        {/* Fleet table */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Per-clinic breakdown</div>
                <div className="text-xs text-muted-foreground">
                  Click a row for the full Usage view
                </div>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clinic or email"
                  className="pl-8"
                />
              </div>
            </div>

            {loading && !data ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Building2 className="size-5" />
                </div>
                <p className="text-sm font-medium">
                  {search ? 'No clinics match your search' : 'No clinics yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Clinic</TableHead>
                      <TableHead className="text-right">
                        Appointments
                      </TableHead>
                      <TableHead>Status split</TableHead>
                      <TableHead>Source split</TableHead>
                      <TableHead className="text-right">Patients</TableHead>
                      <TableHead className="text-right">Docs shared</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead>WhatsApp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClinics.map((c) => {
                      const apptInWindow = c.appointments?.inWindow || 0;
                      const apptStatusItems = statusItemsFrom(
                        APPT_STATUS_PILL,
                        c.appointments?.byStatus,
                      );
                      const apptSourceItems = statusItemsFrom(
                        APPT_SOURCE_PILL,
                        c.appointments?.bySource,
                      );
                      const patientsHint = `${c.patients?.newInWindow || 0} new · ${c.patients?.returning || 0} returning`;
                      const usersHint = `${c.users?.active || 0} active`;
                      const showupRate = formatPercent(
                        sumByStatus(c.appointments?.byStatus, ['COMPLETED']),
                        apptInWindow,
                      );

                      return (
                        <TableRow
                          key={c.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/clinics/${c.id}?tab=usage`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Building2 className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate">{c.name}</div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {c.email || '—'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatNumber(apptInWindow)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {showupRate === '—' ? '—' : `${showupRate} show-up`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusPillRow
                              items={apptStatusItems}
                              size="xs"
                            />
                          </TableCell>
                          <TableCell>
                            <StatusPillRow
                              items={apptSourceItems}
                              size="xs"
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatNumber(c.patients?.total)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {patientsHint}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatNumber(c.documents?.shared)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {c.documents?.signed || 0} signed
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatNumber(c.users?.total)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {usersHint}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatCurrency(c.bills?.collectedInWindow)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {formatCurrency(c.bills?.outstanding)} due
                            </div>
                          </TableCell>
                          <TableCell>
                            {c.whatsappActive ? (
                              <Badge variant="success" className="gap-1 font-normal">
                                <MessageCircle className="size-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="font-normal capitalize">
                                {(c.whatsappStatus || 'not_activated').replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
