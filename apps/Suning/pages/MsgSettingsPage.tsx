import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';

/**
 * 消息提醒设置(spec msg.settings,s302)。
 * 四开关持久化;?dialog=clearConfirm 清空确认 → toast「已清空」(无聊天实体)。
 */
export default function MsgSettingsPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const dialogOpen = searchParams.get('dialog') === 'clearConfirm';

  const msgSettings = useSuningStore((s) => s.msgSettings);
  const toggleMsgSetting = useSuningStore((s) => s.toggleMsgSetting);
  const clearChatSessions = useSuningStore((s) => s.clearChatSessions);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {S.msgSettingsTitle}
        </span>
        <span className="w-7 shrink-0" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-8 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="rounded-xl bg-[var(--app-surface)] px-3 py-3 text-[12px] leading-5 text-[var(--app-text-muted)]">
          {S.msgSettingsHintPrefix}
          <button
            {...action('msg.settings.wontfix.toast', wontfix)}
            className="cursor-pointer border-none bg-transparent p-0 text-[#3B82F6]"
          >
            {S.msgSettingsSystemLink}
          </button>
          {S.msgSettingsHintSuffix}
        </div>

        <div className="mt-2 overflow-hidden rounded-xl bg-[var(--app-surface)]">
          <button
            {...action('msg.settings.chatRemind.toggle', () => toggleMsgSetting('chatRemind'))}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.msgSettingsChatRemind}</span>
            <Toggle on={msgSettings.chatRemind} />
          </button>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl bg-[var(--app-surface)]">
          <div className="px-3 pt-2.5 text-[12px] text-[var(--app-c-text-muted)]">{S.msgSettingsAppSection}</div>
          <button
            {...action('msg.settings.banner.toggle', () => toggleMsgSetting('banner'))}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.msgSettingsBanner}</span>
            <Toggle on={msgSettings.banner} />
          </button>
          <button
            {...action('msg.settings.ring.toggle', () => toggleMsgSetting('ring'))}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.msgSettingsRing}</span>
            <Toggle on={msgSettings.ring} />
          </button>
          <button
            {...action('msg.settings.vibrate.toggle', () => toggleMsgSetting('vibrate'))}
            className="flex w-full cursor-pointer items-center gap-2 bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.msgSettingsVibrate}</span>
            <Toggle on={msgSettings.vibrate} />
          </button>
        </div>

        <button
          {...bindTap('msg.settings.clearConfirm.open')}
          className="mt-6 w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] py-3.5 text-[15px] font-bold text-[var(--app-c-danger)]"
        >
          {S.msgSettingsClearChat}
        </button>
      </div>

      {dialogOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-[var(--app-surface)] px-4 pb-3 pt-5">
            <div className="pb-4 text-center text-[15px] text-[var(--app-text)]">{S.msgSettingsClearAsk}</div>
            <div className="flex gap-2">
              <button
                {...bindBack()}
                className="min-w-0 flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 text-[14px] text-[var(--app-text-muted)]"
              >
                {S.cancel}
              </button>
              <button
                {...action('msg.settings.clearChat.confirm', () => {
                  clearChatSessions();
                  showToast(S.toastMsgCleared);
                  back();
                })}
                className="min-w-0 flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[14px] font-bold text-white"
              >
                {S.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? 'bg-[var(--app-primary)]' : 'bg-[#DDD]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--app-surface)] shadow transition-transform ${
          on ? 'left-5' : 'left-0.5'
        }`}
      />
    </span>
  );
}
