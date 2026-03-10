import { useTheme } from 'next-themes';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { MAP_TILE_SOURCES } from '@/lib/map-tiles';
import { getMapTileSource, setMapTileSource, type MapTileSourceId } from '@/lib/settings';
import { useMonitoredNodes } from '@/hooks/useMonitoredNodes';
import { useState } from 'react';

function themeCompatibilityBadge(compat: 'light' | 'dark' | 'both') {
  switch (compat) {
    case 'light':
      return (
        <Badge variant="secondary" className="text-xs">
          Light
        </Badge>
      );
    case 'dark':
      return (
        <Badge variant="secondary" className="text-xs">
          Dark
        </Badge>
      );
    case 'both':
      return (
        <Badge variant="outline" className="text-xs">
          Both
        </Badge>
      );
  }
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { monitoredNodeIds } = useMonitoredNodes();
  const [mapTileSource, setMapTileSourceState] = useState<MapTileSourceId>(getMapTileSource);

  const handleMapTileSourceChange = (value: string) => {
    const source = value as MapTileSourceId;
    setMapTileSource(source);
    setMapTileSourceState(source);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 px-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Alert className="border-slate-200 dark:border-slate-700">
        <Info className="h-4 w-4" />
        <AlertDescription>These settings are stored in your browser only and apply to this device.</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose light, dark, or follow your system preference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-select">Theme</Label>
            <Select value={theme ?? 'system'} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map Tile Source</CardTitle>
          <CardDescription>
            Choose which map style to use. Options marked Light/Dark work best for that theme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="map-tile-source">Map style</Label>
            <Select value={mapTileSource} onValueChange={handleMapTileSourceChange}>
              <SelectTrigger id="map-tile-source" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAP_TILE_SOURCES.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    <div className="flex items-center gap-2">
                      <span>{source.label}</span>
                      {themeCompatibilityBadge(source.themeCompatibility)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitored Nodes</CardTitle>
          <CardDescription>
            Your custom list of nodes to monitor (stored in this browser). Manage from the Monitor page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {monitoredNodeIds.length} node{monitoredNodeIds.length !== 1 ? 's' : ''} in your list
            </span>
            <Link to="/nodes/monitor" className="text-teal-600 dark:text-teal-400 hover:underline text-sm font-medium">
              Manage →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
