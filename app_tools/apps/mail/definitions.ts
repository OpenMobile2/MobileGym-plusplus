import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const MAIL_TOOL_DEFINITIONS = defineAppTools('mail', [
  {
    name: 'search_messages',
    description: 'Search mail by sender name/address, subject, or list preview. Query is required. Trash is excluded. Body blocks and attachment contents are not searched or returned.',
    properties: { query: STRING, account_id: ID, limit: LIMIT },
    required: ['query'],
  },
  {
    name: 'list_mailbox',
    description: 'List compact rows in one mailbox. Use unread, flagged, school:inbox, gmail:inbox, school:drafts, and similar ids. Does not return body text.',
    properties: { mailbox_id: STRING, limit: LIMIT },
    required: ['mailbox_id'],
  },
  {
    name: 'get_message',
    description: 'Return compact metadata for one mail: subject, preview, sender, folder, flags, and attachment names. Full body blocks are not returned; open_message to read them in the GUI.',
    properties: { mail_id: ID },
    required: ['mail_id'],
  },
  {
    name: 'open_message',
    description: 'Open one mail detail page. Read a fresh screenshot after this call.',
    properties: { mail_id: ID },
    required: ['mail_id'],
    kind: 'navigation',
  },
  {
    name: 'open_mailbox',
    description: 'Open one mailbox list. Read a fresh screenshot after this call.',
    properties: { mailbox_id: STRING },
    required: ['mailbox_id'],
    kind: 'navigation',
  },
  {
    name: 'set_read',
    description: 'Mark one mail read or unread.',
    properties: { mail_id: ID, is_read: { type: 'boolean' } },
    required: ['mail_id', 'is_read'],
    kind: 'write',
  },
  {
    name: 'toggle_flag',
    description: 'Toggle the flag on one mail, matching the GUI flag control.',
    properties: { mail_id: ID },
    required: ['mail_id'],
    kind: 'write',
  },
  {
    name: 'prepare_draft',
    description: 'Save a draft and open the compose sheet. Sending remains a GUI tap; this does not send. Pass reply_to_id to mark the original mail replied after send. Pass cc_address to mirror the GUI Cc field.',
    properties: {
      account_id: ID,
      to_address: STRING,
      to_name: STRING,
      cc_address: STRING,
      cc_name: STRING,
      reply_to_id: ID,
      subject: { ...STRING, maxLength: 200 },
      body: { type: 'string', maxLength: 8000 },
    },
    required: ['to_address', 'subject'],
    kind: 'draft',
  },
]);
