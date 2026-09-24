import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { fmt } from '../utils';
import { AppImg, EmptyState, TopBar, showToast } from '../components/common';
import { IcPlus, IcShop } from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 好友拼单详情页(spec shop.groupOrder,IMG_6045) */
export default function GroupOrderPage() {
  const { shopId = '' } = useParams();
  const { bindTap } = useTbsgGestures();
  const s = useAppStrings(strings, stringsEn);

  const shops = useTbsgStore((st) => st.shops);
  const user = useTbsgStore((st) => st.user);
  const shop = shops.find((x) => x.id === shopId);

  if (!shop) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <TopBar title={s.groupTitle} />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const sellPoints = [s.groupSell1, s.groupSell2, s.groupSell3];

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={s.groupTitle} />

      <div className="flex-1 overflow-y-auto min-h-0" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 白卡1:店名 + 成员头像 + 邀请好友 + 卖点 */}
        <div className="bg-white rounded-xl mx-3 mt-2 px-3.5 py-3.5">
          <div className="flex items-center">
            <IcShop size={20} className="text-[#1A1A1A] shrink-0" />
            <span className="ml-2 text-[18px] font-bold text-[#1A1A1A] flex-1 min-w-0 truncate">{shop.name}</span>
            <button
              {...bindTap<HTMLButtonElement>('group.cancel', { params: { shopId: shop.id } })}
              className="shrink-0 h-8 px-3 rounded-lg bg-[#F3F6F8] text-[#1A1A1A] text-[14px] border-none cursor-pointer"
            >
              {s.groupCancel}
            </button>
          </div>

          {/* 成员头像区 */}
          <div className="flex items-start justify-center gap-9 mt-6">
            <div className="relative w-[72px]">
              <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden">
                <AppImg src={user.avatar} className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-black/35 flex items-center justify-center text-white text-[13px]">
                  {s.groupShopping}
                </span>
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 bg-[#ED6C2C] text-white text-[11px] rounded-md px-1.5 py-px">
                {s.groupInitiate}
              </span>
            </div>
            <span className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-[#F0B48C] bg-[#FDF4EC] flex items-center justify-center">
              <IcPlus size={30} className="text-[#ED6C2C]" />
            </span>
          </div>

          {/* 邀请好友 */}
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'group.invite.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="w-full h-12 mt-7 rounded-lg bg-[#ED6C2C] text-white text-[18px] font-bold border-none cursor-pointer"
          >
            {s.groupInvite}
          </button>

          {/* 三卖点 */}
          <div className="flex items-center justify-between px-1 mt-3.5">
            {sellPoints.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-[13px] text-[#5A5A5A]">
                <span className="w-4 h-4 rounded-full border border-[#0BA05C] text-[#0BA05C] text-[10px] flex items-center justify-center">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 白卡2:成员条目 */}
        <div className="bg-white rounded-xl mx-3 mt-2.5 px-3.5 py-3.5">
          <div className="flex items-center">
            <span className="relative shrink-0">
              <AppImg src={user.avatar} className="w-11 h-11 rounded-full object-cover" />
              <span className="absolute -left-1 -bottom-1 bg-[#ED6C2C] text-white text-[10px] rounded-md px-1 py-px">
                {s.groupInitiate}
              </span>
            </span>
            <span className="ml-3 flex-1 min-w-0 truncate">
              <span className="text-[17px] font-bold text-[#1A1A1A]">{s.groupInitiatorMe}</span>
              <span className="text-[14px] text-[#999999] ml-0.5">{s.groupMeSuffix}</span>
            </span>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'group.helporder.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className="shrink-0 h-9 px-3.5 rounded-lg bg-[#F3F6F8] text-[#1A1A1A] text-[14px] font-semibold border-none cursor-pointer"
            >
              {s.groupHelpOrder}
            </button>
            <button
              {...bindTap<HTMLButtonElement>('group.order-open', { params: { shopId: shop.id } })}
              className="ml-2 shrink-0 h-9 px-4 rounded-lg bg-[#ED6C2C] text-white text-[14px] font-bold border-none cursor-pointer"
            >
              {s.groupGoOrder}
            </button>
          </div>
          <div className="text-[14px] text-[#999999] mt-2.5 ml-14">{s.groupNoItems}</div>
        </div>
      </div>

      {/* 底部结算栏 */}
      <div className="shrink-0 bg-white flex items-center justify-end gap-3 px-3 py-2.5 border-t border-[#EEEEEE]">
        <div className="text-right">
          <div className="text-[14px] text-[#1A1A1A]">
            {s.groupTotal}
            <span className="font-bold"><span className="text-[13px]">¥</span><span className="text-[24px]">0</span></span>
          </div>
          <div className="text-[12px] text-[#999999]">{s.deliveryFeeAbout}¥{fmt(shop.deliveryFee)}</div>
        </div>
        <button
          disabled
          className="shrink-0 h-12 px-6 rounded-lg bg-[#B8BCC2] text-white text-[17px] font-bold border-none"
        >
          ¥{fmt(shop.minOrder)}{s.minOrderSuffix}
        </button>
      </div>
    </div>
  );
}
