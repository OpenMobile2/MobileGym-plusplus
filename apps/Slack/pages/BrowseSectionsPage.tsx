import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL, PURPLE } from '../res/colors';
import { IcHash, IcLock, IcDm } from '../res/icons';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';

/** 浏览分区（IMG_2396 / IMG_2397）：两个大胶囊切换「频道 / 私信」。 */
const BrowseSectionsPage: React.FC = () => {
  const { bindTap } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const seg = params.get('seg') ?? '';

  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);

  const list = conversations.filter((c) =>
    seg === 'dms' ? c.kind !== 'channel' : c.kind === 'channel',
  );

  const tabs = [
    { key: '', labelKey: 'browse.channelsTitle', Icon: IcHash },
    { key: 'dms', labelKey: 'dms.title', Icon: IcDm },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('browse.sectionsPageTitle')} />

      <div className="flex flex-shrink-0 gap-3 px-4 pb-3 pt-1">
        {tabs.map((tb) => {
          const on = seg === tb.key;
          return (
            <button
              key={tb.key || 'channels'}
              {...bindTap('slack.browsesections.selectseg', { params: { seg: tb.key } })}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5"
              style={{
                backgroundColor: on ? PURPLE.aubergine : '#FFFFFF',
                borderColor: on ? PURPLE.aubergine : '#DDDDDD',
                color: on ? '#FFFFFF' : NEUTRAL.textPrimary,
                fontWeight: on ? 700 : 400,
              }}
            >
              <tb.Icon size={17} />
              <span className="text-[15px]">{t(tb.labelKey)}</span>
            </button>
          );
        })}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.map((c) => {
          const peer = users.find((u) => u.id === c.memberIds.find((id) => id !== ME));
          return (
            <button
              key={c.id}
              {...bindTap('slack.browsesections.openitem', { params: { convId: c.id } })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              {c.kind === 'channel' ? (
                <span style={{ color: NEUTRAL.textSecondary }}>
                  {c.isPrivate ? <IcLock size={17} /> : <IcHash size={19} />}
                </span>
              ) : (
                <Avatar user={peer} size={26} rounded="rounded-md" presence />
              )}
              <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {c.memberIds.length === 1 ? `${c.name}（${t('common.you')}）` : c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseSectionsPage;
