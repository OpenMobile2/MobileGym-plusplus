import { useWechatStore } from '@/apps/Wechat/state';
import type { ChatSession, ContactItem, Message } from '@/apps/Wechat/types';
import * as TimeService from '@/os/TimeService';
import {
  assertAllowedKeys,
  optionalInteger,
  optionalString,
  requireString,
  ToolExecutionError,
} from '../../core/errors';
import { openAppRoute } from '../../core/navigation';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { WECHAT_TOOL_DEFINITIONS, WECHAT_TOOL_NAMES } from './definitions';

function state() {
  return useWechatStore.getState();
}

function contactById(id: string): ContactItem {
  const contact = state().contacts.find((item) => item.wxid === id);
  if (!contact) throw new ToolExecutionError('CONTACT_NOT_FOUND', `WeChat contact not found: ${id}`);
  return contact;
}

function visibleChats(): ChatSession[] {
  const current = state();
  return current.chats
    .filter((chat) => !current.contacts.find((contact) => contact.wxid === chat.id)?.isBlacklisted)
    .sort((a, b) => {
      if (!!a.isSticky !== !!b.isSticky) return a.isSticky ? -1 : 1;
      return (b.messages.at(-1)?.timestamp ?? 0) - (a.messages.at(-1)?.timestamp ?? 0);
    });
}

function messageSummary(message: Message, currentUserId: string) {
  return {
    message_id: message.id,
    direction: message.senderId === currentUserId ? 'outgoing' : message.senderId === 'system' ? 'system' : 'incoming',
    type: message.type,
    text: message.type === 'text' || message.type === 'system' ? message.content : `[${message.type}]`,
    timestamp: TimeService.fromTimestamp(message.timestamp).toISOString(),
  };
}

