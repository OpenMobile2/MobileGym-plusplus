import React, { useState } from 'react';
import { useI18n } from '../../i18n';
import { useSlackStore, ME } from '../../state';
import { NEUTRAL } from '../../res/colors';
import { IcAt } from '../../res/icons';
import Avatar from '../Avatar';
import type { Bind } from '../../types';

/**
 * @提及补全列表。工作区全员都能选，不在本频道的人带「不在频道中」灰标；
 * 选中并发送后，输入栏上方会出现「@X 不在此频道中，是否添加？」提示条。
 */
const MentionList: React.FC<{
  memberIds: string[];
  pick: (userId: string) => Bind;
  filterBind: Bind;
  dismiss: Bind;
}> = ({ memberIds, pick, filterBind, dismiss }) => {
  const { t } = useI18n();
  const users = useSlackStore((s) => s.users);
  const [q, setQ] = useState('');

  const term = q.trim().toLowerCase();
  const list = users
    .filter((u) => u.id !== ME && !u.isBot)
    .filter(
      (u) =>
        term === '' ||
        u.handle.toLowerCase().includes(term) ||
        u.displayName.toLowerCase().includes(term),
    );

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...dismiss} className="flex-1" aria-label="close-mention" />
      <div className="max-h-[52%] flex-shrink-0 overflow-hidden rounded-t-2xl border-t border-[#EAEAEA] bg-white">
        <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-4 py-2.5">
          <IcAt size={16} style={{ color: NEUTRAL.textSecondary }} />
          <input
            {...filterBind}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('composer.mention')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
        </div>
        <div
          className="max-h-[240px] overflow-y-auto"
          data-scroll-container="mention"
          data-scroll-direction="vertical"
        >
          {list.map((u) => (
            <button
              key={u.id}
              {...pick(u.id)}
              className="flex w-full items-center gap-2.5 border-none bg-transparent px-4 py-2.5 text-left"
            >
              <Avatar user={u} size={28} rounded="rounded-md" />
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[15px] font-bold"
                  style={{ color: NEUTRAL.textPrimary }}
                >
                  {u.displayName}
                </span>
                <span className="block truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                  @{u.handle}
                </span>
              </span>
              {!memberIds.includes(u.id) && (
                <span
                  className="flex-shrink-0 rounded bg-[#F3F3F3] px-1.5 py-0.5 text-[11px]"
                  style={{ color: NEUTRAL.textSecondary }}
                >
                  {t('mention.notInChannel')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentionList;
