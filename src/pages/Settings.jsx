import { Info, Settings as SettingsIcon } from 'lucide-react';

import Layout from '../components/Layout/Layout';
import { API_BASE_URL, APP_MODE, APP_NAME, HEALTH_URL } from '../config/env';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Settings() {
  return (
    <Layout title="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform configuration
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <CardTitle className="text-base">General settings</CardTitle>
            <SettingsIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Platform name</Label>
              <Input id="s-name" value={APP_NAME} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-api">Backend API URL</Label>
              <Input id="s-api" value={API_BASE_URL} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-health">Health check URL</Label>
              <Input id="s-health" value={HEALTH_URL} disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-mode">Build mode</Label>
              <Input id="s-mode" value={APP_MODE} disabled />
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-[color:var(--status-booked)]/20 bg-[color:var(--status-booked-bg)] p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-[color:var(--status-booked)]" />
              <div className="space-y-1 text-sm">
                <div className="font-medium text-foreground">Configuration</div>
                <p className="text-xs text-muted-foreground">
                  These values are baked in at build time from{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    VITE_*
                  </code>{' '}
                  environment variables. Set{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    VITE_API_BASE_URL
                  </code>{' '}
                  before running{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    npm run build
                  </code>{' '}
                  (or in your hosting platform) so production talks to the right API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
