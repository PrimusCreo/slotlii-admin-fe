import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Edit2,
  Layers,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import Layout from '../components/Layout/Layout';
import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatLimit, formatRupees } from '@/lib/billing';

const emptyForm = {
  code: '',
  name: '',
  tagline: '',
  monthlyMrp: '',
  monthlyPrice: '',
  sortOrder: '100',
  popular: false,
  limits: {},
  features: {},
  featureList: '',
};

/**
 * The bullet list is edited as one line per bullet — a repeater with add and
 * remove buttons is a lot of UI for what is a short block of marketing copy.
 * A trailing "(coming soon)" maps to the `comingSoon` flag.
 */
function featureListToText(featureList = []) {
  return featureList
    .map((item) => (item.comingSoon ? `${item.label} (coming soon)` : item.label))
    .join('\n');
}

function textToFeatureList(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)\s*\(coming soon\)$/i);
      return match
        ? { label: match[1].trim(), comingSoon: true }
        : { label: line, comingSoon: false };
    });
}

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await api.adminGetPlans();
      setPlans(res.data.data?.plans || []);
      setMeta(res.data.data?.meta || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({
      ...emptyForm,
      // Start every limit and feature explicit, so a new tier can't inherit a
      // capability by accident.
      limits: Object.fromEntries((meta?.limitKeys || []).map((k) => [k, ''])),
      features: Object.fromEntries((meta?.featureKeys || []).map((k) => [k, false])),
    });
    setShowModal(true);
  }

  function openEditModal(plan) {
    setEditing(plan);
    setForm({
      code: plan.code,
      name: plan.name,
      tagline: plan.tagline || '',
      monthlyMrp: String(plan.monthlyMrp ?? ''),
      monthlyPrice: String(plan.monthlyPrice ?? ''),
      sortOrder: String(plan.sortOrder ?? 100),
      popular: Boolean(plan.popular),
      limits: Object.fromEntries(
        (meta?.limitKeys || []).map((k) => [
          k,
          plan.limits?.[k] === null || plan.limits?.[k] === undefined
            ? ''
            : String(plan.limits[k]),
        ]),
      ),
      features: Object.fromEntries(
        (meta?.featureKeys || []).map((k) => [k, Boolean(plan.features?.[k])]),
      ),
      featureList: featureListToText(plan.featureList),
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      tagline: form.tagline,
      monthlyPrice: form.monthlyPrice,
      monthlyMrp: form.monthlyMrp === '' ? 0 : form.monthlyMrp,
      sortOrder: form.sortOrder,
      popular: form.popular,
      limits: form.limits,
      features: form.features,
      featureList: textToFeatureList(form.featureList),
    };

    try {
      const res = editing
        ? await api.adminUpdatePlan(editing.code, payload)
        : await api.adminCreatePlan({ ...payload, code: form.code });

      const { warnings = [], repriced } = res.data?.data || {};
      setShowModal(false);

      if (editing) {
        toast.success(
          repriced
            ? `${form.name} repriced. Clinics already subscribed keep their old price.`
            : `${form.name} updated`,
        );
      } else {
        toast.success(`${form.name} created`);
      }
      warnings.forEach((warning) => toast.warning(warning, { duration: 10000 }));

      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save the plan');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive(plan) {
    const verb = plan.isArchived ? 'restore' : 'archive';
    const message = plan.isArchived
      ? `Put ${plan.name} back on the pricing page?`
      : `Archive ${plan.name}? It disappears from the pricing page for new signups. ` +
        `The ${plan.subscriberCount} clinic${plan.subscriberCount === 1 ? '' : 's'} on it ` +
        `keep their access and their price.`;
    if (!window.confirm(message)) return;

    try {
      if (plan.isArchived) await api.adminUnarchivePlan(plan.code);
      else await api.adminArchivePlan(plan.code);
      toast.success(plan.isArchived ? `${plan.name} restored` : `${plan.name} archived`);
      loadPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${verb} the plan`);
    }
  }

  async function handlePublish(plan) {
    try {
      const res = await api.adminPublishPlan(plan.code);
      const warnings = res.data?.data?.warnings || [];
      if (warnings.length) {
        warnings.forEach((warning) => toast.warning(warning, { duration: 10000 }));
      } else {
        toast.success(`${plan.name} published to Cashfree`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish the plan');
    }
  }

  const limitKeys = meta?.limitKeys || [];
  const featureKeys = meta?.featureKeys || [];
  // Repricing publishes a new Cashfree plan rather than editing the live one, so
  // warn before saving and say exactly how many clinics stay on the old amount.
  const willReprice =
    editing && String(form.monthlyPrice) !== String(editing.monthlyPrice ?? '');

  return (
    <Layout title="Plans">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The pricing tiers clinics can subscribe to, with their limits and features
            </p>
          </div>
          <Button onClick={openCreateModal} disabled={loading}>
            <Plus /> Add plan
          </Button>
        </div>

        {meta && !meta.paymentsEnabled ? (
          <Card className="border-[color:var(--status-noshow)]/30 bg-[color:var(--status-noshow-bg)]/40">
            <CardContent className="flex items-start gap-2.5 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--status-noshow)]" />
              <p>
                Cashfree is not configured in this environment. You can still edit tiers
                and assign them to clinics by hand, but clinics can't subscribe
                themselves until payments are set up.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Layers className="size-5" />
                </div>
                <p className="text-sm font-medium">No plans yet</p>
                <Button size="sm" onClick={openCreateModal}>
                  Create your first plan
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Monthly</TableHead>
                    <TableHead>Yearly</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Clinics</TableHead>
                    <TableHead className="w-[140px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const enabledFeatures = featureKeys.filter(
                      (key) => plan.features?.[key],
                    );
                    return (
                      <TableRow key={plan.code} className={plan.isArchived ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <Layers className="size-4" />
                            </div>
                            <div className="leading-tight">
                              <div className="flex items-center gap-1.5">
                                {plan.name}
                                {plan.popular ? (
                                  <Badge variant="soft" className="font-normal">
                                    Popular
                                  </Badge>
                                ) : null}
                                {plan.isArchived ? (
                                  <Badge variant="outline" className="font-normal">
                                    Archived
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {plan.code}
                                {plan.priceVersion > 1 ? ` · price v${plan.priceVersion}` : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <div className="font-medium">
                            {formatRupees(plan.monthlyPrice)}
                          </div>
                          {plan.monthlyMrp > plan.monthlyPrice ? (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatRupees(plan.monthlyMrp)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <div className="font-medium">
                            {formatRupees(plan.pricing?.yearly?.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRupees(plan.pricing?.yearly?.perMonth)}/mo
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{formatLimit('maxDoctors', plan.limits?.maxDoctors)} doctors</div>
                          <div>
                            {formatLimit('maxStorageBytes', plan.limits?.maxStorageBytes)} storage
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                          {enabledFeatures.length} of {featureKeys.length}
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3" />
                            {plan.subscriberCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => openEditModal(plan)}
                              aria-label={`Edit ${plan.name}`}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                            {meta?.paymentsEnabled ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={() => handlePublish(plan)}
                                aria-label={`Publish ${plan.name} to Cashfree`}
                                title="Re-publish to Cashfree"
                              >
                                <RefreshCw className="size-3.5" />
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleArchive(plan)}
                              aria-label={
                                plan.isArchived
                                  ? `Restore ${plan.name}`
                                  : `Archive ${plan.name}`
                              }
                            >
                              {plan.isArchived ? (
                                <ArchiveRestore className="size-3.5" />
                              ) : (
                                <Archive className="size-3.5" />
                              )}
                            </Button>
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add a plan'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Limits and features apply to every clinic on this tier within a minute.'
                : 'Set the price, then choose which limits and features this tier includes.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {!editing ? (
                <div className="space-y-1.5">
                  <Label htmlFor="p-code">Code *</Label>
                  <Input
                    id="p-code"
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toLowerCase() })
                    }
                    placeholder="e.g. enterprise"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers and underscores. Can't be changed later.
                  </p>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Name *</Label>
                <Input
                  id="p-name"
                  required
                  maxLength={24}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Enterprise"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-tagline">Tagline</Label>
              <Input
                id="p-tagline"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. For groups scaling to more locations"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Monthly price *</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  required
                  value={form.monthlyPrice}
                  onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                  placeholder="2999"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-mrp">Monthly MRP</Label>
                <Input
                  id="p-mrp"
                  type="number"
                  min="0"
                  value={form.monthlyMrp}
                  onChange={(e) => setForm({ ...form, monthlyMrp: e.target.value })}
                  placeholder="3999"
                />
                <p className="text-xs text-muted-foreground">Shown struck through.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-order">Sort order</Label>
                <Input
                  id="p-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Lower shows first.</p>
              </div>
            </div>

            {willReprice ? (
              <div className="flex items-start gap-2.5 rounded-md border border-[color:var(--status-noshow)]/30 bg-[color:var(--status-noshow-bg)]/40 p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--status-noshow)]" />
                <div>
                  <p className="font-medium">This changes the price</p>
                  <p className="mt-0.5 text-muted-foreground">
                    The new price applies to clinics subscribing from now on. The{' '}
                    {editing.subscriberCount} clinic
                    {editing.subscriberCount === 1 ? '' : 's'} already on {editing.name}{' '}
                    keep paying {formatRupees(editing.monthlyPrice)} a month until they
                    change plans themselves — payment mandates are bound to the price
                    they were set up with.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="p-popular">Highlight as most popular</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Draws a badge on this card on the pricing page.
                </p>
              </div>
              <Switch
                id="p-popular"
                checked={form.popular}
                onCheckedChange={(v) => setForm({ ...form, popular: v })}
              />
            </div>

            <div className="space-y-2">
              <div>
                <Label>Limits</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Leave blank for unlimited. Storage is in bytes.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {limitKeys.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`limit-${key}`} className="text-xs font-normal capitalize">
                      {meta?.limitLabels?.[key]?.plural || key}
                    </Label>
                    <Input
                      id={`limit-${key}`}
                      type="number"
                      min="0"
                      value={form.limits[key] ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          limits: { ...form.limits, [key]: e.target.value },
                        })
                      }
                      placeholder="Unlimited"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label>Features</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  These are enforced in the product, not just advertised.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {featureKeys.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md border p-2.5 text-sm"
                  >
                    <span>{meta?.featureLabels?.[key] || key}</span>
                    <Switch
                      checked={Boolean(form.features[key])}
                      onCheckedChange={(v) =>
                        setForm({
                          ...form,
                          features: { ...form.features, [key]: v },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-bullets">Pricing page bullets</Label>
              <Textarea
                id="p-bullets"
                rows={8}
                value={form.featureList}
                onChange={(e) => setForm({ ...form, featureList: e.target.value })}
                placeholder={'One bullet per line\nAdd (coming soon) to mark one as upcoming'}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
