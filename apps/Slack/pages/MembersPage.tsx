import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL, BLUE } from '../res/colors';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

/** 频道成员列表（IMG_2425） */
const MembersPage: React.FC = () => {
  const { bindTap, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '' } = useParams();

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const users = useSlackStore((s) => s.users);
  const [filter, setFilter] = useState('');

  if (!conv) return null;

  const q = filter.trim().toLowerCase();
  const members = conv.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u) => u && (q === '' || u.displayName.toLowerCase().includes(q) || u.handle.includes(q)));

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title={t('members.listTitle')}
        right={
          <button
            {...bindTap('slack.members.add', { params: { convId } })}
            className="rounded-full border-none px-3 py-1.5 text-[15px] font-semibold"
            style={{ backgroundColor: '#EAF2FA', color: BLUE.link }}
          >
            {t('common.add')}
          </button>
        }
      />

      <div className="px-4 pb-2">
        <input
          {...bindInput('slack.members.filter.input')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('members.searchPlaceholder')}
          className="w-full rounded-lg border border-[#DDDDDD] px-3 py-2 text-[16px] outline-none"
          style={{ color: NEUTRAL.textPrimary, backgroundColor: '#F5F5F5' }}
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {members.map((u) =>
          u ? (
            <button
              key={u.id}
              {...bindTap('slack.members.openprofile', { params: { userId: u.id } })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              <Avatar user={u} size={40} presence rounded="rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                  {u.displayName}
                </span>
                {(u.statusEmoji || u.statusText) && (
                  <span className="block text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                    {u.statusEmoji} {u.statusText}
                  </span>
                )}
              </span>
            </button>
          ) : null,
        )}
      </div>
    </div>
  );
};

export default MembersPage;
