import React, { useState } from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import { IcHash, IcLock, IcSearch } from '../res/icons';
import PageHeader from '../components/PageHeader';

/** 浏览频道（IMG_2373）：左「取消」、居中「频道」、右「创建」，下面是搜索框与频道列表。 */
const BrowseChannelsPage: React.FC = () => {
  const { bindTap, bindBack, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const [filter, setFilter] = useState('');
  const conversations = useSlackStore((s) => s.conversations);

  const list = conversations
    .filter((c) => c.kind === 'channel')
    .filter((c) => filter.trim() === '' || c.name.includes(filter.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
        <button
          {...bindBack()}
          className="rounded-full border-none bg-[#F3F3F3] px-3 py-1.5 text-[15px]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          {t('common.cancel')}
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('browse.channelsTitle')}
        </h1>
        <button
          {...bindTap('slack.browsechannels.create')}
          className="rounded-full border-none bg-[#F3F3F3] px-3 py-1.5 text-[15px]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          {t('browse.create')}
        </button>
      </div>

      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 rounded-lg bg-[#F3F3F3] px-3 py-2.5">
          <IcSearch size={17} style={{ color: NEUTRAL.textSecondary }} />
          <input
            {...bindInput('slack.browsechannels.filter.input')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('search.title')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.map((c) => (
          <button
            key={c.id}
            {...bindTap('slack.browsechannels.openchannel', { params: { convId: c.id } })}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <span style={{ color: NEUTRAL.textPrimary }}>
              {c.isPrivate ? <IcLock size={17} /> : <IcHash size={19} />}
            </span>
            <span className="text-[17px] font-semibold" style={{ color: NEUTRAL.textPrimary }}>
              {c.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrowseChannelsPage;
