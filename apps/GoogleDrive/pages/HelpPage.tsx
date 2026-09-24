// apps/GoogleDrive/pages/HelpPage.tsx — 帮助和反馈（模拟内容页）
import React, { useState } from 'react';
import { GD } from '../res/colors';
import { IcChevronRight, IcHelp } from '../res/icons';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { SubPageBar, showToast } from '../components/common';

const FAQ_KEYS = [
  { q: 'help_faq1_q', a: 'help_faq1_a' },
  { q: 'help_faq2_q', a: 'help_faq2_a' },
  { q: 'help_faq3_q', a: 'help_faq3_a' },
] as const;

export const HelpPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.drawer_help} closeIcon="back" a11yClose={s.a11y_back} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-5 pt-4 pb-2 flex items-center gap-3">
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: GD.blueSurface }}>
            <IcHelp size={22} color={GD.blue} />
          </span>
          <div>
            <div className="text-[16px]" style={{ color: GD.text }}>{s.help_intro_title}</div>
            <div className="text-[13px]" style={{ color: GD.textSecondary }}>{s.help_intro_desc}</div>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2 text-[13px]" style={{ color: GD.textSecondary }}>{s.help_faq_title}</div>
        {FAQ_KEYS.map(item => {
          const on = openFaq === item.q;
          return (
            <div key={item.q} style={{ borderBottom: `1px solid ${GD.divider}` }}>
              <button
                data-action="googledrive.help.select.faq"
                data-action-params={JSON.stringify({ value: item.q })}
                onClick={() => setOpenFaq(on ? null : item.q)}
                className="w-full flex items-center gap-2 px-5 py-3.5 text-left active:bg-black/5"
              >
                <span className="flex-1 text-[15px]" style={{ color: GD.text }}>{s[item.q]}</span>
                <IcChevronRight
                  size={18}
                  color={GD.textSecondary}
                  className={on ? 'rotate-90' : ''}
                />
              </button>
              {on && (
                <div className="px-5 pb-3 text-[14px] leading-relaxed" style={{ color: GD.textSecondary }}>
                  {s[item.a]}
                </div>
              )}
            </div>
          );
        })}

        <div className="px-5 pt-5 pb-2 text-[13px]" style={{ color: GD.textSecondary }}>{s.help_feedback_title}</div>
        <div className="px-5 pb-3">
          <textarea
            data-action="googledrive.help.feedback.input"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder={s.help_feedback_placeholder}
            rows={4}
            className="w-full text-[14px] outline-none rounded-xl px-3 py-2 resize-none"
            style={{ color: GD.text, background: GD.searchBg, border: `1px solid ${GD.divider}` }}
          />
          <button
            data-action="googledrive.help.feedback.submit"
            disabled={!feedback.trim()}
            onClick={() => {
              if (!feedback.trim()) return;
              showToast(s.toast_feedback_sent);
              setFeedback('');
            }}
            className="mt-3 h-10 px-5 rounded-full text-[14px] text-white disabled:opacity-40"
            style={{ background: GD.blue }}
          >
            {s.help_feedback_submit}
          </button>
        </div>

        <div className="px-5 py-6 text-[12px] leading-relaxed" style={{ color: GD.textSecondary }}>
          {s.help_footer}
        </div>
      </div>
    </div>
  );
};
