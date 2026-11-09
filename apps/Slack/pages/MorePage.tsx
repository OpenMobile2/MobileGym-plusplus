import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { NEUTRAL } from '../res/colors';
import { IcFile, IcMembers, IcWorkspace } from '../res/icons';
import TopBar from '../components/TopBar';
import QuickActionCards from '../components/QuickActionCards';
import Sheet from '../components/Sheet';

/** 「更多」页（IMG_2393） */
const MorePage: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const sheet = params.get('sheet');
  const isActive = pathname === '/more';

  const rows = [
    {
      key: 'files',
      Icon: IcFile,
      titleKey: 'more.files.title',
      descKey: 'more.files.desc',
      bind: bindTap('slack.more.openfiles'),
    },
    {
      key: 'assigned',
      Icon: IcMembers,
      titleKey: 'more.assigned.title',
      descKey: 'more.assigned.desc',
      bind: bindTap('slack.more.openassigned'),
    },
    {
      key: 'external',
      Icon: IcWorkspace,
      titleKey: 'more.external.title',
      descKey: 'more.external.desc',
      bind: bindTap('slack.more.openexternal'),
    },
  ];

  return (
    <div className="relative flex h-full flex-col bg-white">
      <TopBar variant="title" title={t('more.title')} />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {rows.map((r) => (
          <button
            key={r.key}
            {...r.bind}
            className="flex w-full items-center gap-4 border-b border-[#EAEAEA] bg-transparent px-4 py-4 text-left"
          >
            <r.Icon size={22} style={{ color: NEUTRAL.textPrimary }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[18px]" style={{ color: NEUTRAL.textPrimary }}>
                {t(r.titleKey)}
              </span>
              <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                {t(r.descKey)}
              </span>
            </span>
          </button>
        ))}
      </div>

      {isActive && sheet === 'fabMenu' && (
        <Sheet>
          <QuickActionCards
            huddleProps={bindTap('slack.more.openhuddle')}
            channelProps={bindTap('slack.more.openaddchannel')}
            messageProps={bindTap('slack.more.newmessage')}
          />
        </Sheet>
      )}
    </div>
  );
};

export default MorePage;
