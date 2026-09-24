import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;
const LIMIT = { type: 'integer', minimum: 1, maximum: 20, default: 10 } as const;
const CONTACTS = { type: 'array', items: { type: 'object', properties: { contact_id: STRING, name: STRING, alias: STRING }, required: ['contact_id', 'name'] } } as const;
const MESSAGE = { type: 'object', properties: { message_id: STRING, direction: { type: 'string', enum: ['incoming', 'outgoing', 'system'] }, type: STRING, text: STRING, timestamp: STRING }, required: ['message_id', 'direction', 'type', 'text', 'timestamp'] } as const;
const MESSAGES = { type: 'array', items: MESSAGE } as const;

export const WECHAT_TOOL_NAMES = {
  searchContacts: 'wechat__search_contacts',
  listRecentChats: 'wechat__list_recent_chats',
  searchMessages: 'wechat__search_messages',
  getMessageContext: 'wechat__get_message_context',
  openContact: 'wechat__open_contact',
  openChat: 'wechat__open_chat',
  openChatSearch: 'wechat__open_chat_search',
  openMoments: 'wechat__open_moments',
  sendTextMessage: 'wechat__send_text_message',
  prepareMomentDraft: 'wechat__prepare_moment_draft',
} as const;

const annotations = (readOnly: boolean, uiEffect: 'none' | 'navigation' | 'draft' = 'none', idempotent = true) => ({
  readOnlyHint: readOnly,
  destructiveHint: false,
  idempotentHint: idempotent,
  uiEffect,
});

export const WECHAT_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: WECHAT_TOOL_NAMES.searchContacts,
    app: 'wechat',
    description: 'Search WeChat contacts by name, alias, WeChat ID, or memo. Returns recipient identifiers and compact labels only.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 100 }, limit: LIMIT }, required: ['query'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contacts: CONTACTS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['contacts', 'total', 'truncated'] },
    annotations: annotations(true),
  },
  {
    name: WECHAT_TOOL_NAMES.listRecentChats,
    app: 'wechat',
    description: 'List recent visible WeChat conversations with a short last-message preview. Use open_chat to inspect the GUI.',
    inputSchema: { type: 'object', properties: { limit: LIMIT }, additionalProperties: false },
    outputSchema: { type: 'object', properties: { chats: { type: 'array', items: { type: 'object', properties: { contact_id: STRING, name: STRING, last_message: STRING, last_timestamp: { type: ['string', 'null'] }, muted: { type: 'boolean' }, sticky: { type: 'boolean' } }, required: ['contact_id', 'name', 'last_message', 'last_timestamp', 'muted', 'sticky'] } }, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['chats', 'total', 'truncated'] },
    annotations: annotations(true),
  },
  {
    name: WECHAT_TOOL_NAMES.searchMessages,
    app: 'wechat',
    description: 'Search text messages by content, optionally within one contact. Returns matching snippets, not entire conversations.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 200 }, contact_id: STRING, limit: LIMIT }, required: ['query'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { messages: { type: 'array', items: { type: 'object', properties: { contact_id: STRING, contact_name: STRING, ...MESSAGE.properties }, required: ['contact_id', 'contact_name', ...MESSAGE.required] } }, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['messages', 'total', 'truncated'] },
    annotations: annotations(true),
  },
  {
    name: WECHAT_TOOL_NAMES.getMessageContext,
    app: 'wechat',
    description: 'Get a small window of messages around a message_id returned by search_messages.',
    inputSchema: { type: 'object', properties: { contact_id: STRING, message_id: STRING, before: { type: 'integer', minimum: 0, maximum: 5, default: 2 }, after: { type: 'integer', minimum: 0, maximum: 5, default: 2 } }, required: ['contact_id', 'message_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contact_id: STRING, messages: MESSAGES }, required: ['contact_id', 'messages'] },
    annotations: annotations(true),
  },
  {
    name: WECHAT_TOOL_NAMES.openContact,
    app: 'wechat',
    description: 'Open a WeChat contact profile by contact_id. The next screenshot is the profile page.',
    inputSchema: { type: 'object', properties: { contact_id: STRING }, required: ['contact_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contact_id: STRING, route: STRING }, required: ['contact_id', 'route'] },
    annotations: annotations(true, 'navigation'),
  },
  {
    name: WECHAT_TOOL_NAMES.openChat,
    app: 'wechat',
    description: 'Open a chat with a known contact_id. The next screenshot is the chat page.',
    inputSchema: { type: 'object', properties: { contact_id: STRING }, required: ['contact_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contact_id: STRING, route: STRING }, required: ['contact_id', 'route'] },
    annotations: annotations(true, 'navigation'),
  },
  {
    name: WECHAT_TOOL_NAMES.openChatSearch,
    app: 'wechat',
    description: 'Open the in-chat search UI for a known contact_id. Continue searching or inspecting results through the GUI.',
    inputSchema: { type: 'object', properties: { contact_id: STRING }, required: ['contact_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contact_id: STRING, route: STRING }, required: ['contact_id', 'route'] },
    annotations: annotations(true, 'navigation'),
  },
  {
    name: WECHAT_TOOL_NAMES.openMoments,
    app: 'wechat',
    description: 'Open the WeChat Moments feed. The next screenshot is the feed; no posts are returned by the tool.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: { type: 'object', properties: { route: STRING }, required: ['route'] },
    annotations: annotations(true, 'navigation'),
  },
  {
    name: WECHAT_TOOL_NAMES.sendTextMessage,
    app: 'wechat',
    description: 'Send one text message to a known contact_id using the same send action as the chat UI. This does not open the chat.',
    inputSchema: { type: 'object', properties: { contact_id: STRING, text: { ...STRING, maxLength: 2000 } }, required: ['contact_id', 'text'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { contact_id: STRING, message_id: STRING, sent_at: STRING }, required: ['contact_id', 'message_id', 'sent_at'] },
    annotations: annotations(false, 'none', false),
  },
  {
    name: WECHAT_TOOL_NAMES.prepareMomentDraft,
    app: 'wechat',
    description: 'Open a prefilled text-only Moments draft. Nothing is posted; review and publish it through the GUI.',
    inputSchema: { type: 'object', properties: { text: { ...STRING, maxLength: 2000 }, location: { ...STRING, maxLength: 200 } }, required: ['text'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { route: STRING, persisted: { type: 'boolean' } }, required: ['route', 'persisted'] },
    annotations: annotations(false, 'draft'),
  },
];
