import { MAIL_CONFIG } from '@/apps/Mail/data';
import { mailsInMailbox, searchMails, useMailStore } from '@/apps/Mail/state';
import type { Mail } from '@/apps/Mail/types';
import { assertAllowedKeys, optionalString, requireBoolean, requireString, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { MAIL_TOOL_DEFINITIONS } from './definitions';

const state = () => useMailStore.getState();

function mailById(id: string): Mail {
  return requireFound(state().mails.find((mail) => mail.id === id), 'MAIL_NOT_FOUND', `Mail not found: ${id}`);
}

function mailSummary(mail: Mail) {
  return {
    mail_id: mail.id,
    account_id: mail.accountId,
    folder: mail.folder,
    subject: mail.subject,
    preview: mail.preview,
    from_name: mail.from.name,
    from_address: mail.from.address,
    is_read: mail.isRead,
    is_flagged: mail.isFlagged,
    category: mail.category,
    attachment_names: mail.attachments.map((item) => item.name),
  };
}

function resolveAccountId(input: JsonObject): string {
  const raw = optionalString(input, 'account_id', { maxLength: 40 });
  if (raw === undefined) return MAIL_CONFIG.accounts[0].id;
  return requireFound(
    MAIL_CONFIG.accounts.find((account) => account.id === raw),
    'ACCOUNT_NOT_FOUND',
    `Mail account not found: ${raw}`,
  ).id;
}

const handlers: Record<string, ToolHandler> = {
  mail__search_messages: (input) => {
    assertAllowedKeys(input, ['query', 'account_id', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const accountId = optionalString(input, 'account_id', { maxLength: 40 });
    if (accountId !== undefined) resolveAccountId(input);
    const rows = searchMails(state().mails, query)
      .filter((mail) => accountId === undefined || mail.accountId === accountId)
      .map(mailSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  mail__list_mailbox: (input) => {
    assertAllowedKeys(input, ['mailbox_id', 'limit']);
    const mailboxId = requireString(input, 'mailbox_id', { maxLength: 80 });
    const rows = mailsInMailbox(state().mails, mailboxId).map(mailSummary);
    if (rows.length === 0 && mailboxId.includes(':') === false && !['unread', 'all-inboxes', 'follow-up', 'send-later', 'flagged', 'attachments', 'all-sent', 'all-trash', 'all-junk'].includes(mailboxId)) {
      throw new ToolExecutionError('MAILBOX_NOT_FOUND', `Mail mailbox not found: ${mailboxId}`);
    }
    return compactResult(rows, getLimit(input, 50));
  },

  mail__get_message: (input) => {
    assertAllowedKeys(input, ['mail_id']);
    return mailSummary(mailById(requireString(input, 'mail_id', { maxLength: 200 })));
  },

  mail__open_message: async (input) => {
    assertAllowedKeys(input, ['mail_id']);
    const mail = mailById(requireString(input, 'mail_id', { maxLength: 200 }));
    const route = `/message/${encodeURIComponent(mail.id)}`;
    await openAppRoute('mail', route);
    return { route, mail_id: mail.id };
  },

  mail__open_mailbox: async (input) => {
    assertAllowedKeys(input, ['mailbox_id']);
    const mailboxId = requireString(input, 'mailbox_id', { maxLength: 80 });
    const route = `/mailbox/${encodeURIComponent(mailboxId)}`;
    await openAppRoute('mail', route);
    return { route, mailbox_id: mailboxId };
  },

  mail__set_read: (input) => {
    assertAllowedKeys(input, ['mail_id', 'is_read']);
    const mail = mailById(requireString(input, 'mail_id', { maxLength: 200 }));
    const isRead = requireBoolean(input, 'is_read');
    state().setRead([mail.id], isRead);
    return { mail_id: mail.id, is_read: mailById(mail.id).isRead };
  },

  mail__toggle_flag: (input) => {
    assertAllowedKeys(input, ['mail_id']);
    const mail = mailById(requireString(input, 'mail_id', { maxLength: 200 }));
    state().toggleFlag(mail.id);
    return { mail_id: mail.id, is_flagged: mailById(mail.id).isFlagged };
  },

  mail__prepare_draft: async (input) => {
    assertAllowedKeys(input, ['account_id', 'to_address', 'to_name', 'cc_address', 'cc_name', 'reply_to_id', 'subject', 'body']);
    const accountId = resolveAccountId(input);
    const toAddress = requireString(input, 'to_address', { maxLength: 200 });
    const toName = optionalString(input, 'to_name', { maxLength: 80 }) ?? '';
    const ccAddress = optionalString(input, 'cc_address', { maxLength: 200 });
    const ccName = optionalString(input, 'cc_name', { maxLength: 80 }) ?? '';
    const replyToId = optionalString(input, 'reply_to_id', { maxLength: 200 });
    if (replyToId) mailById(replyToId);
    const subject = requireString(input, 'subject', { maxLength: 200 });
    const body = optionalString(input, 'body', { maxLength: 8000 }) ?? '';
    const cc = ccAddress ? [{ name: ccName, address: ccAddress }] : [];
    const before = new Set(state().mails.map((mail) => mail.id));
    state().saveDraft({
      accountId,
      to: [{ name: toName, address: toAddress }],
      cc,
      bcc: [],
      subject,
      body: body ? [{ kind: 'p', text: body }] : [],
      replyToId,
    });
    const draft = state().mails.find((mail) => !before.has(mail.id));
    const draftId = requireFound(draft, 'DRAFT_NOT_SAVED', 'Mail draft was not saved.').id;
    const params = new URLSearchParams({ draft: draftId });
    if (replyToId) {
      params.set('mode', 'reply');
      params.set('src', replyToId);
    }
    const route = `/compose?${params.toString()}`;
    await openAppRoute('mail', route);
    return { route, mail_id: draftId, persisted: true, sent: false, draft_id: draftId, reply_to_id: replyToId ?? null, cc };
  },
};

export function executeMailTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Mail tool: ${name}`)(input);
}

export { MAIL_TOOL_DEFINITIONS } from './definitions';
