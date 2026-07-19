import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ServerCog,
  XCircle,
} from 'lucide-react';
import Layout from '../components/Layout/Layout';
import * as api from '../api';

const STATUS = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
};

function getLatencyStatus(latency) {
  if (latency <= 450) return 'operational';
  if (latency <= 1200) return 'degraded';
  return 'down';
}

function getHttpStatus(responseStatus) {
  if (responseStatus >= 200 && responseStatus < 400) return 'operational';
  if (responseStatus >= 400 && responseStatus < 500) return 'degraded';
  return 'down';
}

function getFinalStatus(httpStatus, latencyStatus) {
  if (httpStatus === 'down' || latencyStatus === 'down') return 'down';
  if (httpStatus === 'degraded' || latencyStatus === 'degraded') return 'degraded';
  return 'operational';
}

function statusMeta(status) {
  if (status === 'operational') {
    return { label: STATUS.operational, badgeClass: 'status-dot operational', icon: CheckCircle2 };
  }
  if (status === 'degraded') {
    return { label: STATUS.degraded, badgeClass: 'status-dot degraded', icon: AlertTriangle };
  }
  return { label: STATUS.down, badgeClass: 'status-dot down', icon: XCircle };
}

const MONITORED_SERVICES = [
  {
    key: 'health',
    name: 'Core API Health',
    description: 'Backend heartbeat and uptime endpoint',
    check: () => api.getHealth(),
  },
  {
    key: 'clinics',
    name: 'Clinics API',
    description: 'Clinic listing and management endpoints',
    check: () => api.getClinics(),
  },
  {
    key: 'appointments',
    name: 'Appointments API',
    description: 'Appointment retrieval and workflow endpoint',
    check: () => api.getAppointments({ limit: 1 }),
  },
  {
    key: 'patients',
    name: 'Patients API',
    description: 'Patient records and profile endpoints',
    check: () => api.getPatients({ limit: 1 }),
  },
];

export default function ApiStatus() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const runChecks = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    else setRefreshing(true);

    const checks = await Promise.all(
      MONITORED_SERVICES.map(async (service) => {
        const start = performance.now();
        try {
          const response = await service.check();
          const latency = Math.round(performance.now() - start);
          const httpStatus = getHttpStatus(response.status);
          const latencyStatus = getLatencyStatus(latency);
          const status = getFinalStatus(httpStatus, latencyStatus);

          return {
            ...service,
            status,
            httpCode: response.status,
            latency,
            detail: status === 'operational'
              ? 'API is responding normally'
              : 'Response received but with elevated latency',
          };
        } catch (error) {
          const latency = Math.round(performance.now() - start);
          const httpCode = error?.response?.status || null;

          return {
            ...service,
            status: httpCode && httpCode < 500 ? 'degraded' : 'down',
            httpCode,
            latency,
            detail: error?.response?.data?.error || error.message || 'Service unavailable',
          };
        }
      }),
    );

    setServices(checks);
    setLastChecked(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  const globalStatus = useMemo(() => {
    if (services.some((service) => service.status === 'down')) return 'down';
    if (services.some((service) => service.status === 'degraded')) return 'degraded';
    return 'operational';
  }, [services]);

  const globalMeta = statusMeta(globalStatus);
  const GlobalIcon = globalMeta.icon;

  if (loading) {
    return (
      <Layout title="API Status">
        <div className="loader-container">
          <div className="loader" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="API Status">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Status</h1>
          <p className="page-description">Live health of backend APIs used by the admin dashboard</p>
        </div>
        <button className="btn btn-secondary" onClick={() => runChecks(false)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {!lastChecked && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="page-description">No checks run yet. Click Refresh to load API status.</p>
        </div>
      )}

      <div className="status-overview-card">
        <div className="status-overview-left">
          <div className={globalMeta.badgeClass} />
          <div>
            <div className="status-overview-title">Platform Status: {globalMeta.label}</div>
            <div className="status-overview-subtitle">
              {lastChecked ? `Last checked at ${lastChecked.toLocaleTimeString()}` : 'Checking status'}
            </div>
          </div>
        </div>
        <GlobalIcon size={18} />
      </div>

      <div className="status-services-grid">
        {services.map((service) => {
          const meta = statusMeta(service.status);
          const Icon = meta.icon;

          return (
            <div className="card status-service-card" key={service.key}>
              <div className="card-header">
                <div>
                  <div className="card-title">{service.name}</div>
                  <div className="card-subtitle">{service.description}</div>
                </div>
                <Icon size={18} style={{ color: 'var(--text-muted)' }} />
              </div>

              <div className="status-service-main">
                <div className={meta.badgeClass} />
                <span className="status-label">{meta.label}</span>
              </div>

              <div className="status-metrics">
                <span>
                  <ServerCog size={14} />
                  HTTP: {service.httpCode ?? 'N/A'}
                </span>
                <span>
                  <Activity size={14} />
                  Latency: {service.latency} ms
                </span>
              </div>

              <p className="status-detail">{service.detail}</p>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
