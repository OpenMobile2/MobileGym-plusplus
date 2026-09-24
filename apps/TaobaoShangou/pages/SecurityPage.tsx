import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar, showToast } from '../components/common';
import { IcRight } from '../res/icons';

/** 开关(与通知设置一致的胶囊样式) */
function Switch({ on }: { on: boolean }) {
  return (
    <span className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${on ? 'bg-[#ED6C2C] justify-end' : 'bg-[#DDDDDD] justify-start'}`}>
      <span className="w-5 h-5 rounded-full bg-white" />
    </span>
  );
}

const TOGGLES: { which: 'face' | 'loginPwd' | 'payPwd'; label: string; key: 'faceLogin' | 'loginPwdSet' | 'payPwdSet'; onText: string; offText: string }[] = [
  { which: 'face', label: '面容登录', key: 'faceLogin', onText: '已开启', offText: '未开启' },
  { which: 'loginPwd', label: '登录密码', key: 'loginPwdSet', onText: '已设置', offText: '未设置' },
  { which: 'payPwd', label: '支付密码', key: 'payPwdSet', onText: '已设置', offText: '未设置' },
];

/** 账号与安全页(spec settings.security,证据 IMG_6040) */
export default function SecurityPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const settings = useTbsgStore((st) => st.settings);
  const updateSettings = useTbsgStore((st) => st.updateSettings);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="账号与安全" titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        <div className="bg-white mt-2.5">
          {TOGGLES.map(({ which, label, key, onText, offText }) => {
            const on = settings[key];
            return (
              <button
                key={which}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'security.switch.toggle' },
                  { params: { which }, onTrigger: () => updateSettings({ [key]: !on }) },
                )}
                className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
              >
                <span className="text-[16px] text-[#1A1A1A]">{label}</span>
                <div className="flex-1" />
                <span className="text-[13px] text-[#999999] mr-2.5">{on ? onText : offText}</span>
                <Switch on={on} />
              </button>
            );
          })}
          {/* 注销账号(不可逆,保持 stub) */}
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'security.misc.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-[16px] text-[#1A1A1A]">注销账号</span>
            <div className="flex-1" />
            <span className="text-[13px] text-[#999999] mr-1">注销后账号无法恢复,请谨慎操作</span>
            <IcRight size={16} className="text-[#BBBBBB]" />
          </button>
        </div>
      </div>
    </div>
  );
}
