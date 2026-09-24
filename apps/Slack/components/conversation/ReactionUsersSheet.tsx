import React from 'react';
import { useI18n } from '../../i18n';
import { useSlackStore, ME } from '../../state';
import { NEUTRAL } from '../../res/colors';
import Sheet from '../Sheet';
import Avatar from '../Avatar';
import type { Bind, Message } from '../../types';

/** 长按 reaction 胶囊 → 「都有谁点了」名单 */
const ReactionUsersSheet: React.FC<{
  msg: Message;
  emoji: string;
  openProfile: (userId: string) => Bind;
}> = ({ msg, emoji, openProfile }) => {
  const { t } = useI18n();
  const users = useSlackStore((s) => s.users);
  const hit = msg.reactions.find((r) => r.emoji === emoji);
  const ids = hit?.userIds ?? [];

  return (
    <Sheet>
      <h2
        className="flex items-center gap-2 px-4 pb-2 pt-1 text-[15px] font-bold"
        style={{ color: NEUTRAL.textPrimary }}
      >
        <span className="text-[20px]">{emoji}</span>
        {t('reactionUsers.title', { n: ids.length })}
      </h2>
      {ids.map((id) => {
        const u = users.find((x) => x.id === id);
        return (
          <button
            key={id}
            {...openProfile(id)}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
          >
            <Avatar user={u} size={32} rounded="rounded-md" />
            <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
              {u?.displayName}
              {id === ME && (
                <span className="text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                  {` ${t('reactionUsers.you')}`}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </Sheet>
  );
};

export default ReactionUsersSheet;
