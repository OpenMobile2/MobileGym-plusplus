import React from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Sheet, showToast } from './common';
import { IcCart, IcChat, IcHome, IcService, IcUser, IcAlert } from '../res/icons';

/** 全局「...」动作面板(spec chrome.moreMenu,证据 IMG_6034);由页面以 ?panel=more 打开 */
export function MoreMenuSheet() {
  const { bindTap, back } = useTbsgGestures();
  const shops = useTbsgStore((s) => s.shops);
  const recent = useTbsgStore((s) => s.recentShops);
  const recentShops = recent.map((id) => shops.find((x) => x.id === id)).filter(Boolean).slice(0, 5);

  const grid = [
    { key: 'home', label: '回到首页', icon: IcHome, binding: bindTap<HTMLButtonElement>('moremenu.home-open') },
    { key: 'msg', label: '消息中心', icon: IcChat, binding: bindTap<HTMLButtonElement>('moremenu.message-open') },
    { key: 'cart', label: '购物车', icon: IcCart, binding: bindTap<HTMLButtonElement>('moremenu.cart-open') },
    { key: 'mine', label: '个人中心', icon: IcUser, binding: bindTap<HTMLButtonElement>('moremenu.mine-open') },
    {
      key: 'feedback', label: '意见反馈', icon: IcAlert,
      binding: bindTap<HTMLButtonElement>({ kind: 'action', id: 'moremenu.feedback.stub' }, { onTrigger: () => showToast('该功能暂未开放') }),
    },
    { key: 'service', label: '智能客服', icon: IcService, binding: bindTap<HTMLButtonElement>('moremenu.service-open') },
  ];

  return (
    <Sheet>
      <div className="p-4">
        <div className="grid grid-cols-4 gap-y-4">
          {grid.map((g) => (
            <button key={g.key} {...g.binding} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
              <span className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                <g.icon size={20} className="text-[#1A1A1A]" />
              </span>
              <span className="text-[11px] text-[#1A1A1A]">{g.label}</span>
            </button>
          ))}
        </div>
        {recentShops.length > 0 && (
          <>
            <div className="text-[13px] font-semibold text-[#1A1A1A] mt-4 mb-2">最近浏览的店</div>
            <div className="flex gap-3 overflow-x-auto" data-scroll-container="recentshops" data-scroll-direction="horizontal">
              {recentShops.map((sh) => (
                <div
                  key={sh!.id}
                  {...bindTap<HTMLDivElement>('moremenu.recentshop-open', { params: { shopId: sh!.id } })}
                  className="w-14 shrink-0 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <AppImg src={sh!.logo} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="text-[10px] text-[#999999] truncate w-full text-center">{sh!.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'moremenu.panel.close' }, { onTrigger: () => back() })}
          className="w-full h-11 mt-4 rounded-full bg-gray-100 text-[15px] text-[#1A1A1A] border-none cursor-pointer"
        >
          取消
        </button>
      </div>
    </Sheet>
  );
}
