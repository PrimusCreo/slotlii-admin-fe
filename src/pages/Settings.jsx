import { Info, Settings as SettingsIcon } from 'lucide-react';

import Layout from '../components/Layout/Layout';
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
              <Input id="s-name" defaultValue="Slotlii" disabled />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-api">Backend API URL</Label>
              <Input
                id="s-api"
                defaultValue="http://localhost:3000"
                disabled
              />
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-[color:var(--status-booked)]/20 bg-[color:var(--status-booked-bg)] p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-[color:var(--status-booked)]" />
              <div className="space-y-1 text-sm">
                <div className="font-medium text-foreground">Configuration</div>
                <p className="text-xs text-muted-foreground">
                  Settings are managed via environment variables. Update the{' '}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                    .env
                  </code>{' '}
                  file on the backend server to modify platform settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
