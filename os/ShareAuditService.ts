import { createVolatileOsStore } from './createOsStore';
import * as TimeService from './TimeService';

export interface ShareAuditEvent {
  id: string;
  text: string;
  mimeType: string;
  targetAppId: string | null;
  launchedAt: number;
  resultCode: string | null;
}

interface ShareAuditState {
  events: ShareAuditEvent[];
}

const store = createVolatileOsStore<ShareAuditState>(
  'shareAudit',
  { events: [] },
  { useImmer: false },
);

let counter = 0;

export const ShareAuditService = {
  recordLaunch(text: string, mimeType: string, targetAppId?: string): string {
    counter += 1;
    const id = `share_${TimeService.now()}_${counter}`;
    const event: ShareAuditEvent = {
      id,
      text,
      mimeType,
      targetAppId: targetAppId ?? null,
      launchedAt: TimeService.now(),
      resultCode: null,
    };
    store.setState((state) => ({ events: [...state.events, event] }));
    return id;
  },

  recordResult(id: string, resultCode: string): void {
    store.setState((state) => ({
      events: state.events.map((event) => event.id === id ? { ...event, resultCode } : event),
    }));
  },

  discard(id: string): void {
    store.setState((state) => ({ events: state.events.filter((event) => event.id !== id) }));
  },
};
