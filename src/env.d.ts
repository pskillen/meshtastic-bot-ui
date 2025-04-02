/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TOKEN?: string;
  readonly VITE_API_USERNAME?: string;
  readonly VITE_API_PASSWORD?: string;
  readonly VITE_API_KEY?: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
