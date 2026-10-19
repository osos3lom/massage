import type { ElectronAPI } from './index';

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI;
  }
}
