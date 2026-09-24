import type { BrowserToolApi } from './core/types';

declare global {
  interface Window {
    __MOBILE_GYM_TOOLS__?: BrowserToolApi;
  }
}

export {};
