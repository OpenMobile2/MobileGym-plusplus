import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME, timelineOf } from '../state';
import { NEUTRAL, BLUE, RED } from '../res/colors';
import { IcHash, IcLock, IcCheck } from '../res/icons';
import { formatListTime } from '../utils/format';
import PageHeader, { SegmentTabs } from '../components/PageHeader';
import Avatar from '../components/Avatar';

/**
 * 草稿和已发送（IMG_2418）。三个 tab：草稿 / 预定 / 已发送。
 * 阶段④ 订正：多选态的选择圈在行的**右侧**。
 */
const DraftsPage: React.FC = () => {
  const { bindTap, action, back } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const tab = params.get('tab') ?? '';
  const selecting = params.get('select') === 'on';

  const conversations = useSlackStore((s) => s.conversations);
  const messages = useSlackStore((s) => s.messages);
  const users = useSlackStore((s) => s.users);
  const selection = useSlackStore((s) => s._temp.draftSelection);
  const toggleDraftSelection = useSlackStore((s) => s.toggleDraftSelection);
  const deleteSelectedDrafts = useSlackStore((s) => s.deleteSelectedDrafts);
  const resetDraftSelection = useSlackStore((s) => s.resetDraftSelection);

  const drafts = conversations.filter((c) => c.draft.trim());
  const sent = messages
    .filter((m) => m.userId === ME && !m.deleted && m.threadParentId === null)
    .sort((a, b) => b.ts - a.ts);

  const iconOf = (convId: string) => {
    const c = conversations.find((x) => x.id === convId);
    if (!c) return null;
    if (c.kind === 'channel') {
      return (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          {c.isPrivate ? <IcLock size={15} /> : <IcHash size={17} />}
        </span>
      );
    }
    const peer = users.find((u) => u.id === c.memberIds.find((id) => id !== ME));
    return <Avatar user={peer} size={32} rounded="rounded-lg" />;
  };

  const titleOf = (convId: string) => {
    const c = conversations.find((x) => x.id === convId);
    if (!c) return '';
    return c.kind === 'channel' ? `#${c.name}` : c.name;
  };

  const rightAction = selecting ? (
    <div className="flex items-center gap-3">
      <button
        {...action('slack.drafts.delete.submit', () => {
          deleteSelectedDrafts();
          back();
        })}
        disabled={selection.length === 0}
        className="border-none bg-transparent p-0 text-[16px] font-semibold"
        style={{ color: selection.length === 0 ? '#B5B5B8' : RED.destructive }}
      >
        {t('drafts.delete')}
      </button>
      <button
        {...action('slack.drafts.select.done', () => {
          resetDraftSelection();
          back();
        })}
        className="border-none bg-transparent p-0 text-[16px] font-semibold"
        style={{ color: BLUE.link }}
      >
        {t('drafts.done')}
      </button>
    </div>
  ) : (
    <button
      {...bindTap('slack.drafts.openselect')}
      className="border-none bg-transparent p-0 text-[16px] font-semibold"
      style={{ color: BLUE.link }}
    >
      {t('drafts.edit')}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('drafts.title')} right={tab === '' ? rightAction : undefined} />

      <SegmentTabs
        active={tab}
        items={[
          {
            key: '',
            label: t('drafts.tabDrafts'),
            count: drafts.length,
            bind: bindTap('slack.drafts.selecttab', { params: { tab: '' } }),
          },
          {
            key: 'scheduled',
            label: t('drafts.tabScheduled'),
            bind: bindTap('slack.drafts.selecttab', { params: { tab: 'scheduled' } }),
          },
          {
            key: 'sent',
            label: t('drafts.tabSent'),
            bind: bindTap('slack.drafts.selecttab', { params: { tab: 'sent' } }),
          },
        ]}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === '' &&
          (drafts.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('drafts.empty')}
            </p>
          ) : (
            drafts.map((c) => {
              const picked = selection.includes(c.id);
              const rowProps = selecting
                ? action('slack.drafts.item.toggle', () => toggleDraftSelection(c.id), {
                    params: { convId: c.id },
                  })
                : bindTap('slack.drafts.openitem', { params: { convId: c.id } });
              return (
                <button
                  key={c.id}
                  {...rowProps}
                  className="flex w-full items-start gap-3 border-none bg-transparent px-4 py-3 text-left"
                >
                  {iconOf(c.id)}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline">
                      <span
                        className="truncate text-[16px] font-bold"
                        style={{ color: NEUTRAL.textPrimary }}
                      >
                        {titleOf(c.id)}
                      </span>
                      {!selecting && (
                        <span
                          className="ml-auto pl-2 text-[12px]"
                          style={{ color: NEUTRAL.textSecondary }}
                        >
                          {formatListTime(c.lastActivityTs, locale)}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                      {c.draft}
                    </span>
                  </span>
                  {selecting && (
                    <span
                      className="mt-1 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: picked ? BLUE.link : '#C4C4C6',
                        backgroundColor: picked ? BLUE.link : 'transparent',
                        color: '#FFFFFF',
                      }}
                    >
                      {picked && <IcCheck size={14} />}
                    </span>
                  )}
                </button>
              );
            })
          ))}

        {tab === 'scheduled' && (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('drafts.emptyScheduled')}
          </p>
        )}

        {tab === 'sent' &&
          sent.map((m) => (
            <button
              key={m.id}
              {...bindTap('slack.drafts.openitem', { params: { convId: m.convId } })}
              className="flex w-full items-start gap-3 border-none bg-transparent px-4 py-3 text-left"
            >
              {iconOf(m.convId)}
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline">
                  <span className="truncate text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                    {titleOf(m.convId)}
                  </span>
                  <span className="ml-auto pl-2 text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                    {formatListTime(m.ts, locale)}
                  </span>
                </span>
                <span className="block truncate text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                  {m.text}
                </span>
              </span>
            </button>
          ))}
      </div>
    </div>
  );
};

export default DraftsPage;
