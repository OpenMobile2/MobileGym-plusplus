import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, showToast, wontfix } from '../components/ui';
import { useJingdongStore } from '../state';
import { IcGift } from '../res/icons';

// 签到领京豆 — 每日领京豆/签到,签到写入我的京豆(spec jingdou.signin, qa:Q10)。
export function JingdouPage() {
  const { bindTap } = useJingdongGestures();
  const jingdou = useJingdongStore((s) => s.user.jingdou);
  const signedToday = useJingdongStore((s) => s.signedToday);
  const signIn = useJingdongStore((s) => s.signIn);

  const days = ['昨天', '今天', '再连签2天'];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="签到领京豆" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="jingdou-scroll"
        data-scroll-direction="vertical"
      >
        {/* 京豆余额头图 */}
        <div className="bg-gradient-to-b from-[#FBE4C4] to-[#F5F5F5] px-4 pt-4 pb-6">
          <div className="text-[13px] text-[#8A5A1E]">我的京豆</div>
          <div className="flex items-end gap-1 mt-1">
            <span className="text-[40px] leading-none font-bold text-[#F0A020]">{jingdou}</span>
            <span className="text-[13px] text-[#8A5A1E] mb-1.5">个 · 100京豆抵1元</span>
          </div>
        </div>

        {/* 每日领京豆 签到卡 */}
        <div className="mx-3 -mt-3 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#1A1A1A]">每日领京豆</span>
            <span className="text-[12px] text-[#999]">可抵 ¥{(jingdou / 100).toFixed(2)} ›</span>
          </div>

          {/* 签到进度 昨天/今天/再连签 */}
          <div className="relative mt-5 mb-4 px-1">
            <div className="absolute left-2 right-2 top-1.5 h-0.5 bg-[#F0DCC0]" />
            <div className="relative flex justify-between">
              {days.map((d, i) => (
                <div key={d} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      i <= (signedToday ? 1 : 0)
                        ? 'bg-[#F0A020] border-[#F0A020]'
                        : 'bg-white border-[#F0DCC0]'
                    }`}
                  />
                  <span className="text-[11px] text-[#B07A38]">
                    {i === 2 ? (
                      <span className="text-[#F0A020] font-semibold">+2 🪙 {d}</span>
                    ) : (
                      d
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            {...bindTap(
              { kind: 'action', id: 'jingdou.signin.claim' },
              {
                onTrigger: () => {
                  if (signedToday) {
                    showToast('今日已签到');
                    return;
                  }
                  signIn();
                  showToast('签到成功,京豆 +10');
                },
              },
            )}
            className={`w-full h-11 rounded-full text-[16px] font-semibold ${
              signedToday
                ? 'bg-[#F3E6D2] text-[#B08A50]'
                : 'bg-gradient-to-r from-[#F5B84E] to-[#F0A020] text-white'
            }`}
          >
            {signedToday ? '今日已签到' : '签到领京豆'}
          </button>
        </div>

        {/* 每日领餐补 / 每日抽大奖(wontfix) */}
        <div className="mx-3 mt-3 grid grid-cols-2 gap-3">
          <button
            {...bindTap({ kind: 'action', id: 'jingdou.lottery.wontfix' }, { onTrigger: wontfix })}
            className="bg-white rounded-xl p-4 flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-1 text-[15px] font-bold text-[#1A1A1A]">
              <IcGift size={18} className="text-[#E1251B]" /> 每日领餐补
            </div>
            <div className="mt-2 text-[22px] font-bold text-[#E1251B]">
              ¥17<span className="text-[12px] font-normal ml-1">外卖补贴</span>
            </div>
            <div className="mt-1 text-[12px] text-[#E1251B]">最低领17元</div>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'jingdou.lottery.wontfix' }, { onTrigger: wontfix })}
            className="bg-white rounded-xl p-4 flex flex-col items-start text-left"
          >
            <div className="text-[15px] font-bold text-[#1A1A1A]">每日抽大奖</div>
            <div className="mt-2 w-12 h-14 rounded-lg bg-gradient-to-b from-[#F05B4E] to-[#E1251B] flex items-center justify-center">
              <span className="text-white text-[20px]">🧧</span>
            </div>
            <div className="mt-2 text-[12px] text-[#E1251B]">得无门槛红包</div>
          </button>
        </div>

        <div className="text-center text-[11px] text-[#BBB] py-6">京东京豆 · 签到规则详见活动页</div>
      </div>
    </div>
  );
}
