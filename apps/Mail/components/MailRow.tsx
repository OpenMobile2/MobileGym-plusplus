/**
 * 普通邮件列表行 —— 对照 IMG_2168（常态）、2185（未读点）、2187（橙旗）。
 * 三种手势的共存逻辑在 SwipeableRow 里，这里只负责行内容。
 */
import React from 'react';
import { useMailGestures } from '../hooks/useMailGestures';
import { useMailStore } from '../state';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { LAYOUT } from '../constants';
import { formatListTime } from '../utils/formatMailTime';
import { SenderAvatar } from './ui';
import { SwipeableRow, UnreadDot } from './SwipeableRow';
import { IcAttachment, IcChevronRight, IcFlag } from '../res/icons';
import type { Mail } from '../types';

/**
 * 机构类发件人在真机里显示方块楼房图标，个人显示圆形字母头像（对照 IMG_2168 vs 2177）。
 * 用地址的 local part 判断，覆盖 no-reply / billing / news 这类批量发信地址。
 */
const CORPORATE_LOCALPARTS = [
  'no-reply', 'noreply', 'billing', 'deals', 'news', 'events', 'shop', 'hello',
  'welcome', 'cfp', 'editor', 'account-security', 'notification', 'support',
];

export function isCorporateSender(address: string): boolean {
  const local = address.split('@')[0]?.toLowerCase() ?? '';
  return CORPORATE_LOCALPARTS.some((p) => local.startsWith(p));
}

export const MailRow: React.FC<{
  mail: Mail;
  mailboxId: string;
  /** Drafts / Sent 这类邮箱显示收件人而不是发件人 */
  showRecipient?: boolean;
}> = ({ mail, mailboxId, showRecipient }) => {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);

  const who = showRecipient ? mail.to[0]?.name || mail.to[0]?.address || '' : mail.from.name;
  const isCorporate = !showRecipient && isCorporateSender(mail.from.address);

  return (
    <SwipeableRow
      mail={mail}
      mailboxId={mailboxId}
      tapBinding={bindTap('message.open', { params: { mailId: mail.id } })}
    >
      <UnreadDot unread={!mail.isRead} />
      {showPhotos && <SenderAvatar name={who || '?'} size={LAYOUT.avatarSize} corporate={isCorporate} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">
            {who || mail.from.address}
          </span>
          <span className="flex-shrink-0 text-[13px]" style={{ color: C.secondaryLabel }}>
            {formatListTime(mail.receivedAt, s)}
          </span>
          {mail.isFlagged && <IcFlag size={13} style={{ color: C.flagOrange }} />}
          <IcChevronRight size={14} style={{ color: C.tertiaryLabel }} />
        </div>
        <div className="truncate text-[15px] text-black">{mail.subject || s.no_subject}</div>
        <div className="flex items-start gap-1">
          <span className="line-clamp-2 flex-1 text-[15px] leading-[1.28]" style={{ color: C.secondaryLabel }}>
            {mail.preview || s.no_content}
          </span>
          {mail.attachments.length > 0 && (
            <IcAttachment size={13} className="mt-1 flex-shrink-0" style={{ color: C.secondaryLabel }} />
          )}
        </div>
      </div>
    </SwipeableRow>
  );
};
