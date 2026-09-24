/**
 * 邮件 App 文案资源（中文基线）
 *
 * 平台契约：strings.ts 是中文基线，strings.en.ts 是英文 override。
 * useAppStrings 在系统语言为中文时返回本文件，为英文时返回 base + en 合并结果。
 * 真机截图是英文界面，英文那份对应 mail_images/ 里的原文。
 */
export const strings = {
  // 邮箱首页
  mailboxes: '邮箱',
  edit: '编辑',
  done: '完成',
  updated_just_now: '刚刚更新',
  checking_for_mail: '正在检查邮件…',
  new_mailbox: '新建邮箱',
  mailbox_name: '名称',
  mailbox_location: '邮箱位置',
  cancel: '取消',
  save: '存储',

  // 智能邮箱
  mb_unread: '未读',
  mb_all_inboxes: '全部收件箱',
  mb_follow_up: '待跟进',
  mb_send_later: '稍后发送',
  mb_flagged: '已标记',
  mb_to_or_cc: '收件人或抄送',
  mb_attachments: '附件',
  mb_thread_notifications: '话题通知',
  mb_remind_me: '提醒我',
  mb_all_sent: '全部已发送',
  mb_all_trash: '全部废纸篓',
  mb_all_junk: '全部垃圾邮件',

  // 账号文件夹
  folder_inbox: '收件箱',
  folder_drafts: '草稿',
  folder_sent: '已发送',
  folder_junk: '垃圾邮件',
  folder_trash: '废纸篓',

  // 分类
  cat_primary: '主要',
  cat_transactions: '交易',
  cat_updates: '更新',
  cat_promotions: '促销',
  cat_all_mail: '全部邮件',
  banner_transactions_title: '收据、订单与配送',
  banner_transactions_body: '追踪你的订单，包括发货与配送通知，按发件人归集。',
  banner_updates_title: '新闻、订阅与社交',
  banner_updates_body: '把新闻信和各类提醒集中到一处。',
  banner_promotions_title: '促销与优惠',
  banner_promotions_body: '来自商家的优惠、折扣与营销邮件都在这里。',

  // 列表
  no_messages: '没有邮件',
  select: '选择',
  select_all: '全选',
  n_selected: '已选择 {n} 封',
  new_messages: '新邮件',
  older_messages: '较早的邮件',
  filtered_by: '筛选条件：',
  filter_unread: '未读',
  categories: '分类',
  list_view: '列表视图',
  about_categories: '关于分类',
  show_contact_photos: '显示联系人照片',

  // 手势与菜单
  more: '更多',
  flag: '标记',
  unflag: '取消标记',
  trash: '删除',
  mark_unread: '标为未读',
  mark_read: '标为已读',
  remind_me: '提醒我',
  remind_1h: '1 小时后提醒我',
  remind_tonight: '今晚提醒我',
  remind_tomorrow: '明天提醒我',
  remind_later: '稍后提醒我…',
  reply: '回复',
  reply_all: '全部回复',
  forward: '转发',
  notify_me: '通知我',
  mute: '静音',
  move_message: '移动邮件…',
  move_to_junk: '移到垃圾邮件',
  move_to: '移动到',

  // 详情页
  n_messages: '{n} 封邮件',
  from_label: '发件人：',
  to_label: '收件人：',
  see_more: '显示更多',
  found_in: '在 {mailbox} 中找到',
  copy_address: '复制地址',
  search_for: '搜索“{q}”',
  view_contact_card: '查看联系人名片',
  copied: '已复制',

  // 撰写
  new_message: '新邮件',
  to_field: '收件人：',
  cc_field: '抄送：',
  bcc_field: '密送：',
  cc_bcc_from: '抄送/密送，发件人：',
  from_field: '发件人：',
  subject_field: '主题：',
  signature: '此致，',
  re_prefix: '回复：',
  fwd_prefix: '转发：',
  quoted_header: '——— 原始邮件 ———',
  save_draft: '存储草稿',
  delete_draft: '删除草稿',
  choose_contact: '选择要发送邮件的联系人',
  contacts: '联系人',
  me: '我',
  no_subject: '无主题',
  no_content: '此邮件没有内容。',
  attachment_prefix: '附件：',

  // 搜索
  search: '搜索',
  all_mailboxes: '全部邮箱',
  current_mailbox: '当前邮箱',
  top_hits: '最佳结果',
  suggestions: '建议',
  sender_contains: '发件人包含：{q}',
  subject_contains: '主题包含：{q}',
  attachment_contains: '附件名包含：{q}',

  // 时间
  time_yesterday: '昨天',
  time_today: '今天',

  // 通用
  feature_unavailable: '该功能暂未开放',
  toast_sent: '已发送',
  toast_draft_saved: '已存入草稿',
  invalid_recipient: '请输入有效的邮箱地址',
} as const;

export type MailStringKey = keyof typeof strings;
