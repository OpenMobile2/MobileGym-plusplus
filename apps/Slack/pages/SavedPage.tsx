import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcPlus, IcFilter } from '../res/icons';
import { formatListTime } from '../utils/format';
import PageHeader, { SegmentTabs } from '../components/PageHeader';
import Avatar from '../components/Avatar';

const SavedPage: React.FC = () => {
  const { bindTap, action, bindBack, bindInput, back } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const tab = params.get('tab') ?? '';
  const dialog = params.get('dialog');

  const messages = useSlackStore((s) => s.messages);
  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);
  const savedBuckets = useSlackStore((s) => s.savedBuckets);
  const completeSavedItem = useSlackStore((s) => s.completeSavedItem);
  const addSavedItem = useSlackStore((s) => s.addSavedItem);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const [draft, setDraft] = useState('');

  const savedMessages = messages.filter((m) => m.saved);
  const inProgress = savedMessages.filter((m) => !savedBuckets[m.id]);
  const done = savedMessages.filter((m) => savedBuckets[m.id] === 'done');
  const archived = savedMessages.filter((m) => savedBuckets[m.id] === 'archived');

  const items =
    tab === 'done' ? done : tab === 'archived' ? archived : inProgress;

  const openItemBind = (convId: string, messageId: string) => {
    const c = conversations.find((x) => x.id === convId);
    return c?.kind === 'channel'
      ? bindTap('slack.saved.openitem', { params: { convId, msg: messageId } })
      : bindTap('slack.saved.opendm', { params: { convId, msg: messageId } });
  };

  return (
    <div className="relative flex h-full flex-col bg-white">
      <PageHeader
        title={t('saved.title')}
        right={
          <div className="flex items-center gap-1 rounded-full bg-[#F3F3F3] px-1">
            <button
              {...bindTap('slack.saved.openadd')}
              aria-label="add"
              className="border-none bg-transparent p-2"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcPlus size={18} />
            </button>
            <button
              {...action('slack.saved.filter.toast', notImplemented)}
              aria-label="filter"
              className="border-none bg-transparent p-2"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcFilter size={18} />
            </button>
          </div>
        }
      />

      <SegmentTabs
        active={tab}
        items={[
          {
            key: '',
            label: t('saved.tabInProgress'),
            count: inProgress.length,
            bind: bindTap('slack.saved.selecttab', { params: { tab: '' } }),
          },
          {
            key: 'archived',
            label: t('saved.tabArchived'),
            bind: bindTap('slack.saved.selecttab', { params: { tab: 'archived' } }),
          },
          {
            key: 'done',
            label: t('saved.tabDone'),
            count: done.length,
            bind: bindTap('slack.saved.selecttab', { params: { tab: 'done' } }),
          },
        ]}
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('saved.empty')}
          </p>
        ) : (
          items.map((m) => {
            const u = users.find((x) => x.id === m.userId);
            const conv = conversations.find((c) => c.id === m.convId);
            return (
              <div key={m.id} className="border-b border-[#EAEAEA] px-4 py-3">
                <div className="flex items-baseline">
                  <span className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    {conv?.kind === 'channel' ? `#${conv.name}` : conv?.name}
                  </span>
                  <span className="ml-auto text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                    {formatListTime(m.ts, locale)}
                  </span>
                </div>
                <button
                  {...openItemBind(m.convId, m.id)}
                  className="mt-1.5 flex w-full gap-2.5 border-none bg-transparent p-0 text-left"
                >
                  <Avatar user={u} size={32} rounded="rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                      {u?.displayName}
                    </span>
                    <span className="block text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
                      {m.text}
                    </span>
                  </span>
                </button>
                {tab === '' && (
                  <button
                    {...action('slack.saved.item.done', () => completeSavedItem(m.id, 'done'), {
                      params: { messageId: m.id },
                    })}
                    className="mt-2 rounded-lg border-none px-4 py-2 text-[15px] font-bold text-white"
                    style={{ backgroundColor: GREEN.primary }}
                  >
                    {t('common.done')}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {dialog === 'add' && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/40">
          <div
            {...bindBack()}
            className="absolute inset-0"
            aria-label="dismiss-add"
          />
          <div
            className="relative w-full rounded-t-2xl bg-white px-4 pb-6 pt-4"
            data-keep-keyboard="true"
          >
            <h2 className="text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t('saved.addTitle')}
            </h2>
            <textarea
              {...bindInput('slack.saved.add.input')}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              placeholder={t('saved.addPlaceholder')}
              className="mt-3 w-full resize-none rounded-xl border border-[#DDDDDD] px-3 py-2.5 text-[16px] outline-none"
              style={{ color: NEUTRAL.textPrimary, backgroundColor: NEUTRAL.bgInput }}
            />
            <button
              {...action('slack.saved.add.submit', () => {
                const id = addSavedItem(draft);
                if (!id) return;
                setDraft('');
                showToast(t('saved.addedToast'));
                back();
              })}
              disabled={!draft.trim()}
              className="mt-3 w-full rounded-lg border-none py-3 text-[16px] font-bold text-white disabled:opacity-40"
              style={{ backgroundColor: GREEN.primary }}
            >
              {t('saved.addSubmit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPage;
