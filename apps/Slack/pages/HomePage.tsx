import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { GUIDE_CARDS, QUICK_VIEW_CARDS } from '../constants';
import { NEUTRAL, BLUE } from '../res/colors';
import { IconRenderer, IcChevronRight, IcChevronUp, IcChevronDown, IcPlus, IcHash, IcDm } from '../res/icons';
import TopBar from '../components/TopBar';
import ConversationRow from '../components/ConversationRow';
import Sheet from '../components/Sheet';
import QuickActionCards from '../components/QuickActionCards';
import WorkspaceDrawer from '../components/home/WorkspaceDrawer';
import RowMenu from '../components/home/RowMenu';
import { SortMenu, CustomizeSheet, CustomizeItemMenu, AddChannelMenu } from '../components/home/HomeMenus';
import type { Bind, Conversation } from '../types';

/** 快速视图卡（抱团 / 留待以后处理 / 草稿和已发送）+ 右侧齿轮 */
const QuickViewStrip: React.FC = () => {
  const { bindTap } = useSlackGestures();
  const { t } = useI18n();
  const order = useSlackStore((s) => s.settings.customizeOrder);
  const enabled = useSlackStore((s) => s.settings.customizeEnabled);
  const savedCount = useSlackStore(
    (s) => s.messages.filter((m) => m.saved && !s.savedBuckets[m.id]).length,
  );
  const draftCount = useSlackStore((s) => s.conversations.filter((c) => c.draft.trim()).length);

  const binds: Record<string, Bind> = {
    huddle: bindTap('slack.home.openhuddle'),
    saved: bindTap('slack.home.opensaved'),
    drafts: bindTap('slack.home.opendrafts'),
    unreadTidy: bindTap('slack.home.openunreads'),
  };
  const subOf = (id: string) => {
    if (id === 'huddle') return t('quick.huddleActive', { n: 0 });
    if (id === 'saved') return t('quick.itemCount', { n: savedCount });
    return t('quick.itemCount', { n: draftCount });
  };

  const cards = order
    .map((id) => QUICK_VIEW_CARDS.find((c) => c.id === id))
    .filter((c): c is (typeof QUICK_VIEW_CARDS)[number] => Boolean(c?.showOnHome && enabled[c.id]));

  return (
    <div className="relative">
      <div
        className="flex gap-3 overflow-x-auto px-4 py-3 pr-14"
        data-scroll-container="quickview"
        data-scroll-direction="horizontal"
      >
        {cards.map((c) => (
          <button
            key={c.id}
            {...binds[c.id]}
            className="w-[152px] flex-shrink-0 rounded-xl border border-[#E4E4E4] bg-white p-3 text-left"
          >
            <IconRenderer name={c.icon} size={21} style={{ color: NEUTRAL.textPrimary }} />
            <p className="mt-2 text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
              {t(c.labelKey)}
            </p>
            <p className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {subOf(c.id)}
            </p>
          </button>
        ))}
      </div>
      <button
        {...bindTap('slack.home.opencustomize')}
        aria-label={t('quick.customize')}
        className="absolute right-[-14px] top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#E4E4E4] bg-white"
        style={{ color: NEUTRAL.textSecondary }}
      >
        <IconRenderer name="IcGear" size={20} />
      </button>
    </div>
  );
};

const SectionHeader: React.FC<{
  sectionId: string;
  icon: 'channel' | 'dm' | 'star';
  label: string;
  collapsed: boolean;
}> = ({ sectionId, icon, label, collapsed }) => {
  const { bindTap, action } = useSlackGestures();
  const toggleSection = useSlackStore((s) => s.toggleSection);
  return (
    <div className="flex items-center px-4 pb-1 pt-4">
      <button
        {...bindTap('slack.home.opensections')}
        className="flex flex-1 items-center gap-2.5 border-none bg-transparent p-0 text-left"
        style={{ color: NEUTRAL.textPrimary }}
      >
        {icon === 'dm' ? <IcDm size={19} /> : <IcHash size={19} />}
        <span className="text-[17px] font-bold">{label}</span>
        <IcChevronRight size={15} style={{ color: NEUTRAL.textSecondary }} />
      </button>
      <button
        {...action('slack.home.section.toggle', () => toggleSection(sectionId), {
          params: { sectionId },
        })}
        aria-label={`toggle-${sectionId}`}
        className="border-none bg-transparent p-1"
        style={{ color: NEUTRAL.textSecondary }}
      >
        {collapsed ? <IcChevronDown size={20} /> : <IcChevronUp size={20} />}
      </button>
    </div>
  );
};

