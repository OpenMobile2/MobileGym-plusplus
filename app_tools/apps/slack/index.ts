import { useSlackStore } from '@/apps/Slack/state';
import type { Conversation, Message, SlackUser } from '@/apps/Slack/types';
import { assertAllowedKeys, optionalBoolean, optionalString, requireString, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { SLACK_TOOL_DEFINITIONS } from './definitions';

const state = () => useSlackStore.getState();
const KINDS = ['channel', 'dm', 'group'] as const;

function userById(id: string): SlackUser | undefined {
  return state().users.find((user) => user.id === id);
}

function convById(id: string): Conversation {
  return requireFound(
    state().conversations.find((conv) => conv.id === id),
    'CONVERSATION_NOT_FOUND',
    `Slack conversation not found: ${id}`,
  );
}

function messageById(id: string): Message {
  return requireFound(
    state().messages.find((message) => message.id === id && !message.deleted),
    'MESSAGE_NOT_FOUND',
    `Slack message not found: ${id}`,
  );
}

function convSummary(conv: Conversation) {
  return {
    conv_id: conv.id,
    name: conv.name,
    kind: conv.kind,
    is_private: conv.isPrivate,
    unread_count: conv.unreadCount,
    has_unread: conv.hasUnread,
    muted: conv.muted,
    starred: conv.starred,
    archived: conv.archived,
  };
}

function messageSummary(message: Message) {
  const author = userById(message.userId);
  const conv = state().conversations.find((item) => item.id === message.convId);
  return {
    message_id: message.id,
    conv_id: message.convId,
    conv_name: conv?.name ?? message.convId,
    user_id: message.userId,
    display_name: author?.displayName ?? message.userId,
    handle: author?.handle ?? '',
    text: message.text,
    thread_parent_id: message.threadParentId,
    saved: message.saved,
    pinned: message.pinned,
  };
}

const handlers: Record<string, ToolHandler> = {
  slack__list_conversations: (input) => {
    assertAllowedKeys(input, ['kind', 'limit']);
    const kind = optionalString(input, 'kind', { maxLength: 20 });
    if (kind !== undefined && !(KINDS as readonly string[]).includes(kind)) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"kind" must be one of: channel, dm, group.');
    }
    const rows = state().conversations
      .filter((conv) => !conv.archived)
      .filter((conv) => kind === undefined || conv.kind === kind)
      .map(convSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  slack__search_messages: (input) => {
    assertAllowedKeys(input, ['query', 'in_conv_id', 'from_user_id', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const inConvId = optionalString(input, 'in_conv_id', { maxLength: 200 });
    const fromUserId = optionalString(input, 'from_user_id', { maxLength: 200 });
    const rows = state().messages
      .filter((message) => !message.deleted && !message.system)
      .filter((message) => inConvId === undefined || message.convId === inConvId)
      .filter((message) => fromUserId === undefined || message.userId === fromUserId)
      .filter((message) => {
        const author = userById(message.userId);
        const conv = state().conversations.find((item) => item.id === message.convId);
        return includesQuery([message.text, author?.displayName, author?.handle, conv?.name], query);
      })
      .map(messageSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  slack__search_people: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const rows = state().users
      .filter((user) => includesQuery([user.displayName, user.handle, user.title], query))
      .map((user) => ({
        user_id: user.id,
        display_name: user.displayName,
        handle: user.handle,
        title: user.title,
        online: user.online,
        is_bot: user.isBot,
      }));
    return compactResult(rows, getLimit(input, 50));
  },

  slack__list_saved: (input) => {
    assertAllowedKeys(input, ['limit']);
    const buckets = state().savedBuckets;
    const rows = state().messages
      .filter((message) => message.saved && !message.deleted)
      .map((message) => ({
        ...messageSummary(message),
        bucket: buckets[message.id] ?? 'in_progress',
      }));
    return compactResult(rows, getLimit(input, 50));
  },

  slack__open_conversation: async (input) => {
    assertAllowedKeys(input, ['conv_id']);
    const conv = convById(requireString(input, 'conv_id', { maxLength: 200 }));
    const route = conv.kind === 'channel' ? `/channel/${encodeURIComponent(conv.id)}` : `/dm/${encodeURIComponent(conv.id)}`;
    await openAppRoute('slack', route);
    return { route, conv_id: conv.id };
  },

  slack__send_text_message: (input) => {
    assertAllowedKeys(input, ['conv_id', 'text', 'thread_parent_id', 'also_sent']);
    const conv = convById(requireString(input, 'conv_id', { maxLength: 200 }));
    const text = requireString(input, 'text', { maxLength: 4000 });
    const threadParentId = optionalString(input, 'thread_parent_id', { maxLength: 200 });
    const alsoSent = optionalBoolean(input, 'also_sent', false);
    if (threadParentId) messageById(threadParentId);
    const messageId = state().sendMessage(conv.id, text, { threadParentId: threadParentId ?? null, alsoSent });
    return { message_id: messageId, conv_id: conv.id, also_sent: alsoSent };
  },

  slack__toggle_saved: (input) => {
    assertAllowedKeys(input, ['message_id']);
    const message = messageById(requireString(input, 'message_id', { maxLength: 200 }));
    state().toggleSaved(message.id);
    return { message_id: message.id, saved: messageById(message.id).saved };
  },

  slack__toggle_pinned: (input) => {
    assertAllowedKeys(input, ['message_id']);
    const message = messageById(requireString(input, 'message_id', { maxLength: 200 }));
    state().togglePinned(message.id);
    return { message_id: message.id, pinned: messageById(message.id).pinned };
  },

  slack__create_channel: (input) => {
    assertAllowedKeys(input, ['name', 'is_private']);
    const name = requireString(input, 'name', { maxLength: 80 });
    const isPrivate = input.is_private === undefined ? false : optionalBoolean(input, 'is_private', false);
    const convId = state().createChannel(name, isPrivate);
    return { conv_id: convId, ...convSummary(convById(convId)) };
  },
};

export function executeSlackTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Slack tool: ${name}`)(input);
}

export { SLACK_TOOL_DEFINITIONS } from './definitions';
