// apps/GoogleDrive/pages/GeminiPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { GEMINI_SUGGESTIONS } from '../constants';
import { IcMenu, IcGemini, IcThumbUp, IcThumbDown, IcMakeCopy, IcClose, IcChevronRight, IcSparkle } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { showToast, ItemIcon } from '../components/common';

// ═══════════════════════════════════════════════════════════
// Ask Gemini（IMG_2252 / 2255）—— 预置问答 + 自由提问兜底回复
// ═══════════════════════════════════════════════════════════
export const GeminiPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindBack } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const turns = useGoogleDriveStore(st => st.geminiTurns);
  const ask = useGoogleDriveStore(st => st.askGemini);
  const [draft, setDraft] = useState('');

  const ctx = sp.get('ctx');
  const item = ctx ? items[ctx] : undefined;

  const sendFreeform = () => {
    const q = draft.trim();
    if (!q) return;
    ask(q, s.gemini_answer_fallback);
    setDraft('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
        <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_close}>
          <IcClose size={22} color={GD.text} />
        </button>
        <span className="text-[18px] flex-1 ml-1" style={{ color: GD.text }}>{s.gemini_title}</span>
        <button
          data-action="googledrive.gemini.history.unavailable"
          onClick={() => showToast(s.toast_feature_unavailable)}
          className="w-11 h-11 flex items-center justify-center"
          aria-label={s.a11y_gemini_history}
        >
          <IcMenu size={20} color={GD.text} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {item && (
          <div className="flex items-center gap-2 py-3">
            <ItemIcon item={item} size={20} />
            <span className="text-[13px] truncate" style={{ color: GD.textSecondary }}>{item.name}</span>
          </div>
        )}
        <div className="flex items-start gap-2 py-3">
          <IcSparkle size={20} color={GD.blue} />
          <div className="text-[15px]" style={{ color: GD.text }}>{s.gemini_greeting}</div>
        </div>

        {turns.map((t, i) => (
          <div key={i} className="py-2">
            <div className="flex justify-end mb-2">
              <div
                className="max-w-[85%] px-3 py-2 rounded-2xl text-[14px] text-left"
                style={{ background: GD.searchBg, color: GD.text }}
              >
                {t.q}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IcGemini size={18} color={GD.blue} />
              <div className="flex-1">
                <div className="text-[14px] leading-relaxed" style={{ color: GD.text }}>{t.a}</div>
                <div className="flex gap-1 mt-2">
                  {[
                    { Icon: IcThumbUp, label: s.a11y_gemini_like, kind: 'like' as const },
                    { Icon: IcThumbDown, label: s.a11y_gemini_dislike, kind: 'dislike' as const },
                    { Icon: IcMakeCopy, label: s.a11y_gemini_copy, kind: 'copy' as const },
                  ].map(b => (
                    <button
                      key={b.label}
                      data-action="googledrive.gemini.feedback"
                      onClick={() => {
                        if (b.kind === 'copy') {
                          window.__OS__?.clipboard?.copyText?.(t.a, 'googledrive');
                        }
                        showToast(s.toast_copied);
                      }}
                      className="w-9 h-9 flex items-center justify-center"
                      aria-label={b.label}
                    >
                      <b.Icon size={16} color={GD.textSecondary} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {turns.length === 0 && (
          <div className="mt-4">
            <div className="text-[12px] mb-2" style={{ color: GD.textSecondary }}>{s.gemini_suggestions_title}</div>
            <div className="flex flex-col gap-2">
              {GEMINI_SUGGESTIONS.map(g => (
                <button
                  key={g.id}
                  data-action="googledrive.gemini.select.suggestion"
                  data-action-params={JSON.stringify({ value: g.id })}
                  onClick={() => ask(s[g.qKey as keyof typeof s], s[g.aKey as keyof typeof s])}
                  className="text-left px-4 py-3 rounded-2xl text-[14px]"
                  style={{ border: `1px solid ${GD.divider}`, color: GD.text }}
                >
                  {s[g.qKey as keyof typeof s]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="h-6" />
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2" data-keep-keyboard="true">
        <div className="text-[11px] mb-2" style={{ color: GD.textSecondary }}>{s.gemini_disclaimer}</div>
        <div className="flex items-center gap-2 h-11 px-3 rounded-full" style={{ background: GD.searchBg }}>
          <input
            data-action="googledrive.gemini.input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') sendFreeform();
            }}
            placeholder={s.gemini_input_placeholder}
            className="flex-1 text-[15px] outline-none bg-transparent"
            style={{ color: GD.text }}
          />
          <button
            data-action="googledrive.gemini.send"
            data-action-params={JSON.stringify({ value: draft.trim() })}
            disabled={!draft.trim()}
            onClick={sendFreeform}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: draft.trim() ? GD.blue : GD.divider }}
            aria-label={s.gemini_input_placeholder}
          >
            <IcChevronRight size={18} color="#fff" className="-rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};
