import React, { useRef, useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';

/** 输入验证码:输满6位→添加成功 / 修改主号成功并返回 */
export default function PhoneVerifyPage() {
  const { isDark } = useDarkMode();
  const { back } = useCainiaoGestures();
  const phone = useCainiaoStore((s) => s._temp.phoneDraft);
  const modifyMode = useCainiaoStore((s) => s._temp.phoneModifyMode);
  const addPhone = useCainiaoStore((s) => s.addPhone);
  const updatePrimaryPhone = useCainiaoStore((s) => s.updatePrimaryPhone);
  const showToast = useCainiaoStore((s) => s.showToast);
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  const onChange = (v: string) => {
    const digits = v.replace(/[^\d]/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !doneRef.current) {
      doneRef.current = true;
      if (modifyMode) {
        updatePrimaryPhone(phone);
        showToast('修改成功');
      } else {
        addPhone(phone);
        showToast('添加成功');
      }
      // 返回两步:验证码页 → 输入页 → 我的手机号
      back();
      back();
    }
  };

  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="输入验证码" />
      <div className="px-5">
        <div className="mt-6 text-[24px] font-extrabold text-(--app-c-text-primary)">请输入验证码</div>
        <div className="mt-2 text-[14px] text-(--app-c-text-muted)">
          验证码已发送至 {phone ? `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7)}` : ''}(模拟:任意6位)
        </div>
        <div className="relative mt-6" onClick={() => inputRef.current?.focus()}>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`flex h-12 flex-1 items-center justify-center rounded-lg border text-[22px] font-bold text-(--app-c-text-primary) ${
                  i === code.length ? 'border-(--app-c-brand)' : 'border-(--app-c-border)'
                }`}
              >
                {code[i] ?? ''}
              </div>
            ))}
          </div>
          <input
            ref={inputRef}
            data-action="me.phone.verify.input"
            data-action-type="input"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-text border-none bg-transparent text-transparent caret-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
