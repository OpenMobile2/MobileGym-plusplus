import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 我的手机号(spec me.phone):修改→确认→输入新号;添加→输入页 */
export default function PhonePage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const { search } = useLocation();
  const showModifyConfirm = new URLSearchParams(search).get('dialog') === 'modifyConfirm';

  const phones = useCainiaoStore((s) => s.phones);
  const showToast = useCainiaoStore((s) => s.showToast);
  const setTemp = useCainiaoStore((s) => s.setTemp);

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="我的手机号" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3" data-scroll-container="main" data-scroll-direction="vertical">
        {phones.map((p) => (
          <div key={p.number} className="mt-2 flex items-center rounded-2xl bg-(--app-c-card-bg) p-4">
            <div>
              <div className="text-[20px] font-extrabold tracking-wide text-(--app-c-text-primary)">{p.number}</div>
              <div className="mt-0.5 text-[13px] text-(--app-c-text-muted)">{p.primary ? '账号绑定手机号' : '取件手机号'}</div>
            </div>
            {p.primary && (
              <button
                {...bindTap('me.phone.modify.open')}
                className="ml-auto cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-4 py-1 text-[14px] text-(--app-c-brand)"
              >
                修改
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="shrink-0 px-4 pb-4">
        <div className="pb-2 text-center text-[13px] text-(--app-c-text-secondary)">
          以上手机号的包裹将自动导入{' '}
          <button
            {...action('me.phone.faq.wontfixToast', () => showToast(t('common.notOpen')))}
            className="cursor-pointer border-none bg-transparent p-0 text-[13px] text-(--app-c-brand)"
          >
            部分包裹无法自动导入?
          </button>
        </div>
        <button
          {...bindTap('me.phone.add.open', {
            onTrigger: () => setTemp({ phoneDraft: '', phoneModifyMode: false }),
          })}
          className="h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
        >
          添加新手机号
        </button>
      </div>

      {showModifyConfirm && <ModifyConfirmDialog />}
    </div>
  );
}

function ModifyConfirmDialog() {
  const { action, bindBack, go } = useCainiaoGestures();
  const setTemp = useCainiaoStore((s) => s.setTemp);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center px-8">
      <div {...bindBack()} className="absolute inset-0 bg-black/45" />
      <div className="relative w-full rounded-2xl bg-(--app-c-card-bg) px-5 pb-5 pt-6 text-center">
        <button {...bindBack()} className="absolute right-3 top-3 cursor-pointer border-none bg-transparent text-[18px] text-(--app-c-text-muted)">✕</button>
        <div className="text-[18px] font-bold text-(--app-c-text-primary)">确定修改吗</div>
        <div className="mt-2 text-[14px] leading-6 text-(--app-c-text-secondary)">修改后将无法查看到该手机号的包裹哦, 请谨慎操作</div>
        <div className="mt-5 flex gap-3">
          <button {...bindBack()} className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)">
            再想想
          </button>
          <button
            {...action('me.phone.modify.confirm', () => {
              setTemp({ phoneDraft: '', phoneModifyMode: true });
              go('me.phone.add.open', {}, { mode: 'replace' });
            })}
            className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  );
}
