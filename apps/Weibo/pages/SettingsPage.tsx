import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, TopBar, BottomSheet } from '../components/ui';
import { SETTINGS_ITEMS } from '../constants';
import { IcRight } from '../res/icons';

export default function SettingsPage() {
  const s = useStrings();
  const { bindTap, bindBack, go } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();
  const logout = useWeiboStore((st) => st.logout);

  const sheetOpen = searchParams.get('logout') === 'confirm';
  const closeSheet = () => setSearchParams((p) => { p.delete('logout'); return p; }, { replace: true });

  // ID 必须字符串字面量(AGENTS 合同):逐项字面量绑定;仅「添加小组件/社区管理中心」保留 stub
  const itemBinding = (item: string): object => {
    switch (item) {
      case '账号管理': return bindTap('settings.account-open');
      case '账号与安全': return bindTap('settings.security-open');
      case '会员专属设置': return bindTap('settings.member-open');
      case '通知设置': return bindTap('settings.notification-open');
      case '屏蔽设置': return bindTap('settings.block-open');
      case '隐私设置': return bindTap('settings.privacy-open');
      case '通用设置': return bindTap('settings.general-open');
      case '自定义导航栏': return bindTap('settings.navbar-open');
      case '未成年人模式': return bindTap('settings.teen-open');
      case '关爱模式': return bindTap('settings.care-open');
      case '客服中心': return bindTap('settings.help-open');
      case '关于微博': return bindTap('settings.about-open');
      case '存储空间': return bindTap('settings.storage-open');
      default: return bindTap({ kind: 'action', id: 'settings.item.stub' }, { onTrigger: () => toast(s.notOpen) });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <TopBar backBinding={bindBack()} title={s.settings} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="settings-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          {SETTINGS_ITEMS.map((item) => {
            const binding = itemBinding(item);
            return (
              <button
                key={item}
                {...binding}
                className="flex items-center w-full px-4 py-3.5 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <span className="flex-1 text-[15px] text-[#1A1A1A]">{item}</span>
                {item === '通知设置' && <span className="text-[12px] text-[#9A9A9A] mr-1">可能错过重要信息</span>}
                {item === '自定义导航栏' && <span className="text-[12px] text-[#9A9A9A] mr-1">视频</span>}
                {item === '未成年人模式' && <span className="text-[12px] text-[#9A9A9A] mr-1">未开启</span>}
                <IcRight size={16} className="text-[#CCCCCC]" />
              </button>
            );
          })}
        </div>
        <div className="bg-white mt-3 mb-4">
          <button
            {...bindTap({ kind: 'action', id: 'settings.logoutSheet.open' }, {
              onTrigger: () => setSearchParams((p) => { p.set('logout', 'confirm'); return p; }, { replace: true }),
            })}
            className="block w-full py-3.5 text-center text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer"
          >
            退出当前账号
          </button>
        </div>
        <div className="text-center text-[11px] text-[#BBBBBB] pb-4">《隐私政策》《个人信息收集清单》《第三方合作清单》</div>
      </div>

      {sheetOpen && (
        <BottomSheet
          onClose={closeSheet}
          closeBinding={bindTap({ kind: 'action', id: 'settings.logoutSheet.close' }, { onTrigger: closeSheet })}
        >
          <button
            {...bindTap({ kind: 'action', id: 'settings.logout.submit' }, {
              onTrigger: () => {
                logout();
                closeSheet();
                go('settings.home-open', {});
              },
            })}
            className="block w-full py-3.5 text-[15px] text-[#FF3852] bg-transparent border-none border-b border-[#F5F5F5] cursor-pointer"
          >
            {s.logout}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'settings.logoutSheet.close' }, { onTrigger: closeSheet })}
            className="block w-full py-3.5 text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer mb-2"
          >
            {s.cancel}
          </button>
        </BottomSheet>
      )}
      {toastNode}
    </div>
  );
}
