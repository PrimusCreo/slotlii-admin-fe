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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const STATUS_META = {
  operational: {
    label: STATUS.operational,
    icon: CheckCircle2,
    dot: 'bg-[color:var(--status-completed)]',
    tone: 'text-[color:var(--status-completed)]',
  },
  degraded: {
    label: STATUS.degraded,
    icon: AlertTriangle,
    dot: 'bg-[color:var(--status-noshow)]',
    tone: 'text-[color:var(--status-noshow)]',
  },
  down: {
    label: STATUS.down,
    icon: XCircle,
    dot: 'bg-destructive',
    tone: 'text-destructive',
  },
};

const MONITORED_SERVICES = [
  {
    key: 'health',
    name: 'Core API health',
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const runChecks = useCallback(async () => {
    setRefreshing(true);

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
            detail:
              status === 'operational'
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
            detail:
              error?.response?.data?.error ||
              error.message ||
              'Service unavailable',
          };
        }
      }),
    );

    setServices(checks);
    setLastChecked(new Date());
    setRefreshing(false);
  }, []);

  const globalStatus = useMemo(() => {
    if (!services.length) return 'operational';
    if (services.some((s) => s.status === 'down')) return 'down';
    if (services.some((s) => s.status === 'degraded')) return 'degraded';
    return 'operational';
  }, [services]);

  const globalMeta = STATUS_META[globalStatus];
  const GlobalIcon = globalMeta.icon;

  return (
    <Layout title="API status">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              API status
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live health of backend APIs used by the admin dashboard
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={runChecks}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('size-4', refreshing && 'animate-spin')}
            />
            {refreshing ? 'Refreshing…' : lastChecked ? 'Refresh' : 'Run checks'}
          </Button>
        </div>

        {!lastChecked ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No checks run yet. Click <strong>Run checks</strong> to load API
              status.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn('inline-block size-2.5 rounded-full', globalMeta.dot)}
                />
                <div>
                  <div className="text-sm font-semibold">
                    Platform status: {globalMeta.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last checked at {lastChecked.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <GlobalIcon className={cn('size-5', globalMeta.tone)} />
            </CardContent>
          </Card>
        )}

        {services.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {services.map((service) => {
              const meta = STATUS_META[service.status];
              const Icon = meta.icon;
              return (
                <Card key={service.key}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">
                        {service.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                    <Icon className={cn('size-4', meta.tone)} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-block size-2.5 rounded-full',
                          meta.dot,
                        )}
                      />
                      <span className={cn('text-sm font-medium', meta.tone)}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <ServerCog className="size-3.5" />
                        HTTP: {service.httpCode ?? 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Activity className="size-3.5" />
                        Latency: {service.latency} ms
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {service.detail}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
