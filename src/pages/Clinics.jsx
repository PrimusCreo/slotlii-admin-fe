import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  Edit2,
  Mail,
  MailCheck,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
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

const emptyForm = {
  email: '',
  name: '',
  phone: '',
  address: '',
  slotDuration: '30',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
};

export default function Clinics() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [inviteSentModal, setInviteSentModal] = useState(null);

  useEffect(() => {
    loadClinics();
  }, []);

  async function loadClinics() {
    setLoading(true);
    try {
      const res = await api.getClinics();
      setClinics(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clinics');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingClinic(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEditModal(clinic) {
    setEditingClinic(clinic);
    setForm({
      email: clinic.credentials?.email || '',
      name: clinic.name,
      phone: clinic.phone || '',
      address: clinic.address || '',
      slotDuration: String(clinic.slotDuration || 30),
      workingHoursStart: clinic.workingHours?.start || '09:00',
      workingHoursEnd: clinic.workingHours?.end || '18:00',
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const basePayload = {
      name: form.name,
      phone: form.phone || undefined,
      address: form.address,
      slotDuration: parseInt(form.slotDuration, 10),
      workingHours: { start: form.workingHoursStart, end: form.workingHoursEnd },
    };

    try {
      if (editingClinic) {
        await api.updateClinic(editingClinic._id, basePayload);
        toast.success('Clinic updated successfully');
        setShowModal(false);
        loadClinics();
      } else {
        const res = await api.inviteClinic({ ...basePayload, email: form.email });
        const data = res.data?.data;
        setShowModal(false);
        setInviteSentModal({
          email: data?.invite?.email || form.email,
          clinicName: data?.invite?.clinicName || form.name,
          expiresAt: data?.invite?.expiresAt,
        });
        loadClinics();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(clinic, e) {
    e.stopPropagation();
    if (!window.confirm(`Deactivate ${clinic.name}? This cannot be undone.`)) return;
    try {
      await api.deleteClinic(clinic._id);
      toast.success('Clinic deactivated');
      loadClinics();
    } catch {
      toast.error('Failed to deactivate clinic');
    }
  }

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      (c.phone || '').includes(search) ||
      (c.credentials?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <Layout title="Clinics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clinics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage all registered dental clinics
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus /> Add clinic
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative w-full sm:w-[320px]">
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
            <span className="ml-auto text-sm text-muted-foreground">
              {filtered.length} clinic{filtered.length !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Building2 className="size-5" />
                </div>
                <p className="text-sm font-medium">No clinics found</p>
                <Button size="sm" onClick={openCreateModal}>
                  Invite your first clinic
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Working hours</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px] text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((clinic) => (
                    <TableRow
                      key={clinic._id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/clinics/${clinic._id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Building2 className="size-4" />
                          </div>
                          <span>{clinic.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.credentials?.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="size-3" />
                            {clinic.credentials.email}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {clinic.phone ? (
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Phone className="size-3" />
                            {clinic.phone}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="size-3" />
                          {clinic.workingHours?.start} – {clinic.workingHours?.end}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {clinic.slotDuration} min
                      </TableCell>
                      <TableCell>
                        {clinic.isActive ? (
                          <Badge variant="success" className="font-normal">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="font-normal">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => openEditModal(clinic)}
                            aria-label={`Edit ${clinic.name}`}
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={(e) => handleDelete(clinic, e)}
                            aria-label={`Deactivate ${clinic.name}`}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClinic ? 'Edit clinic' : 'Invite a clinic'}
            </DialogTitle>
            <DialogDescription>
              {editingClinic
                ? 'Update clinic profile, hours, and slot duration.'
                : "We'll email the owner an invite link. The clinic is created only after they accept and set their password."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingClinic ? (
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Owner email *</Label>
                <Input
                  id="c-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="owner@clinic.com"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="c-name">Clinic name *</Label>
              <Input
                id="c-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Bright Smile Dental"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">Phone</Label>
                <Input
                  id="c-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g. 15551234567"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-slot">Slot duration</Label>
                <Select
                  value={form.slotDuration}
                  onValueChange={(v) => setForm({ ...form, slotDuration: v })}
                >
                  <SelectTrigger id="c-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-address">Address</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 123 Main St, City"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-start">Working hours start</Label>
                <Input
                  id="c-start"
                  type="time"
                  value={form.workingHoursStart}
                  onChange={(e) =>
                    setForm({ ...form, workingHoursStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-end">Working hours end</Label>
                <Input
                  id="c-end"
                  type="time"
                  value={form.workingHoursEnd}
                  onChange={(e) =>
                    setForm({ ...form, workingHoursEnd: e.target.value })
                  }
                />
              </div>
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
                {editingClinic
                  ? submitting
                    ? 'Saving…'
                    : 'Save changes'
                  : submitting
                    ? 'Sending invite…'
                    : 'Send invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!inviteSentModal}
        onOpenChange={(o) => (!o ? setInviteSentModal(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck className="size-4 text-primary" />
              Invite sent
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  We emailed an invite link to{' '}
                  <strong className="text-foreground">
                    {inviteSentModal?.email}
                  </strong>
                  .
                </p>
                <p>
                  {inviteSentModal?.clinicName ? (
                    <>
                      <strong className="text-foreground">
                        {inviteSentModal.clinicName}
                      </strong>{' '}
                      will appear in this list
                    </>
                  ) : (
                    'The clinic will appear in this list'
                  )}{' '}
                  once the user clicks the link, sets their password, and finishes
                  account creation.
                  {inviteSentModal?.expiresAt ? (
                    <>
                      {' '}The link expires on{' '}
                      <strong className="text-foreground">
                        {new Date(inviteSentModal.expiresAt).toLocaleString()}
                      </strong>
                      .
                    </>
                  ) : null}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setInviteSentModal(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
