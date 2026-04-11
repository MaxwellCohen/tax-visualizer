/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public site origin for canonical URLs and Open Graph (no trailing slash), e.g. https://example.com */
  readonly VITE_SITE_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
