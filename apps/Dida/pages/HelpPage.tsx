import React, { useState } from 'react';
import { SettingsGroup, SettingsScaffold } from '../components/SettingsScaffold';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useI18n } from '../i18n';
import { useDidaStore } from '../state';

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

const HelpPage: React.FC = () => {
  const { t } = useI18n();
  const { action } = useDidaGestures();
  const showToast = useDidaStore((s) => s.showToast);
  const [openFaq, setOpenFaq] = useState<string | null>('q1');
  const [feedback, setFeedback] = useState('');

  const submit = () => {
    const text = feedback.trim();
    if (!text) {
      showToast(t('help.feedbackEmpty'));
      return;
    }
    setFeedback('');
    showToast(t('help.feedbackSent'));
  };

  return (
    <SettingsScaffold title={t('me.help')}>
      <p className="dida-muted mb-2 px-1 text-[13px]">{t('help.faqSection')}</p>
      <SettingsGroup>
        {FAQ_KEYS.map((key, i) => {
          const open = openFaq === key;
          return (
            <div key={key} style={{ borderBottom: i < FAQ_KEYS.length - 1 ? '1px solid var(--dida-divider)' : undefined }}>
              <button
                {...action('help.faq.toggle', () => setOpenFaq(open ? null : key), { params: { faq: key } })}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="pr-3 text-[15px] font-medium">{t(`help.faq.${key}.q`)}</span>
                <span className="dida-muted text-[18px] leading-none">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <p className="dida-muted px-4 pb-3.5 text-[13px] leading-relaxed">{t(`help.faq.${key}.a`)}</p>
              )}
            </div>
          );
        })}
      </SettingsGroup>

      <p className="dida-muted mb-2 px-1 text-[13px]">{t('help.feedbackSection')}</p>
      <SettingsGroup>
        <div className="px-4 py-3">
          <textarea
            {...action('help.feedback.input', () => undefined, { params: { value: feedback } })}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder={t('help.feedbackPlaceholder')}
            className="w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-[color:var(--dida-muted)]"
            style={{ color: 'var(--dida-text)' }}
          />
        </div>
      </SettingsGroup>
      <button
        {...action('help.feedback.submit', submit)}
        className="dida-on-color mb-4 mt-3 w-full rounded-full py-3.5 text-[16px] font-medium text-white"
        style={{ background: 'var(--dida-accent)', opacity: feedback.trim() ? 1 : 0.45 }}
      >
        {t('help.feedbackSubmit')}
      </button>

      <SettingsGroup>
        <button
          {...action('help.contact.copy', () => showToast(t('help.contactToast')))}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span className="text-[15px]">{t('help.contact')}</span>
          <span className="dida-muted text-[13px]">support@dida.mock</span>
        </button>
      </SettingsGroup>
      <p className="dida-muted mt-3 px-1 text-center text-[12px] leading-relaxed">{t('help.footer')}</p>
    </SettingsScaffold>
  );
};

export default HelpPage;