const handlers: Record<string, ToolHandler> = {
  [WECHAT_TOOL_NAMES.searchContacts]: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = requireString(input, 'query', { maxLength: 100 }).toLowerCase();
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = state().contacts.filter((contact) =>
      [contact.name, contact.alias, contact.wxid, contact.memo]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
    return {
      contacts: matches.slice(0, limit).map((contact) => ({
        contact_id: contact.wxid,
        name: contact.name,
        alias: contact.alias || undefined,
      })),
      total: matches.length,
      truncated: matches.length > limit,
    };
  },
  [WECHAT_TOOL_NAMES.listRecentChats]: (input) => {
    assertAllowedKeys(input, ['limit']);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const chats = visibleChats();
    return {
      chats: chats.slice(0, limit).map((chat) => {
        const last = [...chat.messages].reverse().find((message) => message.type !== 'time');
        return {
          contact_id: chat.id,
          name: chat.user.name,
          last_message: last ? messageSummary(last, state().user.wxid).text : '',
          last_timestamp: last ? TimeService.fromTimestamp(last.timestamp).toISOString() : null,
          muted: !!chat.isMuted,
          sticky: !!chat.isSticky,
        };
      }),
      total: chats.length,
      truncated: chats.length > limit,
    };
  },
  [WECHAT_TOOL_NAMES.searchMessages]: (input) => {
    assertAllowedKeys(input, ['query', 'contact_id', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 }).toLowerCase();
    const contactId = optionalString(input, 'contact_id', { maxLength: 200 });
    if (contactId) contactById(contactId);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const current = state();
    const matches = current.chats
      .filter((chat) => !contactId || chat.id === contactId)
      .flatMap((chat) => chat.messages.map((message) => ({ chat, message })))
      .filter(({ message }) => ['text', 'system'].includes(message.type) && message.content.toLowerCase().includes(query))
      .sort((a, b) => b.message.timestamp - a.message.timestamp);
    return {
      messages: matches.slice(0, limit).map(({ chat, message }) => ({
        contact_id: chat.id,
        contact_name: chat.user.name,
        ...messageSummary(message, current.user.wxid),
      })),
      total: matches.length,
      truncated: matches.length > limit,
    };
  },
  [WECHAT_TOOL_NAMES.getMessageContext]: (input) => {
    assertAllowedKeys(input, ['contact_id', 'message_id', 'before', 'after']);
    const contactId = requireString(input, 'contact_id');
    contactById(contactId);
    const messageId = requireString(input, 'message_id');
    const before = optionalInteger(input, 'before', { min: 0, max: 5, defaultValue: 2 });
    const after = optionalInteger(input, 'after', { min: 0, max: 5, defaultValue: 2 });
    const current = state();
    const chat = current.chats.find((item) => item.id === contactId);
    const index = chat?.messages.findIndex((message) => message.id === messageId) ?? -1;
    if (!chat || index < 0) throw new ToolExecutionError('MESSAGE_NOT_FOUND', `Message not found: ${messageId}`);
    return {
      contact_id: contactId,
      messages: chat.messages.slice(Math.max(0, index - before), index + after + 1)
        .map((message) => messageSummary(message, current.user.wxid)),
    };
  },
  [WECHAT_TOOL_NAMES.openContact]: async (input) => {
    assertAllowedKeys(input, ['contact_id']);
    const contactId = requireString(input, 'contact_id');
    contactById(contactId);
    const route = `/friend-info/${encodeURIComponent(contactId)}`;
    await openAppRoute('wechat', route);
    return { contact_id: contactId, route };
  },
  [WECHAT_TOOL_NAMES.openChat]: async (input) => {
    assertAllowedKeys(input, ['contact_id']);
    const contactId = requireString(input, 'contact_id');
    contactById(contactId);
    const route = `/chat/${encodeURIComponent(contactId)}`;
    await openAppRoute('wechat', route);
    return { contact_id: contactId, route };
  },
  [WECHAT_TOOL_NAMES.openChatSearch]: async (input) => {
    assertAllowedKeys(input, ['contact_id']);
    const contactId = requireString(input, 'contact_id');
    contactById(contactId);
    const route = `/chat/${encodeURIComponent(contactId)}/chat-search`;
    await openAppRoute('wechat', route);
    return { contact_id: contactId, route };
  },
  [WECHAT_TOOL_NAMES.openMoments]: async (input) => {
    assertAllowedKeys(input, []);
    const route = '/moments';
    await openAppRoute('wechat', route);
    return { route };
  },
  [WECHAT_TOOL_NAMES.sendTextMessage]: (input) => {
    assertAllowedKeys(input, ['contact_id', 'text']);
    const contactId = requireString(input, 'contact_id');
    const contact = contactById(contactId);
    if (contact.isBlacklisted) throw new ToolExecutionError('PERMISSION_DENIED', 'Cannot message a blacklisted contact.');
    const text = requireString(input, 'text', { maxLength: 2000 });
    const beforeIds = new Set(state().chats.find((chat) => chat.id === contactId)?.messages.map((message) => message.id));
    state().sendMessage(contactId, text);
    const sent = state().chats.find((chat) => chat.id === contactId)?.messages
      .slice().reverse().find((message) => message.senderId === state().user.wxid && !beforeIds.has(message.id));
    if (!sent) throw new ToolExecutionError('INTERNAL_ERROR', 'The message was not persisted.');
    return { contact_id: contactId, message_id: sent.id, sent_at: TimeService.fromTimestamp(sent.timestamp).toISOString() };
  },
  [WECHAT_TOOL_NAMES.prepareMomentDraft]: async (input) => {
    assertAllowedKeys(input, ['text', 'location']);
    const text = requireString(input, 'text', { maxLength: 2000 });
    const location = optionalString(input, 'location', { maxLength: 200 }) ?? null;
    state().updateTextMomentDraft({ content: text, location });
    const route = '/post-text-moment';
    await openAppRoute('wechat', route);
    return { route, persisted: false };
  },
};

export function executeWechatTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown WeChat tool: ${name}`);
  return handler(input);
}

export function registerWechatTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  WECHAT_TOOL_DEFINITIONS.forEach((definition) => registry.register(definition, handlers[definition.name]));
}

export { WECHAT_TOOL_DEFINITIONS, WECHAT_TOOL_NAMES } from './definitions';
