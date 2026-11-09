import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcChevronRight, IcMore } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';

const AVATAR = '/@app-assets/Suning/me/avatar-lion.png';

/**
 * 个人信息(spec me.profile,s316)。
 * 昵称编辑走 ?dialog=nickname(Q7=A,≤20 字),保存同步 me.main 头像区。
 */
export default function ProfilePage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const dialogOpen = searchParams.get('dialog') === 'nickname';

  const user = useSuningStore((s) => s.user);
  const nicknameDraft = useSuningStore((s) => s._temp.nicknameDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const setNickname = useSuningStore((s) => s.setNickname);
  const showToast = useSuningStore((s) => s.showToast);

  const wontfix = () => showToast(S.toastNotOpen);
  const draft = nicknameDraft || user.nickname;

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {S.profileTitle}
        </span>
        <button
          {...action('me.profile.wontfix.toast', wontfix)}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcMore size={20} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-8 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
          <button
            {...action('me.profile.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-3 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.profileAvatar}</span>
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
              <Img src={AVATAR} className="h-full w-full object-cover" />
            </span>
            <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
          </button>
          <button
            {...bindTap('me.profile.nickname.open', {
              beforeTrigger: () => setTemp({ nicknameDraft: user.nickname }),
            })}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.profileNickname}</span>
            <span className="shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{user.nickname}</span>
            <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
          </button>
          <button
            {...action('me.profile.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left"
          >
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.profileComplete}</span>
            <span className="shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.profileIncomplete}</span>
            <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
          </button>
          <div className="flex items-center gap-2 px-3 py-3.5">
            <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{S.profileRegistered}</span>
            <span className="shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{user.registeredAt}</span>
          </div>
        </div>

        <button
          {...action('me.profile.wontfix.toast', wontfix)}
          className="mt-3 w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] py-3.5 text-[14px] text-[var(--app-c-danger)]"
        >
          {S.profileDeleteInfo}
        </button>

        <div className="mt-3 rounded-xl bg-[var(--app-surface)] px-3 py-3">
          <div className="pb-1 text-[13px] font-bold text-[var(--app-text)]">{S.profileAuthTitle}</div>
          <div className="text-[12px] leading-5 text-[var(--app-c-text-muted)]">{S.profileAuthDesc}</div>
        </div>
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-3 text-[11px] leading-4 text-[var(--app-c-text-muted)]">
          {S.profileTip}
        </div>
      </div>

      {dialogOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-[var(--app-surface)] px-4 pb-3 pt-5">
            <div className="pb-3 text-center text-[15px] font-bold text-[var(--app-text)]">
              {S.profileNicknameEdit}
            </div>
            <input
              value={draft}
              maxLength={20}
              onChange={(e) => setTemp({ nicknameDraft: e.target.value.slice(0, 20) })}
              className="mb-3 w-full rounded-lg border border-[var(--app-border)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--app-primary)]"
            />
            <div className="flex gap-2">
              <button
                {...bindBack()}
                className="min-w-0 flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 text-[14px] text-[var(--app-text-muted)]"
              >
                {S.cancel}
              </button>
              <button
                {...action('me.profile.nickname.save', () => {
                  setNickname(draft);
                  showToast(S.toastNicknameSaved);
                  back();
                })}
                className="min-w-0 flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[14px] font-bold text-white"
              >
                {S.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
