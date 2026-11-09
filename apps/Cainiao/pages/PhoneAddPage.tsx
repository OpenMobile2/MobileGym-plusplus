import React, { useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { IcContact } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 添加/修改手机号(spec me.phone.add,a183;修改复用本页) */
export default function PhoneAddPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const phone = useCainiaoStore((s) => s._temp.phoneDraft);
  const modifyMode = useCainiaoStore((s) => s._temp.phoneModifyMode);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const showToast = useCainiaoStore((s) => s.showToast);
  const [agreed, setAgreed] = useState(false);

  const valid = /^1\d{10}$/.test(phone);

  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="我的手机号" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-6 text-[24px] font-extrabold text-(--app-c-text-primary)">
          {modifyMode ? '输入新的手机号' : '输入我的手机号'}
        </div>
        <div className="mt-2 text-[14px] text-(--app-c-text-muted)">
          {modifyMode ? '验证通过后将更换账号绑定手机号' : '添加后将导入该手机相关包裹'}
        </div>
        <div className="mt-6 flex items-center border-b border-(--app-c-border) pb-2.5">
          <input
            data-action="me.phone.add.input"
            data-action-type="input"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setTemp({ phoneDraft: e.target.value.replace(/[^\d]/g, '').slice(0, 11) })}
            placeholder="请输入手机号"
            className="min-w-0 flex-1 border-none bg-transparent text-[18px] outline-none placeholder:text-(--app-c-text-muted)"
          />
          <button
            {...action('me.phone.add.contacts.wontfixToast', () => showToast(t('common.notOpen')))}
            className="cursor-pointer border-none bg-transparent text-(--app-c-brand)"
          >
            <IcContact size={22} />
          </button>
        </div>

        <div className="mt-8">
          {valid && agreed ? (
            <button
              {...bindTap('me.phone.verify.open')}
              className="h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
            >
              下一步
            </button>
          ) : (
            <div className="flex h-12 w-full items-center justify-center rounded-full bg-[#9BC0F5] text-[16px] font-bold text-white">
              下一步
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center">
          <button
            {...action('me.phone.add.agreement.toggle', () => setAgreed((v) => !v))}
            className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border text-[10px] ${agreed ? 'border-(--app-c-brand) bg-(--app-c-brand) text-white' : 'border-[#BBB] bg-(--app-c-card-bg) text-transparent'}`}
          >
            ✓
          </button>
          <span className="ml-2 text-[13px] text-(--app-c-text-secondary)">已阅读并同意<span className="text-(--app-c-brand)">《服务协议》</span></span>
        </div>
      </div>
    </div>
  );
}
