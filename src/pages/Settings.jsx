import Layout from '../components/Layout/Layout';
import { Settings as SettingsIcon, Info } from 'lucide-react';

export default function Settings() {
  return (
    <Layout title="Settings">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-description">Platform configuration</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <div className="card-title">General Settings</div>
          <SettingsIcon size={18} style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="form-group">
          <label className="form-label">Platform Name</label>
          <input className="form-input" defaultValue="Slotlii" disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Backend API URL</label>
          <input className="form-input" defaultValue="http://localhost:3000" disabled />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '16px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.15)', marginTop: 12 }}>
          <Info size={18} style={{ color: 'var(--status-booked)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Configuration</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Settings are managed via environment variables. Update the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file on the backend server to modify platform settings.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
