import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const TENCENT_MEETING_TOOL_DEFINITIONS = defineAppTools('tencent_meeting', [
  { name: 'search_meetings', description: 'Search scheduled and historical meetings by title or meeting ID.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'list_scheduled', description: 'List scheduled meetings with compact time and status fields.', properties: { status: { type: 'string', enum: ['all', 'pending', 'ongoing', 'ended', 'cancelled'], default: 'all' }, limit: LIMIT } },
  { name: 'list_history', description: 'List past meeting records, durations, and participant counts.', properties: { limit: LIMIT } },
  { name: 'get_meeting_summary', description: 'Return a compact scheduled or historical meeting summary.', properties: { meeting_id: ID }, required: ['meeting_id'] },
  { name: 'search_contacts', description: 'Search meeting contacts by name.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'calculate_participation', description: 'Calculate the current user participation duration for one historical meeting.', properties: { meeting_id: ID }, required: ['meeting_id'] },
  { name: 'open_meeting', description: 'Open a scheduled or historical meeting detail page.', properties: { meeting_id: ID }, required: ['meeting_id'], kind: 'navigation' },
  { name: 'open_history', description: 'Open meeting history.', kind: 'navigation' },
  { name: 'open_join_form', description: 'Open the normal join-meeting form with a meeting number prefilled when supported. Joining remains a GUI action.', properties: { meeting_number: STRING }, required: ['meeting_number'], kind: 'draft' },
  { name: 'prepare_schedule', description: 'Open the schedule form with a pending title, time, duration, and optional invitees. Review and submit through the GUI.', properties: { title: STRING, start_time: STRING, duration_minutes: { type: 'integer', minimum: 15, maximum: 1440 }, invitee_ids: { type: 'array', items: ID, maxItems: 30 } }, required: ['title', 'start_time', 'duration_minutes'], kind: 'draft' },
  { name: 'mark_message_read', description: 'Mark one Tencent Meeting notification message as read.', properties: { message_id: ID }, required: ['message_id'], kind: 'write' },
]);
