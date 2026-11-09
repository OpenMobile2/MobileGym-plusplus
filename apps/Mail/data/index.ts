/**
 * 邮件 App 数据入口 —— 合并 defaults.json 与 constants.ts，导出 MAIL_CONFIG。
 *
 * defaults.json 里的 receivedAt 写的是可读相对偏移（如 "-4h" / "-13d2h"），
 * 在这里统一经 TimeService.resolveDataTimestamp 解析成模拟时间戳，
 * 这样"今天/昨天/星期几"的相对显示逻辑始终跟模拟时钟对齐。
 */
import { resolveDataTimestamp } from '../../../os/TimeService';
import { manifest } from '../manifest';
import { DATA_VERSION } from '../constants';
import defaults from './defaults.json';
import type { Mail, MailAccount, MailContact, MailSettings } from '../types';

const resolvedMails: Mail[] = (defaults.mails as unknown[]).map((raw) => {
  const m = raw as Omit<Mail, 'receivedAt'> & { receivedAt: string | number };
  return { ...m, receivedAt: resolveDataTimestamp(m.receivedAt) } as Mail;
});

export const MAIL_CONFIG = {
  appId: manifest.id,
  dataVersion: DATA_VERSION,
  accounts: defaults.accounts as MailAccount[],
  mails: resolvedMails,
  contacts: defaults.contacts as MailContact[],
  settings: defaults.settings as MailSettings,
};
