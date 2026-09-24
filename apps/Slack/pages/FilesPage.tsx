import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { FILE_SCOPE_FILTERS, FILE_TYPE_OPTIONS } from '../constants';
import { NEUTRAL, BLUE } from '../res/colors';
import { IcFile, IcImage, IcLink, IcClose, IcChevronDown } from '../res/icons';
import { formatListTime } from '../utils/format';
import { attachmentFileType } from '../utils/fileTypes';
import PageHeader from '../components/PageHeader';
import Sheet from '../components/Sheet';

const FilesPage: React.FC = () => {
  const { bindTap, action, bindBack } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const scope = params.get('scope') ?? 'all';
  const sheet = params.get('sheet');

  const messages = useSlackStore((s) => s.messages);
  const settings = useSlackStore((s) => s.settings);
  const toggleFileTypeFilter = useSlackStore((s) => s.toggleFileTypeFilter);

  const allItems = useMemo(
    () =>
      messages
        .filter((m) => !m.deleted && m.attachments.length > 0)
        .flatMap((m) =>
          m.attachments.map((a) => ({
            ...a,
            convId: m.convId,
            ts: m.ts,
            mid: m.id,
            userId: m.userId,
            saved: m.saved,
            fileType: attachmentFileType(a),
          })),
        )
        .sort((a, b) => b.ts - a.ts),
    [messages],
  );

  const items = useMemo(() => {
    let list = allItems.filter((a) => settings.fileTypeFilters.includes(a.fileType));
    if (scope === 'starred') list = list.filter((a) => a.saved);
    if (scope === 'created') list = list.filter((a) => a.userId === ME);
    if (scope === 'shared') list = list.filter((a) => a.userId !== ME);
    return list;
  }, [allItems, scope, settings.fileTypeFilters]);

  const typeCount = settings.fileTypeFilters.length;
  const tint: Record<string, string> = { image: '#C48A2E', file: '#1264A3', link: '#007A5A' };

  const chipStyle = (on: boolean) => ({
    backgroundColor: on ? BLUE.link : '#F3F3F3',
    color: on ? '#FFFFFF' : NEUTRAL.textPrimary,
  });

  const openFileBind = (convId: string) =>
    bindTap('slack.files.openconversation', { params: { convId } });

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('files.title')} />

      <div
        className="flex flex-shrink-0 gap-2 overflow-x-auto px-3 py-2"
        data-scroll-direction="horizontal"
      >
        <button
          {...bindTap('slack.files.opentypefilter')}
          className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
          style={chipStyle(true)}
        >
          {t('files.typeCount', { count: typeCount })} ⌄
        </button>
        {FILE_SCOPE_FILTERS.map((f) => (
          <button
            key={f.id}
            {...bindTap('slack.files.switchfilter', { params: { scope: f.id } })}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
            style={chipStyle(scope === f.id)}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 px-4 py-2">
        <span className="text-[14px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('files.recentViewed')}
        </span>
        <IcChevronDown size={14} style={{ color: NEUTRAL.textSecondary }} />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[48px]">📁</p>
            <p className="mt-4 text-[20px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t('files.emptyTitle')}
            </p>
            <p className="mt-2 text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('files.emptyDesc')}
            </p>
          </div>
        ) : (
          items.map((a) => (
            <button
              key={`${a.mid}-${a.name ?? a.url}`}
              {...openFileBind(a.convId)}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
            >
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: tint[a.kind] ?? '#8E8E93' }}
              >
                {a.kind === 'image' ? (
                  <IcImage size={20} />
                ) : a.kind === 'link' ? (
                  <IcLink size={20} />
                ) : (
                  <IcFile size={20} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                  {a.name ?? a.title ?? a.url}
                </span>
                <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                  {t('files.lastViewed', { time: formatListTime(a.ts, locale) })}
                  {a.size ? ` · ${a.size}` : ''}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      {sheet === 'typeFilter' && (
        <Sheet handle={false} className="max-h-[85%]">
          <div className="flex items-center justify-between px-4 pb-2 pt-3">
            <button
              {...bindBack()}
              className="border-none bg-transparent p-1"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcClose size={22} />
            </button>
            <h2 className="text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t('files.typeSheetTitle')}
            </h2>
            <button
              {...bindBack()}
              className="border-none bg-transparent text-[16px] font-bold"
              style={{ color: BLUE.link }}
            >
              {t('common.done')}
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pb-4">
            {FILE_TYPE_OPTIONS.map((opt) => {
              const on = settings.fileTypeFilters.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  {...action('slack.files.toggletype', () => toggleFileTypeFilter(opt.id))}
                  className="flex w-full items-center justify-between border-none bg-transparent px-4 py-3.5 text-left"
                >
                  <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                    {t(opt.labelKey)}
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: on ? BLUE.link : '#C9C9C9',
                      backgroundColor: on ? BLUE.link : 'transparent',
                    }}
                  >
                    {on && <span className="text-[12px] text-white">✓</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default FilesPage;
