import React, { createContext, useContext, useEffect, useState } from 'react';
import configPromise from '../../config';
import { AppConfig } from '@/types/types';

const ConfigContext = createContext<AppConfig | null>(null);

export function useConfig() {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return config;
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    configPromise.then(setConfig);
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
} 