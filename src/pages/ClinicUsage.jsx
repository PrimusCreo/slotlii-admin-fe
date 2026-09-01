import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ExternalLink,
  FileText,
  IndianRupee,
  MessageCircle,
  UserRound,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BreakdownBar } from '@/components/analytics/BreakdownBar';
import { MiniBar } from '@/components/analytics/MiniBar';
import { WindowSwitcher } from '@/components/analytics/WindowSwitcher';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '@/lib/format';

const DOC_TYPES = [
  { key: 'consultation', label: 'Consultations' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'report', label: 'Reports' },
  { key: 'consent', label: 'Consents' },
];

const STATUS_COLORS = {
  BOOKED: 'bg-sky-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-amber-500',
};

const SOURCE_COLORS = {
  CHATBOT: 'bg-sky-500',
  PORTAL: 'bg-primary',
  WALK_IN: 'bg-violet-500',
  unknown: 'bg-muted-foreground/40',
};

const ROLE_LABEL = {
  admin: 'Admin',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

const ROLE_VARIANT = {
  admin: 'soft',
  doctor: 'info',
  receptionist: 'secondary',
};

/**
 * ClinicUsage — full per-clinic analytics tab. Fetches its own data
 * whenever `clinicId` or `windowDays` changes.
 */
export default function ClinicUsage({ clinicId }) {
  const [windowDays, setWindowDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const res = await api.adminGetClinicAnalytics(clinicId, {
        windowDays,
      });
      setData(res.data.data || null);
    } catch (err) {
      console.error('Clinic analytics load failed:', err);
      toast.error('Failed to load usage analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clinicId, windowDays]);

  useEffect(() => {
    load();
  }, [load]);

  const clinic = data?.clinic;
  const appts = clinic?.appointments;
  const patients = clinic?.patients;
  const documents = clinic?.documents;
  const users = clinic?.users;
  const bills = clinic?.bills;

  const kpis = useMemo(() => {
    if (!clinic) return [];
    return [
      {
        label: `Appointments · ${windowDays}d`,
        value: formatNumber(appts?.inWindow),
        hint: `${formatPercent(appts?.byStatus?.COMPLETED, appts?.inWindow)} completed`,
        icon: CalendarCheck,
      },
      {
        label: 'Patients',
        value: formatNumber(patients?.total),
        hint: `${patients?.newInWindow || 0} new · ${patients?.returning || 0} returning`,
        icon: UserRound,
      },
      {
        label: 'Documents shared',
        value: formatNumber(documents?.shared),
        hint: `${documents?.signed || 0} signed`,
        icon: FileText,
      },
      {
        label: 'Staff users',
        value: formatNumber(users?.total),
        hint: `${users?.active || 0} active`,
        icon: Users,
      },
      {
        label: `Revenue · ${windowDays}d`,
        value: formatCurrency(bills?.collectedInWindow),
        hint: `${formatCurrency(bills?.outstanding)} outstanding`,
        icon: IndianRupee,
      },
      {
        label: 'WhatsApp',
        value: clinic.whatsappActive ? 'Active' : 'Inactive',
        hint: clinic.whatsappNumber || (clinic.whatsappStatus || '').replace(/_/g, ' '),
        icon: MessageCircle,
        tone: clinic.whatsappActive ? 'success' : undefined,
      },
    ];
  }, [clinic, appts, patients, documents, users, bills, windowDays]);

  const statusBreakdown = useMemo(() => {
    if (!appts?.byStatus) return [];
    return Object.entries(appts.byStatus).map(([key, count]) => ({
      key,
      label: key.replace('_', '-').toLowerCase(),
      count,
      colorClass: STATUS_COLORS[key] || 'bg-primary',
    }));
  }, [appts]);

  const sourceBreakdown = useMemo(() => {
    if (!appts?.bySource) return [];
    const labels = {
      CHATBOT: 'Chatbot',
      PORTAL: 'Portal',
      WALK_IN: 'Walk-in',
      unknown: 'Unknown',
    };
    return Object.entries(appts.bySource).map(([key, count]) => ({
      key,
      label: labels[key] || key,
      count,
      colorClass: SOURCE_COLORS[key] || 'bg-primary',
    }));
  }, [appts]);

  const typeBreakdown = useMemo(() => {
    if (!appts?.byType) return [];
    return Object.entries(appts.byType).map(([key, count]) => ({
      key,
      label: key === 'WALK_IN' ? 'Walk-in' : 'Scheduled',
      count,
      colorClass: key === 'WALK_IN' ? 'bg-violet-500' : 'bg-primary',
    }));
  }, [appts]);

  const returningRate = formatPercent(patients?.returning, patients?.total);
  const consentRate =
    data?.consent?.conversionRate != null
      ? `${data.consent.conversionRate}%`
      : '—';

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <Card>
        <CardContent className="py-14 text-center text-sm text-muted-foreground">
          Usage data unavailable
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Window switcher — mirrors the Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Snapshot for the last <span className="font-medium text-foreground">{windowDays} days</span>
        </div>
        <WindowSwitcher value={windowDays} onChange={setWindowDays} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            hint={k.hint}
            icon={k.icon}
            tone={k.tone}
          />
        ))}
      </div>

      {/* Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Appointments</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatNumber(appts?.inWindow)} in window · {formatNumber(appts?.total)} lifetime
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                By status
              </div>
              <BreakdownBar items={statusBreakdown} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                By source
              </div>
              <BreakdownBar items={sourceBreakdown} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Scheduled vs walk-in
              </div>
              <BreakdownBar items={typeBreakdown} />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Daily volume ({windowDays}d)
              </div>
              <MiniBar data={data?.appointmentsTrend || []} height={72} />
            </div>
          </div>

          {(data?.doctorLoad || []).length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Doctor load
              </div>
              <StatusPillRow
                items={data.doctorLoad.map((d) => ({
                  key: d.doctorId,
                  label: d.name,
                  count: d.count,
                  variant: 'soft',
                  tooltip: d.specialization
                    ? `${d.name} · ${d.specialization}: ${d.count}`
                    : `${d.name}: ${d.count}`,
                }))}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Two-column: Patients + Documents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Patients</CardTitle>
            <p className="text-xs text-muted-foreground">
              {returningRate} returning rate
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold tabular-nums">
                  {formatNumber(patients?.total)}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-primary">
                  {formatNumber(patients?.newInWindow)}
                </div>
                <div className="text-xs text-muted-foreground">
                  New · {windowDays}d
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-emerald-600">
                  {formatNumber(patients?.returning)}
                </div>
                <div className="text-xs text-muted-foreground">Returning</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Documents</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(documents?.shared)} shared · {formatNumber(documents?.signed)} signed
                </p>
              </div>
              {data?.consent?.avgHoursToSign != null ? (
                <Badge variant="soft" className="font-normal">
                  {consentRate} consent · avg {data.consent.avgHoursToSign}h to sign
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Shared</TableHead>
                  <TableHead className="text-right">Signed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DOC_TYPES.map((t) => {
                  const row = documents?.byType?.[t.key] || {
                    count: 0,
                    shared: 0,
                    signed: 0,
                  };
                  return (
                    <TableRow key={t.key}>
                      <TableCell className="font-medium">{t.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.count)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.shared)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.signed)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Staff users</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatNumber(users?.total)} total · {formatNumber(users?.active)} active
              </p>
            </div>
            <StatusPillRow
              items={Object.entries(users?.byRole || {}).map(([role, count]) => ({
                key: role,
                label: ROLE_LABEL[role] || role,
                count,
                variant: ROLE_VARIANT[role] || 'secondary',
              }))}
              size="xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(data?.staff || []).length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No staff yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.staff || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div>{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ROLE_VARIANT[s.role] || 'secondary'}
                        className="font-normal capitalize"
                      >
                        {ROLE_LABEL[s.role] || s.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="success" className="font-normal">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-normal">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(s.lastLoginAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Two-column: Bills + WhatsApp */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Billing</CardTitle>
            <p className="text-xs text-muted-foreground">
              Collected in the last {windowDays} days
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Collected · {windowDays}d
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
                  {formatCurrency(bills?.collectedInWindow)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Outstanding
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatCurrency(bills?.outstanding)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <StatusPillRow
                items={Object.entries(bills?.byStatus || {}).map(
                  ([status, count]) => ({
                    key: status,
                    label: status.replace('_', ' ').toLowerCase(),
                    count,
                    variant:
                      status === 'PAID'
                        ? 'success'
                        : status === 'CANCELLED'
                          ? 'danger'
                          : status === 'UNPAID'
                            ? 'warning'
                            : 'secondary',
                  }),
                )}
                size="xs"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">WhatsApp</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {data?.whatsapp
                    ? `${formatNumber(data.whatsapp.totals?.inbound)} in · ${formatNumber(data.whatsapp.totals?.outbound)} out`
                    : 'Usage unavailable'}
                </p>
              </div>
              <Link
                to={`/whatsapp/clinics/${clinicId}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Full ops
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.whatsapp ? (
              <>
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Daily messages
                  </div>
                  <MiniBar
                    data={(data.whatsapp.byDay || []).map((d) => ({
                      date: d.date,
                      count: (d.in || 0) + (d.out || 0),
                    }))}
                    height={64}
                    emptyLabel="No WhatsApp activity"
                  />
                </div>
                {(data.whatsapp.byTemplate || []).length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Top templates
                    </div>
                    <StatusPillRow
                      items={data.whatsapp.byTemplate.slice(0, 8).map((t) => ({
                        key: t.name,
                        label: t.name,
                        count: t.count,
                        variant: 'secondary',
                      }))}
                      size="xs"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                WhatsApp usage isn't available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
