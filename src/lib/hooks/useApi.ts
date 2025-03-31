import { useMemo } from 'react';
import { MeshtasticApi } from '../api/meshtastic';
import { useConfig } from '@/providers/ConfigProvider';

export function useMeshBotApi() {
  const config = useConfig();
  const api = useMemo(() => {
    return new MeshtasticApi(config.apis.meshBot);
  }, []);

  return api;
} 