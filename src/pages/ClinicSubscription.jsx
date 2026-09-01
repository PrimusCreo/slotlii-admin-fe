import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeIndianRupee,
  CalendarClock,
  CircleSlash,
  Clock,
  Pause,
  Play,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import {
  describeRemaining,
  formatDate,
  formatRupees,
  statusStyle,
  toDateInput,
} from '@/lib/billing';

const METHOD_LABELS = {
  cash: 'Cash',
  bank: 'Bank transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  card: 'Card',
  other: 'Other',
};

function Field({ icon: Icon, label, value, hint }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </div>
      <div className="text-sm text-foreground">{value ?? '—'}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export default function ClinicSubscription({ clinicId }) {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // 'plan' | 'trial' | 'payment'
  const [planForm, setPlanForm] = useState(null);
  const [trialForm, setTrialForm] = useState({ days: '14' });
  const [paymentForm, setPaymentForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, planRes] = await Promise.all([
        api.adminGetClinicSubscription(clinicId),
        api.adminGetPlans(),
      ]);
      setData(subRes.data.data);
      setPlans(planRes.data.data?.plans || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    load();
  }, [load]);

  const sub = data?.subscription;

  /**
   * Seeded from the current subscription, or from sensible defaults when there
   * isn't one — this dialog is also how an admin creates the first one.
   */
  function openPlanDialog() {
    setPlanForm({
      planCode: sub?.planCode || plans.find((p) => !p.isArchived)?.code || '',
      billingCycle: sub?.billingCycle || 'monthly',
      status: sub?.status || 'active',
      amount: sub?.amount ? String(sub.amount) : '',
      currentPeriodStart: toDateInput(sub?.currentPeriodStart || new Date()),
      currentPeriodEnd: toDateInput(sub?.currentPeriodEnd),
    });
    setDialog('plan');
  }

  function openPaymentDialog() {
    setPaymentForm({
      amount: sub.amount ? String(sub.amount) : '',
      method: 'bank',
      paidAt: toDateInput(new Date()),
      periodEnd: '',
      reference: '',
      note: '',
    });
    setDialog('payment');
  }

  /**
   * Every action here re-renders from the response, then reloads to pick up the
   * payment ledger and anything the backend derived that the summary omits.
   */
  async function run(action, successMessage) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      setDialog(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'The change could not be saved');
    } finally {
      setBusy(false);
    }
  }

  function submitPlan(e) {
    e.preventDefault();
    run(
      () => api.adminSetClinicSubscription(clinicId, planForm),
      'Subscription updated',
    );
  }

  function submitTrial(e) {
    e.preventDefault();
    run(
      () => api.adminAdjustClinicTrial(clinicId, { days: trialForm.days }),
      `Trial extended by ${trialForm.days} days`,
    );
  }

  function submitPayment(e) {
    e.preventDefault();
    run(
      () =>
        api.adminRecordClinicPayment(clinicId, {
          ...paymentForm,
          periodEnd: paymentForm.periodEnd || undefined,
        }),
      'Payment recorded and the plan extended',
    );
  }

  function lifecycle(action, confirmMessage, successMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    run(
      () => api.adminSetClinicSubscriptionLifecycle(clinicId, action),
      successMessage,
    );
  }

  /**
   * A function rather than inline JSX because both the normal view and the
   * "no subscription yet" empty state need it — assigning a plan is how the
   * subscription document gets created in the first place.
   */
  function planDialog() {
    return (
      <Dialog open={dialog === 'plan'} onOpenChange={(o) => (!o ? setDialog(null) : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Change plan or dates</DialogTitle>
            <DialogDescription>
              This marks the clinic as billed offline, so nothing will auto-renew — you
              set when it expires.
            </DialogDescription>
          </DialogHeader>

          {planForm ? (
            <form onSubmit={submitPlan} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-plan">Plan</Label>
                  <Select
                    value={planForm.planCode}
                    onValueChange={(v) => {
                      // Reset the amount to the new tier's list price, so a figure
                      // typed for the old tier isn't carried over by accident.
                      const plan = plans.find((p) => p.code === v);
                      setPlanForm({
                        ...planForm,
                        planCode: v,
                        amount: String(
                          plan?.pricing?.[planForm.billingCycle]?.amount ?? '',
                        ),
                      });
                    }}
                  >
                    <SelectTrigger id="s-plan">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sellablePlans.map((plan) => (
                        <SelectItem key={plan.code} value={plan.code}>
                          {plan.name}
                          {plan.isArchived ? ' (archived)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-cycle">Billing cycle</Label>
                  <Select
                    value={planForm.billingCycle}
                    onValueChange={(v) => {
                      const plan = plans.find((p) => p.code === planForm.planCode);
                      setPlanForm({
                        ...planForm,
                        billingCycle: v,
                        amount: String(plan?.pricing?.[v]?.amount ?? ''),
                      });
                    }}
                  >
                    <SelectTrigger id="s-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-amount">Amount</Label>
                  <Input
                    id="s-amount"
                    type="number"
                    min="0"
                    value={planForm.amount}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, amount: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Override for a negotiated deal.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-status">Status</Label>
                  <Select
                    value={planForm.status}
                    onValueChange={(v) => setPlanForm({ ...planForm, status: v })}
                  >
                    <SelectTrigger id="s-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="on_hold">Paused</SelectItem>
                      <SelectItem value="past_due">Past due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only active and trialing allow writes.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="s-start">Starts on</Label>
                  <Input
                    id="s-start"
                    type="date"
                    value={planForm.currentPeriodStart}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, currentPeriodStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-end">Expires on</Label>
                  <Input
                    id="s-end"
                    type="date"
                    value={planForm.currentPeriodEnd}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, currentPeriodEnd: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The clinic soft-locks the day after this.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const badge = statusStyle(sub?.status);
  const expiresAt = sub?.isTrialing ? sub.trialEndsAt : sub?.currentPeriodEnd;
  const daysRemaining = sub?.isTrialing
    ? sub.trialDaysRemaining
    : expiresAt
      ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
      : null;
  // An archived tier stays selectable for a clinic already on it, so an admin
  // editing its dates doesn't get silently moved off it.
  const sellablePlans = plans.filter((p) => !p.isArchived || p.code === sub?.planCode);

  // No subscription document yet — this clinic pre-dates the feature, or hasn't
  // opened its own billing page. Assigning a plan is what creates it.
  if (!sub) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Receipt className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No subscription yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This clinic has no plan on record. Assign one to set its access and
                expiry.
              </p>
            </div>
            <Button onClick={openPlanDialog} disabled={busy}>
              Set up a plan
            </Button>
          </CardContent>
        </Card>
        {planDialog()}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {!sub.isActive ? (
        <Card className="border-[color:var(--status-cancelled)]/30 bg-[color:var(--status-cancelled-bg)]/40">
          <CardContent className="flex items-start gap-2.5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--status-cancelled)]" />
            <p>
              This clinic is soft-locked. Its staff can still read everything, but they
              can't add appointments, patients or records until the subscription is
              active again.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Current plan</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant} className="font-normal">
              {badge.label}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {sub.managedBy === 'admin' ? 'Billed offline' : 'Cashfree auto-debit'}
            </Badge>
            {sub.planArchived ? (
              <Badge variant="outline" className="font-normal">
                Archived tier
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field
              icon={ShieldCheck}
              label="Plan"
              value={sub.planName}
              hint={sub.billingCycle === 'yearly' ? 'Billed yearly' : 'Billed monthly'}
            />
            <Field
              icon={BadgeIndianRupee}
              label="Amount"
              value={sub.amount ? formatRupees(sub.amount) : '—'}
              hint={
                sub.isLegacyPrice
                  ? `Legacy price — this tier now lists at ${formatRupees(sub.listAmount)}`
                  : null
              }
            />
            <Field
              icon={CalendarClock}
              label={sub.isTrialing ? 'Trial ends' : 'Period ends'}
              value={formatDate(expiresAt)}
              hint={describeRemaining(daysRemaining)}
            />
            <Field
              icon={Clock}
              label="Period started"
              value={formatDate(sub.currentPeriodStart)}
            />
            <Field label="Price version" value={`v${sub.planVersion}`} />
            <Field
              label="Cancels at period end"
              value={sub.cancelAtPeriodEnd ? 'Yes' : 'No'}
            />
            <Field
              label="Mandate"
              value={sub.cashfreeSubscriptionId ? sub.cashfreeStatus || 'Present' : 'None'}
              hint={sub.cashfreeSubscriptionId || null}
            />
            <Field
              label="Last webhook"
              value={sub.lastWebhookAt ? formatDate(sub.lastWebhookAt) : '—'}
            />
          </div>

          {sub.pendingChange ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              The clinic started a checkout for{' '}
              <span className="font-medium text-foreground">
                {sub.pendingChange.planCode} ({sub.pendingChange.billingCycle})
              </span>{' '}
              that hasn't been paid yet. It will take effect on the first successful
              debit.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={openPlanDialog} disabled={busy}>
              Change plan or dates
            </Button>
            <Button variant="outline" onClick={() => setDialog('trial')} disabled={busy}>
              <CalendarClock /> Extend trial
            </Button>
            <Button variant="outline" onClick={openPaymentDialog} disabled={busy}>
              <Receipt /> Record payment
            </Button>
            {sub.status === 'on_hold' || sub.status === 'cancelled' ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  lifecycle('reactivate', null, 'Subscription reactivated')
                }
              >
                <Play /> Reactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  lifecycle(
                    'pause',
                    'Pause this subscription? The clinic loses write access until it is resumed.',
                    'Subscription paused',
                  )
                }
              >
                <Pause /> Pause
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                lifecycle(
                  'cancel',
                  'Cancel this subscription now? The clinic immediately loses write access, and any payment mandate is cancelled at Cashfree.',
                  'Subscription cancelled',
                )
              }
            >
              <CircleSlash /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.payments.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No payments recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paid</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Covers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((payment) => {
                  const offline = String(payment.paymentMethod || '').startsWith(
                    'offline_',
                  );
                  return (
                    <TableRow key={payment._id}>
                      <TableCell className="tabular-nums">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {formatRupees(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.planCode}
                        <span className="text-xs"> · {payment.billingCycle}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {offline
                          ? `Offline · ${
                              METHOD_LABELS[payment.paymentMethod.slice(8)] ||
                              payment.paymentMethod.slice(8)
                            }`
                          : payment.paymentMethod || 'Auto-debit'}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {payment.periodStart || payment.periodEnd
                          ? `${formatDate(payment.periodStart)} – ${formatDate(payment.periodEnd)}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'success'
                              ? 'success'
                              : payment.status === 'pending'
                                ? 'warning'
                                : 'danger'
                          }
                          className="font-normal capitalize"
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {planDialog()}

      <Dialog open={dialog === 'trial'} onOpenChange={(o) => (!o ? setDialog(null) : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend the trial</DialogTitle>
            <DialogDescription>
              Days are added to whichever is later — today, or the current trial end. A
              lapsed trial is reopened.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitTrial} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="t-days">Extend by (days)</Label>
              <Input
                id="t-days"
                type="number"
                min="1"
                required
                value={trialForm.days}
                onChange={(e) => setTrialForm({ days: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Currently{' '}
                {sub.trialEndsAt
                  ? `ends ${formatDate(sub.trialEndsAt)}`
                  : 'no trial on record'}
                .
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Extend trial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === 'payment'}
        onOpenChange={(o) => (!o ? setDialog(null) : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record an offline payment</DialogTitle>
            <DialogDescription>
              For money collected outside Slotlii. This extends the plan by one billing
              cycle unless you set an end date.
            </DialogDescription>
          </DialogHeader>

          {paymentForm ? (
            <form onSubmit={submitPayment} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-amount">Amount *</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min="0"
                    required
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-method">Method</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}
                  >
                    <SelectTrigger id="pay-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pay-date">Received on</Label>
                  <Input
                    id="pay-date"
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paidAt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-until">Covers until</Label>
                  <Input
                    id="pay-until"
                    type="date"
                    value={paymentForm.periodEnd}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, periodEnd: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to add one{' '}
                    {sub?.billingCycle === 'yearly' ? 'year' : 'month'}.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-ref">Reference</Label>
                <Input
                  id="pay-ref"
                  value={paymentForm.reference}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, reference: e.target.value })
                  }
                  placeholder="e.g. UTR or cheque number"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-note">Note</Label>
                <Textarea
                  id="pay-note"
                  rows={2}
                  value={paymentForm.note}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, note: e.target.value })
                  }
                  placeholder="Anything worth remembering about this payment"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialog(null)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Record payment'}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
