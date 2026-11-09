import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const SLACK_TOOL_DEFINITIONS = defineAppTools('slack', [
  {
    name: 'list_conversations',
    description: 'List channels, DMs, and group DMs with unread badge, muted, and starred flags. Does not return message text.',
    properties: { kind: { type: 'string', enum: ['channel', 'dm', 'group'] }, limit: LIMIT },
  },
  {
    name: 'search_messages',
    description: 'Search messages by text, author display name/handle, or conversation name. Query is required. Does not return the author job title or unread badges.',
    properties: { query: STRING, in_conv_id: ID, from_user_id: ID, limit: LIMIT },
    required: ['query'],
  },
  {
    name: 'search_people',
    description: 'Search workspace members by display name, handle, or job title. This is the people directory, not message search.',
    properties: { query: STRING, limit: LIMIT },
    required: ['query'],
  },
  {
    name: 'list_saved',
    description: 'List Later/saved items with text, conversation name, and done/archived bucket.',
    properties: { limit: LIMIT },
  },
  {
    name: 'open_conversation',
    description: 'Open a channel or DM. Read a fresh screenshot after this call.',
    properties: { conv_id: ID },
    required: ['conv_id'],
    kind: 'navigation',
  },
  {
    name: 'send_text_message',
    description: 'Send one text message to a known conversation, optionally as a thread reply. Set also_sent=true to also post the reply to the channel, matching the GUI checkbox 同时发送至频道.',
    properties: { conv_id: ID, text: { ...STRING, maxLength: 4000 }, thread_parent_id: ID, also_sent: { type: 'boolean', default: false } },
    required: ['conv_id', 'text'],
    kind: 'write',
  },
  {
    name: 'toggle_saved',
    description: 'Save or unsave one message for Later.',
    properties: { message_id: ID },
    required: ['message_id'],
    kind: 'write',
  },
  {
    name: 'toggle_pinned',
    description: 'Pin or unpin one message in its conversation.',
    properties: { message_id: ID },
    required: ['message_id'],
    kind: 'write',
  },
  {
    name: 'create_channel',
    description: 'Create one channel. Does not add members or start a huddle.',
    properties: { name: { ...STRING, maxLength: 80 }, is_private: { type: 'boolean', default: false } },
    required: ['name'],
    kind: 'write',
  },
]);
