import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Search, X } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '../components/Layout/Layout';
import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  describeRemaining,
  formatDate,
  formatRupees,
  statusStyle,
} from '@/lib/billing';

const ALL = 'all';

export default function Subscriptions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [planCode, setPlanCode] = useState(ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSubscriptions({
        status: status === ALL ? undefined : status,
        planCode: planCode === ALL ? undefined : planCode,
      });
      setRows(res.data.data?.subscriptions || []);
      setMeta(res.data.data?.meta || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [status, planCode]);

  useEffect(() => {
    load();
  }, [load]);

  // Search filters what's already loaded — the fleet is small enough that a
  // round trip per keystroke would only add latency.
  const filtered = rows.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      row.clinicName?.toLowerCase().includes(q) ||
      (row.email || '').toLowerCase().includes(q) ||
      (row.phone || '').includes(search)
    );
  });

  const expiringSoon = filtered.filter(
    (row) => row.daysRemaining !== null && row.daysRemaining >= 0 && row.daysRemaining <= 7,
  ).length;
  const lapsed = filtered.filter(
    (row) => !['trialing', 'active'].includes(row.status),
  ).length;

  return (
    <Layout title="Subscriptions">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every clinic's plan, status and expiry. Open one to change its plan or record
            a payment.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative w-full sm:w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 pr-9"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filter by status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {(meta?.statuses || []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusStyle(value).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={planCode} onValueChange={setPlanCode}>
              <SelectTrigger className="h-9 w-full sm:w-[180px]" aria-label="Filter by plan">
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All plans</SelectItem>
                {(meta?.plans || []).map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {plan.name}
                    {plan.isArchived ? ' (archived)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="tabular-nums">
                {filtered.length} clinic{filtered.length !== 1 ? 's' : ''}
              </span>
              {expiringSoon > 0 ? (
                <Badge variant="warning" className="font-normal tabular-nums">
                  {expiringSoon} expiring within 7 days
                </Badge>
              ) : null}
              {lapsed > 0 ? (
                <Badge variant="danger" className="font-normal tabular-nums">
                  {lapsed} without access
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CreditCard className="size-5" />
                </div>
                <p className="text-sm font-medium">No clinics match these filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => {
                    const badge = statusStyle(row.status);
                    const isOverdue = row.daysRemaining !== null && row.daysRemaining < 0;
                    return (
                      <TableRow
                        key={row.clinicId}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/clinics/${row.clinicId}?tab=billing`)
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Building2 className="size-4" />
                            </div>
                            <div className="leading-tight">
                              <div>{row.clinicName}</div>
                              {row.email ? (
                                <div className="text-xs text-muted-foreground">
                                  {row.email}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.planName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {row.billingCycle ? (
                            <div className="text-xs text-muted-foreground capitalize">
                              {row.billingCycle}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="font-normal">
                            {badge.label}
                          </Badge>
                          {row.cancelAtPeriodEnd ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Cancels at period end
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.managedBy === 'admin' ? 'Offline' : 'Auto-debit'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.amount ? formatRupees(row.amount) : '—'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <div>{formatDate(row.expiresAt)}</div>
                          <div
                            className={
                              isOverdue
                                ? 'text-xs text-[color:var(--status-cancelled)]'
                                : 'text-xs text-muted-foreground'
                            }
                          >
                            {describeRemaining(row.daysRemaining)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
