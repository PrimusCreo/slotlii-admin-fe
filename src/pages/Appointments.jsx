import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { CalendarCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import * as api from '../api';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    clinicId: '',
    date: '',
    status: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadClinics();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  async function loadClinics() {
    try {
      const res = await api.getClinics();
      setClinics(res.data.data || []);
    } catch (err) { /* ignore */ }
  }

  async function loadAppointments() {
    setLoading(true);
    try {
      const params = { limit: 15, page: filters.page };
      if (filters.clinicId) params.clinicId = filters.clinicId;
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;

      const res = await api.getAppointments(params);
      setAppointments(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, pages: 1 });
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

  async function handleStatusUpdate(id, status) {
    try {
      await api.updateAppointmentStatus(id, status);
      showToast(`Appointment marked as ${status}`);
      loadAppointments();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  }

  return (
    <Layout title="Appointments">
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-description">View and manage all appointments across clinics</p>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="form-select"
          value={filters.clinicId}
          onChange={(e) => setFilters({ ...filters, clinicId: e.target.value, page: 1 })}
          style={{ minWidth: 180 }}
        >
          <option value="">All Clinics</option>
          {clinics.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <input
          type="date"
          className="form-input"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
        />

        <select
          className="form-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">All Statuses</option>
          <option value="BOOKED">Booked</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>

        {(filters.clinicId || filters.date || filters.status) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ clinicId: '', date: '', status: '', page: 1 })}
          >
            Clear filters
          </button>
        )}

        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {pagination.total} result{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="loader-container"><div className="loader" /></div>
      ) : appointments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CalendarCheck />
            <p>No appointments found</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Phone</th>
                  <th>Clinic</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {apt.patientId?.name || 'N/A'}
                    </td>
                    <td>{apt.patientId?.phone || '—'}</td>
                    <td>{apt.clinicId?.name || 'N/A'}</td>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {apt.issue || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td>
                      {apt.status === 'BOOKED' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                            onClick={() => handleStatusUpdate(apt._id, 'COMPLETED')}
                          >
                            Complete
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(apt._id, 'CANCELLED')}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn${filters.page === p ? ' active' : ''}`}
                  onClick={() => setFilters({ ...filters, page: p })}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn"
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </Layout>
  );
}
