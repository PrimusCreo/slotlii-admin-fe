import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import {
  Building2,
  CalendarCheck,
  Users,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import * as api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    clinics: 0,
    appointments: 0,
    patients: 0,
    todayAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [clinicsRes, appointmentsRes, patientsRes] = await Promise.all([
        api.getClinics(),
        api.getAppointments({ limit: 5 }),
        api.getPatients({ limit: 1 }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      let todayCount = 0;
      try {
        const todayRes = await api.getAppointments({ date: today });
        todayCount = todayRes.data.pagination?.total || 0;
      } catch (e) { /* ignore */ }

      setStats({
        clinics: clinicsRes.data.count || 0,
        appointments: appointmentsRes.data.pagination?.total || 0,
        patients: patientsRes.data.pagination?.total || 0,
        todayAppointments: todayCount,
      });

      setRecentAppointments(appointmentsRes.data.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      label: 'Total Clinics',
      value: stats.clinics,
      icon: Building2,
      color: '#7c3aed',
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarCheck,
      color: '#3b82f6',
    },
    {
      label: 'Total Patients',
      value: stats.patients,
      icon: Users,
      color: '#10b981',
    },
    {
      label: 'All Appointments',
      value: stats.appointments,
      icon: Activity,
      color: '#f59e0b',
    },
  ];

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="loader-container">
          <div className="loader" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Overview of your dental clinic platform</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <div
            className="stat-card"
            key={card.label}
            style={{ '--stat-color': card.color }}
          >
            <div
              className="stat-card-icon"
              style={{
                background: `${card.color}15`,
                color: card.color,
              }}
            >
              <card.icon size={22} />
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Appointments</div>
            <div className="card-subtitle">Latest booking activity</div>
          </div>
          <Clock size={18} style={{ color: 'var(--text-muted)' }} />
        </div>

        {recentAppointments.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck />
            <p>No appointments yet</p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Clinic</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {apt.patientId?.name || 'N/A'}
                    </td>
                    <td>{apt.clinicId?.name || 'N/A'}</td>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
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
    </Layout>
  );
}
