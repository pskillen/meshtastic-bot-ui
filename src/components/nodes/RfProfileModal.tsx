import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AntennaPattern, ObservedNode, RfProfileUpdateBody } from '@/lib/models';
import { useMapTileUrl } from '@/hooks/useMapTileUrl';
import { useRecomputeRfPropagation, useRfProfile, useUpdateRfProfile } from '@/hooks/api/useRfPropagation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RfProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: ObservedNode;
}

function numOrUndef(v: string): number | undefined {
  const t = v.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function numOrNull(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function RfProfileModal({ open, onOpenChange, node }: RfProfileModalProps) {
  const nodeId = node.node_id;
  const { data: profile, isLoading } = useRfProfile(nodeId, { enabled: open });
  const updateMutation = useUpdateRfProfile(nodeId);
  const recomputeMutation = useRecomputeRfPropagation(nodeId);
  const { url: tileUrl, attribution } = useMapTileUrl();

  const [antennaHeight, setAntennaHeight] = useState('');
  const [antennaGain, setAntennaGain] = useState('');
  const [txPower, setTxPower] = useState('');
  const [freq, setFreq] = useState('');
  const [pattern, setPattern] = useState<AntennaPattern>('omni');
  const [azimuth, setAzimuth] = useState('');
  const [beamwidth, setBeamwidth] = useState('');
  const [rfLat, setRfLat] = useState('');
  const [rfLng, setRfLng] = useState('');
  const [rfAlt, setRfAlt] = useState('');
  const [coordSnapshot, setCoordSnapshot] = useState<{ lat: string; lng: string; alt: string } | null>(null);
  const [showRerenderPrompt, setShowRerenderPrompt] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!open || profile === undefined) return;
    if (profile === null) {
      setAntennaHeight('');
      setAntennaGain('');
      setTxPower('');
      setFreq('');
      setPattern('omni');
      setAzimuth('');
      setBeamwidth('');
      setRfLat('');
      setRfLng('');
      setRfAlt('');
      setCoordSnapshot({ lat: '', lng: '', alt: '' });
      return;
    }
    setAntennaHeight(profile.antenna_height_m != null ? String(profile.antenna_height_m) : '');
    setAntennaGain(profile.antenna_gain_dbi != null ? String(profile.antenna_gain_dbi) : '');
    setTxPower(profile.tx_power_dbm != null ? String(profile.tx_power_dbm) : '');
    setFreq(profile.rf_frequency_mhz != null ? String(profile.rf_frequency_mhz) : '');
    setPattern((profile.antenna_pattern as AntennaPattern) ?? 'omni');
    setAzimuth(profile.antenna_azimuth_deg != null ? String(profile.antenna_azimuth_deg) : '');
    setBeamwidth(profile.antenna_beamwidth_deg != null ? String(profile.antenna_beamwidth_deg) : '');
    const latS = profile.rf_latitude != null ? String(profile.rf_latitude) : '';
    const lngS = profile.rf_longitude != null ? String(profile.rf_longitude) : '';
    const altS = profile.rf_altitude_m != null ? String(profile.rf_altitude_m) : '';
    setRfLat(latS);
    setRfLng(lngS);
    setRfAlt(altS);
    setCoordSnapshot({ lat: latS, lng: lngS, alt: altS });
    setShowRerenderPrompt(false);
  }, [open, profile]);

  const initialCenter = useMemo(() => {
    const lat = node.latest_position?.latitude;
    const lng = node.latest_position?.longitude;
    if (lat != null && lng != null) return { lat, lng };
    return { lat: 55.8642, lng: -4.2518 };
  }, [node.latest_position?.latitude, node.latest_position?.longitude]);

  // Intentionally omit rfLat/rfLng from deps: map is created once per open; marker syncs via a separate effect.
  useEffect(() => {
    if (!open || !mapRef.current || mapInstanceRef.current) return;
    const startLat = numOrUndef(rfLat) ?? initialCenter.lat;
    const startLng = numOrUndef(rfLng) ?? initialCenter.lng;
    const map = L.map(mapRef.current).setView([startLat, startLng], 13);
    const tileLayer = L.tileLayer(tileUrl, { attribution }).addTo(map);
    tileLayerRef.current = tileLayer;
    const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
    markerRef.current = marker;
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      setRfLat(String(p.lat));
      setRfLng(String(p.lng));
    });
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setRfLat(String(e.latlng.lat));
      setRfLng(String(e.latlng.lng));
    });
    mapInstanceRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(t);
      markerRef.current?.remove();
      markerRef.current = null;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      if (mapRef.current) mapRef.current.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- marker position synced in a follow-up effect
  }, [open, initialCenter.lat, initialCenter.lng, tileUrl, attribution]);

  useEffect(() => {
    if (!open) return;
    const map = mapInstanceRef.current;
    const old = tileLayerRef.current;
    if (!map || !old) return;
    map.removeLayer(old);
    const next = L.tileLayer(tileUrl, { attribution }).addTo(map);
    tileLayerRef.current = next;
  }, [open, tileUrl, attribution]);

  useEffect(() => {
    const marker = markerRef.current;
    const lat = numOrUndef(rfLat);
    const lng = numOrUndef(rfLng);
    if (marker && lat != null && lng != null) {
      marker.setLatLng([lat, lng]);
    }
  }, [rfLat, rfLng]);

  const copyFromGps = () => {
    const lat = node.latest_position?.latitude;
    const lng = node.latest_position?.longitude;
    const alt = node.latest_position?.altitude;
    if (lat == null || lng == null) {
      toast.message('No GPS position on latest status for this node.');
      return;
    }
    setRfLat(String(lat));
    setRfLng(String(lng));
    if (alt != null) setRfAlt(String(alt));
    toast.success('Copied coordinates from latest GPS');
  };

  const buildBody = (): RfProfileUpdateBody => ({
    antenna_height_m: numOrNull(antennaHeight),
    antenna_gain_dbi: numOrNull(antennaGain),
    tx_power_dbm: numOrNull(txPower),
    rf_frequency_mhz: numOrNull(freq),
    antenna_pattern: pattern,
    antenna_azimuth_deg: pattern === 'directional' ? numOrNull(azimuth) : null,
    antenna_beamwidth_deg: pattern === 'directional' ? numOrNull(beamwidth) : null,
    rf_latitude: numOrNull(rfLat),
    rf_longitude: numOrNull(rfLng),
    rf_altitude_m: numOrNull(rfAlt),
  });

  const coordsChangedVsSnapshot = () => {
    if (!coordSnapshot) return false;
    return rfLat !== coordSnapshot.lat || rfLng !== coordSnapshot.lng || rfAlt !== coordSnapshot.alt;
  };

  const handleSave = async () => {
    if (pattern === 'directional') {
      if (azimuth.trim() === '' || beamwidth.trim() === '') {
        toast.error('Directional pattern requires azimuth and beamwidth.');
        return;
      }
    }
    try {
      await updateMutation.mutateAsync(buildBody());
      toast.success('RF profile saved');
      if (coordsChangedVsSnapshot()) {
        setShowRerenderPrompt(true);
      } else {
        onOpenChange(false);
      }
    } catch {
      toast.error('Could not save RF profile.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>RF propagation profile</DialogTitle>
          <DialogDescription>
            Private map location is visible only to you and staff. Antenna parameters are public on the node page.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Private location (only you and staff)</CardTitle>
                <CardDescription>Used for propagation modelling, not the same as live GPS.</CardDescription>
              </CardHeader>
              <div className="space-y-3 px-6 pb-6">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={copyFromGps}>
                    Copy from GPS
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="rf-lat">Latitude</Label>
                    <Input id="rf-lat" value={rfLat} onChange={(e) => setRfLat(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="rf-lng">Longitude</Label>
                    <Input id="rf-lng" value={rfLng} onChange={(e) => setRfLng(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="rf-alt">Altitude (m)</Label>
                    <Input id="rf-alt" value={rfAlt} onChange={(e) => setRfAlt(e.target.value)} />
                  </div>
                </div>
                <div
                  ref={mapRef}
                  className="map-container h-[220px] w-full rounded-md border"
                  style={{ position: 'relative', zIndex: 1 }}
                />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Antenna</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
                <div>
                  <Label>Height AGL (m)</Label>
                  <Input value={antennaHeight} onChange={(e) => setAntennaHeight(e.target.value)} />
                </div>
                <div>
                  <Label>Gain (dBi)</Label>
                  <Input value={antennaGain} onChange={(e) => setAntennaGain(e.target.value)} />
                </div>
                <div>
                  <Label>TX power (dBm)</Label>
                  <Input value={txPower} onChange={(e) => setTxPower(e.target.value)} />
                </div>
                <div>
                  <Label>Frequency (MHz)</Label>
                  <Input value={freq} onChange={(e) => setFreq(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Pattern</Label>
                  <Select value={pattern} onValueChange={(v) => setPattern(v as AntennaPattern)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omni">Omni</SelectItem>
                      <SelectItem value="directional">Directional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pattern === 'directional' && (
                  <>
                    <div>
                      <Label htmlFor="rf-azimuth">Azimuth (deg)</Label>
                      <Input id="rf-azimuth" value={azimuth} onChange={(e) => setAzimuth(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="rf-beamwidth">Beamwidth (deg)</Label>
                      <Input id="rf-beamwidth" value={beamwidth} onChange={(e) => setBeamwidth(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </Card>

            {showRerenderPrompt && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="mb-2 font-medium">Re-render propagation map now?</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void recomputeMutation.mutateAsync().then(() => {
                        toast.success('Render queued');
                        setShowRerenderPrompt(false);
                        onOpenChange(false);
                      });
                    }}
                    disabled={recomputeMutation.isPending}
                  >
                    Yes
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
                    No
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={updateMutation.isPending || isLoading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
