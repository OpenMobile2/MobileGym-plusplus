import { useMeetingStore } from '@/apps/TencentMeeting/state';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { TENCENT_MEETING_TOOL_DEFINITIONS } from './definitions';

function allMeetings() {
  const s = useMeetingStore.getState();
  return [
    ...s.scheduledMeetings.map((m) => ({ ...m, source: 'scheduled' as const })),
    ...s.history.map((m) => ({ ...m, status: 'ended' as const, source: 'history' as const })),
  ];
}
function findMeeting(id: string) { return requireFound(allMeetings().find((m) => m.id === id || m.meetingId.replace(/\s/g, '') === id.replace(/\s/g, '')), 'MEETING_NOT_FOUND', `Tencent Meeting record not found: ${id}`); }
const meetingSummary = (m: ReturnType<typeof allMeetings>[number]) => ({ meeting_id: m.id, meeting_number: m.meetingId, title: m.title, start_time: TimeService.fromTimestamp(m.startTime).toISOString(), duration_minutes: m.duration, status: m.status, source: m.source, participant_count: 'participants' in m ? m.participants.length : m.invitees.length });

const handlers: Record<string, ToolHandler> = {
  tencent_meeting__search_meetings: (input) => { assertAllowedKeys(input, ['query', 'limit']); const q = getQuery(input); const limit = getLimit(input); return compactResult(allMeetings().filter((m) => includesQuery([m.title, m.meetingId], q)).sort((a, b) => b.startTime - a.startTime).map(meetingSummary), limit); },
  tencent_meeting__list_scheduled: (input) => { assertAllowedKeys(input, ['status', 'limit']); const status = typeof input.status === 'string' ? input.status : 'all'; const limit = getLimit(input); const rows = useMeetingStore.getState().scheduledMeetings.filter((m) => status === 'all' || m.status === status).sort((a, b) => a.startTime - b.startTime).map((m) => meetingSummary({ ...m, source: 'scheduled' })); return { status, ...compactResult(rows, limit) }; },
  tencent_meeting__list_history: (input) => { assertAllowedKeys(input, ['limit']); const limit = getLimit(input); const rows = useMeetingStore.getState().history.slice().sort((a, b) => b.startTime - a.startTime).map((m) => ({ ...meetingSummary({ ...m, status: 'ended', source: 'history' }), actual_end_time: m.endTime ? TimeService.fromTimestamp(m.endTime).toISOString() : undefined })); return compactResult(rows, limit); },
  tencent_meeting__get_meeting_summary: (input) => { assertAllowedKeys(input, ['meeting_id']); const m = findMeeting(getQuery(input, 'meeting_id')); return { ...meetingSummary(m), invitees: 'invitees' in m ? m.invitees.map((p) => p.name) : undefined, participants: 'participants' in m ? m.participants.map((p) => p.name) : undefined, note: 'note' in m ? m.note : undefined }; },
  tencent_meeting__search_contacts: (input) => { assertAllowedKeys(input, ['query', 'limit']); const q = getQuery(input); const limit = getLimit(input); return compactResult(useMeetingStore.getState().contacts.filter((c) => includesQuery([c.name, c.id], q)).map((c) => ({ contact_id: c.id, name: c.name })), limit); },
  tencent_meeting__calculate_participation: (input) => { assertAllowedKeys(input, ['meeting_id']); const id = getQuery(input, 'meeting_id'); const m = requireFound(useMeetingStore.getState().history.find((h) => h.id === id || h.meetingId.replace(/\s/g, '') === id.replace(/\s/g, '')), 'MEETING_NOT_FOUND', `Historical meeting not found: ${id}`); const ms = (m.participations ?? []).reduce((n, p) => n + p.duration, 0); return { meeting_id: m.id, participation_count: m.participations?.length ?? 0, total_milliseconds: ms, total_minutes: Math.round(ms / 6000) / 10 }; },
  tencent_meeting__open_meeting: async (input) => { assertAllowedKeys(input, ['meeting_id']); const m = findMeeting(getQuery(input, 'meeting_id')); const route = m.source === 'history' ? `/history/${encodeURIComponent(m.meetingId)}` : '/meeting/detail'; if (m.source === 'scheduled') useMeetingStore.getState().setCurrentScheduledMeeting(m); await openAppRoute('tencent_meeting', route); return { route, meeting_id: m.id }; },
  tencent_meeting__open_history: async () => { await openAppRoute('tencent_meeting', '/history'); return { route: '/history' }; },
  tencent_meeting__open_join_form: async (input) => { assertAllowedKeys(input, ['meeting_number']); const number = getQuery(input, 'meeting_number').replace(/\s/g, ''); const route = `/join?meeting=${encodeURIComponent(number)}`; await openAppRoute('tencent_meeting', route); return { route, meeting_number: number, joined: false }; },
  tencent_meeting__prepare_schedule: async (input) => { assertAllowedKeys(input, ['title', 'start_time', 'duration_minutes', 'invitee_ids']); const title = getQuery(input, 'title'); const start = getQuery(input, 'start_time'); const duration = Number(input.duration_minutes); if (!Number.isInteger(duration) || duration < 15 || duration > 1440 || !Number.isFinite(Date.parse(start))) requireFound(undefined, 'INVALID_ARGUMENT', 'start_time must be ISO 8601 and duration_minutes must be 15-1440.'); const ids = Array.isArray(input.invitee_ids) ? input.invitee_ids.map(String) : []; const unknown = ids.filter((id) => !useMeetingStore.getState().contacts.some((c) => c.id === id)); if (unknown.length) requireFound(undefined, 'CONTACT_NOT_FOUND', `Unknown invitee IDs: ${unknown.join(', ')}`); const route = `/schedule/regular?title=${encodeURIComponent(title)}&start=${encodeURIComponent(start)}&duration=${duration}&invitees=${encodeURIComponent(ids.join(','))}`; await openAppRoute('tencent_meeting', route); return { route, persisted: false, invitee_count: ids.length }; },
  tencent_meeting__mark_message_read: (input) => { assertAllowedKeys(input, ['message_id']); const id = getQuery(input, 'message_id'); requireFound(useMeetingStore.getState().messages.find((m: any) => m.id === id), 'MESSAGE_NOT_FOUND', `Meeting message not found: ${id}`); useMeetingStore.getState().markMessageRead(id); return { message_id: id, read: true }; },
};

export function executeTencentMeetingTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Tencent Meeting tool: ${name}`)(input); }
export { TENCENT_MEETING_TOOL_DEFINITIONS } from './definitions';
