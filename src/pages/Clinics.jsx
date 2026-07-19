import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { Plus, Search, Edit2, Trash2, Building2, Phone, Clock, MailCheck, Mail } from 'lucide-react';
import * as api from '../api';

const emptyForm = {
  email: '',
  name: '',
  phone: '',
  address: '',
  slotDuration: 30,
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
  const [toast, setToast] = useState(null);
  // Shown after a successful invite — replaces the old credentials modal
  // (admin can no longer view passwords; the user picks one via email link).
  const [inviteSentModal, setInviteSentModal] = useState(null);

  useEffect(() => {
    loadClinics();
  }, []);

  async function loadClinics() {
    try {
      const res = await api.getClinics();
      setClinics(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      slotDuration: clinic.slotDuration,
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
      slotDuration: parseInt(form.slotDuration),
      workingHours: { start: form.workingHoursStart, end: form.workingHoursEnd },
    };

    try {
      if (editingClinic) {
        await api.updateClinic(editingClinic._id, basePayload);
        showToast('Clinic updated successfully');
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
      showToast(err.response?.data?.error || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to deactivate this clinic?')) return;
    try {
      await api.deleteClinic(id);
      showToast('Clinic deactivated');
      loadClinics();
    } catch (err) {
      showToast('Failed to deactivate clinic', 'error');
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

  if (loading) {
    return (
      <Layout title="Clinics">
        <div className="loader-container"><div className="loader" /></div>
      </Layout>
    );
  }

  return (
    <Layout title="Clinics">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clinics</h1>
          <p className="page-description">Manage all registered dental clinics</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add Clinic
        </button>
      </div>

      <div className="filter-bar">
        <div className="header-search" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search clinics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {filtered.length} clinic{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 />
            <p>No clinics found</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Working Hours</th>
                <th>Slot Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((clinic) => (
                <tr
                  key={clinic._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clinics/${clinic._id}`)}
                >
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7c3aed20, #3b82f620)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Building2 size={16} style={{ color: 'var(--accent-violet)' }} />
                      </div>
                      {clinic.name}
                    </div>
                  </td>
                  <td><Mail size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{clinic.credentials?.email || '—'}</td>
                  <td>{clinic.phone ? <><Phone size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{clinic.phone}</> : '—'}</td>
                  <td><Clock size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{clinic.workingHours?.start} - {clinic.workingHours?.end}</td>
                  <td>{clinic.slotDuration} min</td>
                  <td>
                    <span className={`badge badge-${clinic.isActive ? 'active' : 'inactive'}`}>
                      {clinic.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(clinic)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(clinic._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Clinic Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingClinic ? 'Edit Clinic' : 'Invite a Clinic'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {!editingClinic && (
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="owner@clinic.com"
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                      We'll email this address an invite link. The clinic is only created once they accept and set their own password.
                    </small>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Clinic Name</label>
                  <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bright Smile Dental" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 15551234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Main St, City" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Working Hours Start</label>
                    <input className="form-input" type="time" value={form.workingHoursStart} onChange={(e) => setForm({ ...form, workingHoursStart: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Working Hours End</label>
                    <input className="form-input" type="time" value={form.workingHoursEnd} onChange={(e) => setForm({ ...form, workingHoursEnd: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Slot Duration (minutes)</label>
                  <select className="form-select" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: e.target.value })}>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {editingClinic
                    ? (submitting ? 'Saving…' : 'Save Changes')
                    : (submitting ? 'Sending Invite…' : 'Send Invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite-sent confirmation modal */}
      {inviteSentModal && (
        <div className="modal-overlay" onClick={() => setInviteSentModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <MailCheck size={18} style={{ marginRight: 8, verticalAlign: -3 }} />
                Invite sent
              </h3>
              <button className="modal-close" onClick={() => setInviteSentModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
                We emailed an invite link to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{inviteSentModal.email}</strong>.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                {inviteSentModal.clinicName ? <><strong>{inviteSentModal.clinicName}</strong> will appear in this list </> : 'The clinic will appear in this list '}
                once the user clicks the link, sets their password, and finishes account creation.
                {inviteSentModal.expiresAt && (
                  <> The link expires on{' '}
                    <strong>
                      {new Date(inviteSentModal.expiresAt).toLocaleString()}
                    </strong>.
                  </>
                )}
              </p>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setInviteSentModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </Layout>
  );
}
