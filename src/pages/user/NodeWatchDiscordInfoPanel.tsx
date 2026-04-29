import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

/**
 * Explains how mesh node watches use Discord DMs (separate from global Discord link + DX alerts).
 */
export function NodeWatchDiscordInfoPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden />
          Node watch Discord notifications
        </CardTitle>
        <CardDescription>
          Mesh monitoring can DM you when watched nodes go quiet (verification / offline) or when a configured
          low-battery episode is confirmed. Uses the same linked Discord account as above.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Add a watch from <span className="text-foreground">My nodes</span>,{' '}
            <span className="text-foreground">Mesh infra</span>, or a node&apos;s{' '}
            <span className="text-foreground">Monitoring</span> tab.
          </li>
          <li>
            Turn <strong className="text-foreground">Alerts on</strong> for the watch, then choose{' '}
            <strong className="text-foreground">Offline</strong> and/or{' '}
            <strong className="text-foreground">Low battery</strong> Discord notifications per watch.
          </li>
          <li>
            Silence thresholds and battery rules (streak count, threshold %) are configured per node (where you have
            permission) in Monitoring settings — not on this page.
          </li>
        </ul>
        <p>
          <Link to="/nodes/monitor" className="text-primary font-medium hover:underline">
            Open watches list
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
