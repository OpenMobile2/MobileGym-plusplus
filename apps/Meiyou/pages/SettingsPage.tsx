/**
 * 设置页(登录态/登出态 + 退出登录确认弹层)。
 * spec: settings.main;证据 frame r8@3 r8@10;qa:Q11=A 其余条目统一 toast。
 */
import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, TopBar, useToast, usePanel } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcArrowRight } from '../res/icons';

type Entry = { name: string; vip?: boolean; loginOnly?: boolean; nav?: 'notif' };

/** 条目分组(frame r8@3/r8@10;亲友模式仅登录态) */
const GROUPS: Entry[][] = [
  [{ name: '账号与安全' }, { name: '帮助与反馈' }],
  [{ name: '青少年模式' }, { name: '亲友模式', loginOnly: true }, { name: '极简模式', vip: true }],
  [{ name: '消息通知', nav: 'notif' }, { name: '智能设备' }, { name: '个人信息与权限' }, { name: '通用' }],
  [{ name: '社区内容偏好调节' }, { name: '社区公约' }],
  [{ name: '关于美柚' }, { name: '分享美柚' }],
];

const AGREEMENTS = ['《个人信息收集清单》', '《第三方信息共享清单》', '《隐私政策》'] as const;

export default function SettingsPage() {
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: confirm, open: openConfirm } = usePanel('confirm');

  const loggedIn = useMeiyouStore((st) => st.loggedIn);
  const logout = useMeiyouStore((st) => st.logout);

  const bindMisc = () =>
    bindTap({ kind: 'action', id: 'settings.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) });

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      <TopBar title={s.settings} />

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4" data-scroll-container="settings-body" data-scroll-direction="vertical">
        {GROUPS.map((group, gi) => {
          const rows = group.filter((e) => !e.loginOnly || loggedIn);
          if (rows.length === 0) return null;
          return (
            <div key={gi} className={`bg-white rounded-2xl px-3 ${gi > 0 ? 'mt-2.5' : ''}`}>
              {rows.map((e, ri) => (
                <button
                  key={e.name}
                  {...(e.nav === 'notif' ? bindTap('meiyou.notifsettings-open') : bindMisc())}
                  className={`w-full flex items-center bg-transparent border-none cursor-pointer text-left ${ri > 0 ? 'border-t border-[#F5F5F7]' : ''}`}
                  style={{ height: 52 }}
                >
                  <span className="text-[15px] text-[#1A1A1A]">{e.name}</span>
                  {e.vip && (
                    <span className="ml-1.5 px-1.5 h-4.5 rounded-full text-[10px] italic font-bold flex items-center" style={{ background: '#F8D8F3', color: '#B0289A', height: 18 }}>
                      VIP
                    </span>
                  )}
                  <span className="flex-1" />
                  <IcArrowRight size={18} className="text-[#CCC]" />
                </button>
              ))}
            </div>
          );
        })}

        {/* 红字按钮:退出登录(登录态)/ 登录(登出态) */}
        {loggedIn ? (
          <button
            {...bindTap({ kind: 'action', id: 'settings.logout.open' }, { onTrigger: () => openConfirm('logout') })}
            className="w-full mt-4 h-11 bg-transparent border-none cursor-pointer text-[16px] text-[#FF2D2D]"
          >
            {s.logout}
          </button>
        ) : (
          <button
            {...bindTap('meiyou.login-open')}
            className="w-full mt-4 h-11 bg-transparent border-none cursor-pointer text-[16px] text-[#FF2D2D]"
          >
            {s.login}
          </button>
        )}

        {/* 页底协议链接×3 */}
        <div className="mt-1 pb-2 flex flex-wrap justify-center gap-x-1 gap-y-0.5">
          {AGREEMENTS.map((a) => (
            <button key={a} {...bindMisc()} className="bg-transparent border-none cursor-pointer text-[11px] text-[#999] p-0">
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* 退出登录确认弹层(URL驱动 confirm=logout,返回键可关) */}
      {confirm === 'logout' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl px-4 pt-5 pb-6">
            <div className="text-center text-[16px] font-semibold text-[#1A1A1A]">确定要退出登录吗?</div>
            <div className="mt-1.5 text-center text-[12px] text-[#999]">你的数据随账号保存</div>
            <button
              {...bindTap({ kind: 'action', id: 'settings.logout.confirm' }, {
                onTrigger: () => { logout(); back(); showToast('已退出'); },
              })}
              className="w-full mt-5 h-11 rounded-full border-none cursor-pointer text-[15px] font-semibold text-[#FF2D2D]"
              style={{ background: '#F5F5F7' }}
            >
              {s.logout}
            </button>
            <button
              {...bindBack()}
              className="w-full mt-2.5 h-11 rounded-full border-none cursor-pointer text-[15px] text-[#666] bg-transparent"
            >
              {s.cancel}
            </button>
          </div>
        </div>
      )}

      {toast}
    </div>
  );
}
