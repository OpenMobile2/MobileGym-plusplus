/**
 * 搜索页 —— 对照 IMG_2195（初始态）、2196（有结果）、2197（无结果）。
 *
 * 阶段④ 审核决定：不做「点 Suggestion 把关键词变蓝胶囊 + From/To/Message 分段」那套 token 化筛选，
 * 所以下方 Suggestions 三条只作展示、不可点，2198 作废。
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { searchMails, useMailStore } from '../state';
import { SenderAvatar, showToast } from '../components/ui';
import { formatListTime } from '../utils/formatMailTime';
import { IcAttachment, IcChevronRight, IcClose, IcMic, IcPrimary, IcSearch, IcUnread } from '../res/icons';

/** 把命中的关键词高亮成黄底 */
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span style={{ background: '#FFF2A8' }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchPage() {
  const s = useAppStrings(strings, stringsEn);
  const [params, setParams] = useSearchParams();
  const { bindTap, bindBack } = useMailGestures();
  const mails = useMailStore((st) => st.mails);
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);

  const q = params.get('q') ?? '';
  const [scope, setScope] = useState<'all' | 'current'>('all');

  const results = useMemo(() => searchMails(mails, q), [mails, q]);
  const typing = q.trim().length > 0;

  const setQuery = (value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className="flex h-full flex-col bg-white pt-10" data-status-bar-foreground="dark">
      {/* 顶部：Select 置灰 */}
      <div className="flex flex-shrink-0 justify-end px-4 pb-1">
        <span className="rounded-full bg-white/60 px-4 py-1.5 text-[15px]" style={{ color: C.tertiaryLabel }}>
          {s.select}
        </span>
      </div>

      {typing && (
        <div className="flex flex-shrink-0 gap-1 px-4 pb-2">
          {(['all', 'current'] as const).map((sc) => (
            <button
              key={sc}
              {...bindTap({ kind: 'action', id: 'mail.searchScope.select.scope' }, {
                params: { scope: sc },
                onTrigger: () => setScope(sc),
              })}
              className="flex-1 rounded-full py-1.5 text-[15px]"
              style={{
                background: scope === sc ? '#E3E3E8' : 'transparent',
                color: '#000',
              }}
            >
              {sc === 'all' ? s.all_mailboxes : s.current_mailbox}
            </button>
          ))}
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {typing && results.length > 0 && (
          <>
            <SectionHead text={s.top_hits} />
            {results.slice(0, 8).map((m) => (
              <button
                key={m.id}
                {...bindTap('search.result.open', { params: { mailId: m.id } })}
                className="flex w-full items-start gap-2.5 border-b px-4 py-2.5 text-left active:bg-black/[0.04]"
                style={{ borderColor: C.separator }}
              >
                {showPhotos && <SenderAvatar name={m.from.name} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">
                      <Highlight text={m.from.name} q={q} />
                    </span>
                    <span className="flex-shrink-0 text-[13px]" style={{ color: C.secondaryLabel }}>
                      {formatListTime(m.receivedAt, s)}
                    </span>
                    <IcChevronRight size={14} style={{ color: C.tertiaryLabel }} />
                  </div>
                  <div className="truncate text-[15px] text-black">
                    <Highlight text={m.subject || s.no_subject} q={q} />
                  </div>
                  <div className="line-clamp-1 text-[15px]" style={{ color: C.secondaryLabel }}>
                    <Highlight text={m.preview} q={q} />
                  </div>
                </div>
                {m.attachments.length > 0 && (
                  <IcAttachment size={13} className="mt-1" style={{ color: C.secondaryLabel }} />
                )}
              </button>
            ))}
          </>
        )}

        {typing && (
          <>
            <SectionHead text={s.suggestions} />
            {[
              { icon: <IcPrimary size={20} style={{ color: C.accent }} />, text: s.sender_contains },
              { icon: <IcUnread size={20} style={{ color: C.accent }} />, text: s.subject_contains },
              { icon: <IcAttachment size={20} style={{ color: C.accent }} />, text: s.attachment_contains },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b px-4 py-3"
                style={{ borderColor: C.separator }}
              >
                {row.icon}
                <span className="flex-1 truncate text-[16px]" style={{ color: C.secondaryLabel }}>
                  {row.text.replace('{q}', q)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 搜索框：键盘上方 */}
      <div className="flex flex-shrink-0 items-center gap-2 px-3 pb-2" data-keep-keyboard="true">
        <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2.5" style={{ background: '#EFEFF4' }}>
          <IcSearch size={18} style={{ color: C.secondaryLabel }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={s.search}
            data-action="mail.search.type"
            data-action-type="input"
            data-action-params={JSON.stringify({ value: q })}
            className="flex-1 bg-transparent text-[16px] text-black outline-none"
          />
          {q ? (
            <button
              {...bindTap({ kind: 'action', id: 'mail.search.clear' }, { onTrigger: () => setQuery('') })}
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: '#B4B4BB' }}
              aria-label={s.cancel}
            >
              <IcClose size={12} className="text-white" />
            </button>
          ) : (
            <button
              {...bindTap({ kind: 'action', id: 'mail.search.voice' }, {
                onTrigger: () => showToast(s.feature_unavailable),
              })}
              aria-label={s.search}
            >
              <IcMic size={18} style={{ color: C.secondaryLabel }} />
            </button>
          )}
        </div>
        <button
          {...bindBack()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.12)]"
          aria-label={s.cancel}
        >
          <IcClose size={18} />
        </button>
      </div>
    </div>
  );
}

function SectionHead({ text }: { text: string }) {
  return (
    <div className="px-4 pb-1 pt-3 text-[20px] font-bold text-black">{text}</div>
  );
}