const GuideCards: React.FC = () => {
  const { bindTap, action } = useSlackGestures();
  const { t } = useI18n();
  const cleared = useSlackStore((s) => s._temp.guideCleared);
  const clearGuideCards = useSlackStore((s) => s.clearGuideCards);
  const notImplemented = useSlackStore((s) => s.notImplemented);
  const firstChannel = useSlackStore(
    (s) => s.conversations.find((c) => c.kind === 'channel')?.id ?? '',
  );

  if (cleared) return null;

  const binds: Record<string, Bind> = {
    addMembers: bindTap('slack.home.guide.addmembers', { params: { convId: firstChannel } }),
    sendMessage: bindTap('slack.home.guide.sendmessage'),
    desktop: action('slack.home.guide.desktop.toast', notImplemented),
    tips: action('slack.home.guide.tips.toast', notImplemented),
  };
  const tints: Record<string, string> = {
    addMembers: '#F5D9C8',
    sendMessage: '#E8D4F2',
    desktop: '#D6E4F0',
    tips: '#FBE8C0',
  };

  return (
    <div className="mt-3 border-t border-[#EAEAEA] pt-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('guide.title')}
        </h2>
        <button
          {...action('slack.home.guide.clearall', clearGuideCards)}
          className="border-none bg-transparent p-0 text-[15px] font-semibold"
          style={{ color: BLUE.link }}
        >
          {t('guide.clearAll')}
        </button>
      </div>
      <div className="mt-2">
        {GUIDE_CARDS.map((c) => (
          <button
            key={c.id}
            {...binds[c.id]}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <span
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: tints[c.id], color: NEUTRAL.textPrimary }}
            >
              <IconRenderer name={c.icon} size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[16px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                {t(c.labelKey)}
              </span>
              <span className="block text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                {t(`guide.${c.id}Desc`)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap, bindLongPress } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const isActive = pathname === '/';

  const conversations = useSlackStore((s) => s.conversations);
  const sections = useSlackStore((s) => s.sections);
  const users = useSlackStore((s) => s.users);
  const homeSort = useSlackStore((s) => s.settings.homeSort);
  const unreadSort = useSlackStore((s) => s.settings.unreadSort);

  const visibleConversations = conversations.filter((c) => !c.archived);

  const drawer = params.get('drawer');
  const modal = params.get('modal');
  const sheet = params.get('sheet');
  const menu = params.get('menu');

  const nameOf = (c: Conversation) =>
    c.kind === 'dm' && c.memberIds.length === 1
      ? `${c.name}（${t('common.you')}）`
      : c.name;

  const rowOf = (c: Conversation, compact = true) => (
    <ConversationRow
      key={c.id}
      conv={{ ...c, name: nameOf(c) }}
      users={users}
      compact={compact}
      tapProps={
        c.kind === 'channel'
          ? bindTap('slack.home.openchannel', { params: { convId: c.id } })
          : bindTap('slack.home.opendm', { params: { convId: c.id } })
      }
      longPressProps={
        c.kind === 'channel'
          ? bindLongPress('slack.home.openrowmenu', { params: { convId: c.id } })
          : undefined
      }
    />
  );

  const sortRows = (list: Conversation[]) => {
    const byTime = [...list].sort((a, b) => b.lastActivityTs - a.lastActivityTs);
    if (unreadSort !== 'top') return byTime;
    return [
      ...byTime.filter((c) => c.hasUnread || c.unreadCount > 0),
      ...byTime.filter((c) => !(c.hasUnread || c.unreadCount > 0)),
    ];
  };

  const sectionLabel = (id: string) => {
    if (id === 's_channels') return t('home.sectionChannels');
    if (id === 's_dms') return t('home.sectionDms');
    return t('home.sectionStarred');
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar variant="home" />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <QuickViewStrip />

        {homeSort === 'recent' ? (
          <div className="border-t border-[#EAEAEA] pt-1">
            {sortRows(visibleConversations).map((c) => rowOf(c))}
          </div>
        ) : (
          sections.map((sec) => {
            const list = visibleConversations.filter((c) => c.sectionId === sec.id);
            if (list.length === 0 && sec.id === 's_starred') return null;
            return (
              <div key={sec.id}>
                <SectionHeader
                  sectionId={sec.id}
                  icon={sec.id === 's_dms' ? 'dm' : 'channel'}
                  label={sectionLabel(sec.id)}
                  collapsed={sec.collapsed}
                />
                {!sec.collapsed && (
                  <>
                    {sortRows(list).map((c) => rowOf(c))}
                    {sec.id === 's_channels' && (
                      <button
                        {...bindTap('slack.home.openaddchannel')}
                        className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
                        style={{ color: NEUTRAL.textSecondary }}
                      >
                        <IcPlus size={19} />
                        <span className="text-[16px]">{t('home.addChannel')}</span>
                      </button>
                    )}
                    {sec.id === 's_dms' && (
                      <button
                        {...bindTap('slack.home.newmessage')}
                        className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
                        style={{ color: NEUTRAL.textSecondary }}
                      >
                        <IcPlus size={19} />
                        <span className="text-[16px]">{t('home.newMessage')}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        <GuideCards />
        <div className="h-6" />
      </div>

      {isActive && drawer === 'workspace' && <WorkspaceDrawer />}
      {isActive && modal === 'sort' && <SortMenu />}
      {isActive && modal === 'customize' && <CustomizeSheet />}
      {isActive && modal === 'customize' && menu === 'item' && <CustomizeItemMenu />}
      {isActive && menu === 'addChannel' && <AddChannelMenu />}
      {isActive && sheet === 'channelRow' && <RowMenu />}
      {isActive && sheet === 'fabMenu' && (
        <Sheet>
          <QuickActionCards
            huddleProps={bindTap('slack.fabmenu.openhuddle')}
            channelProps={bindTap('slack.fabmenu.openaddchannel')}
            messageProps={bindTap('slack.fabmenu.newmessage')}
          />
        </Sheet>
      )}
    </div>
  );
};

export default HomePage;
