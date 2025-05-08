import { useMemo } from 'react';
import { MeshtasticApi } from '@/lib/api/meshtastic-api';
import { useConfig } from '@/providers/ConfigProvider';

/**
 * Hook to get an instance of the MeshtasticApi
 * @returns MeshtasticApi instance
 */
export function useMeshtasticApi() {
  const config = useConfig();
  const api = useMemo(() => {
    return new MeshtasticApi(config.apis.meshBot);
  }, [config.apis.meshBot]);

  return api;
}
