import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { ArrowLeft, Clock, MapPin, Phone, CalendarCheck, Hash, Code2, Workflow } from 'lucide-react';
import * as api from '../api';
import FlowGraphEditor from '../components/FlowGraph/FlowGraphEditor';

export default function ClinicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flowConfigText, setFlowConfigText] = useState('');
  const [savingFlow, setSavingFlow] = useState(false);
  const [flowView, setFlowView] = useState('graph');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadClinicData();
  }, [id]);

  async function loadClinicData() {
    try {
      const [clinicRes, aptsRes] = await Promise.all([
        api.getClinic(id),
        api.getAppointments({ clinicId: id, limit: 20 }),
      ]);
      setClinic(clinicRes.data.data);
      setFlowConfigText(JSON.stringify(clinicRes.data.data?.flowConfig || {}, null, 2));
      setAppointments(aptsRes.data.data || []);
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

  async function saveFlowConfig() {
    try {
      setSavingFlow(true);
      const parsedFlowConfig = JSON.parse(flowConfigText);
      const res = await api.updateClinic(id, { flowConfig: parsedFlowConfig });
      setClinic(res.data.data);
      setFlowConfigText(JSON.stringify(res.data.data?.flowConfig || {}, null, 2));
      showToast('Flow config updated');
    } catch (err) {
      showToast(err.message === 'Unexpected token' ? 'Invalid JSON' : (err.response?.data?.error || 'Failed to save flow config'), 'error');
    } finally {
      setSavingFlow(false);
    }
  }

  if (loading) {
    return (
      <Layout title="Clinic Details">
        <div className="loader-container"><div className="loader" /></div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout title="Clinic Details">
        <div className="empty-state">
          <p>Clinic not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={clinic.name}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/clinics')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{clinic.name}</h1>
            <p className="page-description">Clinic profile & appointments</p>
          </div>
        </div>
        <span className={`badge badge-${clinic.isActive ? 'active' : 'inactive'}`}>
          {clinic.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Clinic Information</div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label"><Phone size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Phone</span>
            <span className="info-value">{clinic.phone}</span>
          </div>
          <div className="info-item">
            <span className="info-label"><MapPin size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Address</span>
            <span className="info-value">{clinic.address || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label"><Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Working Hours</span>
            <span className="info-value">{clinic.workingHours?.start} – {clinic.workingHours?.end}</span>
          </div>
          <div className="info-item">
            <span className="info-label"><Hash size={12} style={{ marginRight: 4, verticalAlign: -1 }} />Slot Duration</span>
            <span className="info-value">{clinic.slotDuration} minutes</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created</span>
            <span className="info-value">{new Date(clinic.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Flow Config</div>
            <div className="card-subtitle">Default clinic-scoped booking flow — edit visually or as JSON</div>
          </div>
          <div className="view-tabs" role="tablist">
            <button
              className={`view-tab ${flowView === 'graph' ? 'view-tab-active' : ''}`}
              onClick={() => setFlowView('graph')}
              role="tab"
              aria-selected={flowView === 'graph'}
            >
              <Workflow size={14} /> Diagram
            </button>
            <button
              className={`view-tab ${flowView === 'json' ? 'view-tab-active' : ''}`}
              onClick={() => setFlowView('json')}
              role="tab"
              aria-selected={flowView === 'json'}
            >
              <Code2 size={14} /> JSON
            </button>
          </div>
        </div>

        {flowView === 'graph' ? (
          <div style={{ marginBottom: 16 }}>
            <FlowGraphEditor value={flowConfigText} onChange={setFlowConfigText} />
          </div>
        ) : (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <textarea
              className="form-input"
              value={flowConfigText}
              onChange={(e) => setFlowConfigText(e.target.value)}
              rows={20}
              style={{ fontFamily: 'monospace', resize: 'vertical' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={saveFlowConfig} disabled={savingFlow}>
            {savingFlow ? 'Saving...' : 'Save Flow Config'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Appointments</div>
            <div className="card-subtitle">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found</div>
          </div>
          <CalendarCheck size={18} style={{ color: 'var(--text-muted)' }} />
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck />
            <p>No appointments for this clinic</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Issue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {apt.patientId?.name || 'N/A'}
                    </td>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
                    <td>{apt.issue || '—'}</td>
                    <td>
                      <span className={`badge badge-${apt.status.toLowerCase()}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </Layout>
  );
}
