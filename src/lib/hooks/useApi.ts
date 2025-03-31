import { useMemo } from 'react';
import { MeshtasticApi } from '../api/meshtastic';
import config from '../../../config';

export function useApi() {
  const api = useMemo(() => {
    return new MeshtasticApi(config.apis.meshBot);
  }, []);

  return api;
} 