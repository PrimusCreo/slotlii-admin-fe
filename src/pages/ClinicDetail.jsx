import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Clock, Hash, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

import Layout from '../components/Layout/Layout';
import * as api from '../api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ClinicUsage from './ClinicUsage';
import ClinicSubscription from './ClinicSubscription';

const TABS = ['profile', 'billing', 'usage'];

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </div>
      <div className="text-sm text-foreground">{value ?? '—'}</div>
    </div>
  );
}

export default function ClinicDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab lives in the URL so a platform admin can bookmark
  // /clinics/:id?tab=usage and land straight on the analytics view.
  const rawTab = searchParams.get('tab');
  const activeTab = TABS.includes(rawTab) ? rawTab : 'profile';

  const handleTabChange = useCallback(
    (next) => {
      const params = new URLSearchParams(searchParams);
      if (next === 'profile') {
        params.delete('tab');
      } else {
        params.set('tab', next);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getClinic(id);
        if (!cancelled) setClinic(res.data.data);
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error('Failed to load clinic');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Layout title="Clinic details">
        <div className="space-y-6">
          <Skeleton className="h-9 w-64" />
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!clinic) {
    return (
      <Layout title="Clinic details">
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Clinic not found
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={clinic.name}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => navigate('/clinics')}
              aria-label="Back to clinics"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {clinic.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Clinic profile, billing &amp; usage
              </p>
            </div>
          </div>
          {clinic.isActive ? (
            <Badge variant="success" className="font-normal">
              Active
            </Badge>
          ) : (
            <Badge variant="danger" className="font-normal">
              Inactive
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Plan &amp; billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Clinic information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <InfoItem icon={Phone} label="Phone" value={clinic.phone} />
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={clinic.address || '—'}
                  />
                  <InfoItem
                    icon={Clock}
                    label="Working hours"
                    value={`${clinic.workingHours?.start} – ${clinic.workingHours?.end}`}
                  />
                  <InfoItem
                    icon={Hash}
                    label="Slot duration"
                    value={`${clinic.slotDuration} minutes`}
                  />
                  <InfoItem
                    label="Created"
                    value={new Date(clinic.createdAt).toLocaleDateString()}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <ClinicSubscription clinicId={id} />
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <ClinicUsage clinicId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
