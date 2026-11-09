/**
 * 邮件 App 英文 override —— 文案逐字对应 mail_images/ 里的 iOS 26 真机截图。
 * 系统语言为英文时，useAppStrings 会用本文件覆盖 strings.ts。
 */
import type { strings } from './strings';

export const stringsEn: Partial<Record<keyof typeof strings, string>> = {
  // Mailboxes home
  mailboxes: 'Mailboxes',
  edit: 'Edit',
  done: 'Done',
  updated_just_now: 'Updated Just Now',
  checking_for_mail: 'Checking for Mail...',
  new_mailbox: 'New Mailbox',
  mailbox_name: 'Name',
  mailbox_location: 'Mailbox Location',
  cancel: 'Cancel',
  save: 'Save',

  // Smart mailboxes
  mb_unread: 'Unread',
  mb_all_inboxes: 'All Inboxes',
  mb_follow_up: 'Follow Up',
  mb_send_later: 'Send Later',
  mb_flagged: 'Flagged',
  mb_to_or_cc: 'To or Cc',
  mb_attachments: 'Attachments',
  mb_thread_notifications: 'Thread Notifications',
  mb_remind_me: 'Remind Me',
  mb_all_sent: 'All Sent',
  mb_all_trash: 'All Trash',
  mb_all_junk: 'All Junk',

  // Account folders
  folder_inbox: 'Inbox',
  folder_drafts: 'Drafts',
  folder_sent: 'Sent',
  folder_junk: 'Junk',
  folder_trash: 'Trash',

  // Categories
  cat_primary: 'Primary',
  cat_transactions: 'Transactions',
  cat_updates: 'Updates',
  cat_promotions: 'Promotions',
  cat_all_mail: 'All Mail',
  banner_transactions_title: 'Receipts, Orders, and Deliveries',
  banner_transactions_body:
    'Keep track of your orders, including shipping and delivery notices, bundled by sender.',
  banner_updates_title: 'News, Subscriptions, and Social',
  banner_updates_body: 'Stay updated with a place for everything, including newsletters and alerts.',
  banner_promotions_title: 'Promotions and Offers',
  banner_promotions_body: 'Deals, discounts, and marketing email from businesses land here.',

  // List
  no_messages: 'No Messages',
  select: 'Select',
  select_all: 'Select All',
  n_selected: '{n} Selected',
  new_messages: 'New Messages',
  older_messages: 'Older Messages',
  filtered_by: 'Filtered by: ',
  filter_unread: 'Unread',
  categories: 'Categories',
  list_view: 'List View',
  about_categories: 'About Categories',
  show_contact_photos: 'Show Contact Photos',

  // Gestures and menus
  more: 'More',
  flag: 'Flag',
  unflag: 'Unflag',
  trash: 'Trash',
  mark_unread: 'Unread',
  mark_read: 'Mark as Read',
  remind_me: 'Remind Me',
  remind_1h: 'Remind Me in 1 Hour',
  remind_tonight: 'Remind Me Tonight',
  remind_tomorrow: 'Remind Me Tomorrow',
  remind_later: 'Remind Me Later...',
  reply: 'Reply',
  reply_all: 'Reply All',
  forward: 'Forward',
  notify_me: 'Notify Me',
  mute: 'Mute',
  move_message: 'Move Message...',
  move_to_junk: 'Move to Junk',
  move_to: 'Move to',

  // Detail
  n_messages: '{n} Messages',
  from_label: 'From: ',
  to_label: 'To: ',
  see_more: 'See More',
  found_in: 'Found in {mailbox}',
  copy_address: 'Copy Address',
  search_for: 'Search for "{q}"',
  view_contact_card: 'View Contact Card',
  copied: 'Copied',

  // Compose
  new_message: 'New Message',
  to_field: 'To:',
  cc_field: 'Cc:',
  bcc_field: 'Bcc:',
  cc_bcc_from: 'Cc/Bcc, From:',
  from_field: 'From:',
  subject_field: 'Subject:',
  signature: 'Best regards,',
  re_prefix: 'Re: ',
  fwd_prefix: 'Fwd: ',
  quoted_header: '---- Forwarded Message ----',
  save_draft: 'Save Draft',
  delete_draft: 'Delete Draft',
  choose_contact: 'Choose a contact to mail',
  contacts: 'Contacts',
  me: 'me',
  no_subject: 'No Subject',
  no_content: 'This message has no content.',
  attachment_prefix: 'Attachment: ',

  // Search
  search: 'Search',
  all_mailboxes: 'All Mailboxes',
  current_mailbox: 'Current Mailbox',
  top_hits: 'Top Hits',
  suggestions: 'Suggestions',
  sender_contains: 'Sender contains: {q}',
  subject_contains: 'Subject contains: {q}',
  attachment_contains: 'Attachment name contains: {q}',

  // Time
  time_yesterday: 'Yesterday',
  time_today: 'Today at',

  // Common
  feature_unavailable: 'This feature is not available yet',
  toast_sent: 'Sent',
  toast_draft_saved: 'Saved to Drafts',
  invalid_recipient: 'Enter a valid email address',
};
