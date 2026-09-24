import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, Img, NOT_OPEN, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBell, IcSettings, IcArrowRight, IcTicket, IcFilm, IcQr, IcUsers, IcGift } from '../res/icons';

/** 我的页(anchor_mine.jpg) */
export default function MinePage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();

  const session = useMaoyanStore((st) => st.session);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const wishShows = useMaoyanStore((st) => st.wishShows);
  const watched = useMaoyanStore((st) => st.watched);
  const coupons = useMaoyanStore((st) => st.coupons);
  const miaoCoins = useMaoyanStore((st) => st.miaoCoins);
  const movies = useMaoyanStore((st) => st.movies);

  const logCount = wishMovies.length + wishShows.length + Object.keys(watched).length;
  const pendingRate = Object.values(watched).filter((w) => w.stars === 0).length;
  const validCoupons = coupons.filter((c) => c.status === 'valid').length;
  const expiredCards = 2;
  const hotCount = movies.filter((m) => m.status === 'hot').length;

  const disabledBtn = (label: string, node: React.ReactNode) => (
    <button
      key={label}
      {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
      className="bg-transparent border-none cursor-pointer p-0 text-left"
    >
      {node}
    </button>
  );

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground={statusFg}
      style={{ background: `linear-gradient(180deg,${MY.brandTint} 0%,${MY.bg} 200px)` }}>
      {toast}
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="mine-scroll" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="flex items-center pt-3">
          <Img src={session.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white" />
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-[18px] font-bold text-app-text truncate">{session.nick}</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-0.5"><span className="bg-app-surface/70 rounded px-1">普通用户</span> 个人主页 ›</div>
          </div>
          {disabledBtn('bell', <span className="relative mr-3"><IcBell size={22} className="text-(--app-c-text-2)" /><span className="absolute -top-1.5 -right-1.5 text-[8px] text-white bg-[#F5303E] rounded-full px-1">19</span></span>)}
          <button {...bindTap('mine.settings-open')} className="bg-transparent border-none cursor-pointer" aria-label="设置">
            <IcSettings size={22} className="text-(--app-c-text-2)" />
          </button>
        </div>

        {/* 想看/看过 + 预约抢票 */}
        <div className="bg-app-surface rounded-xl mt-3 p-3 flex">
          <button {...bindTap('mine.filmlog-open')} className="flex-1 bg-transparent border-none cursor-pointer text-left">
            <div className="flex items-center">
              <div>
                <div className="text-[14px] font-bold text-app-text">{s.wishWatched}</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{pendingRate}部待评价</div>
              </div>
              <span className="ml-3 text-[20px] font-bold text-app-text">{logCount}</span>
              <IcArrowRight size={15} className="text-(--app-c-text-3)" />
            </div>
          </button>
          {disabledBtn('rush', (
            <div className="flex items-center border-l border-app-border pl-3">
              <div>
                <div className="text-[14px] font-bold text-app-text">预约抢票</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-0.5">帮抢团 专属抢票战队</div>
              </div>
              <span className="ml-3 text-[20px] font-bold text-app-text">0</span>
              <IcArrowRight size={15} className="text-(--app-c-text-3)" />
            </div>
          ))}
        </div>

        {/* 我的订单 */}
        <div className="bg-app-surface rounded-xl mt-2 p-3">
          <div className="text-[15px] font-bold text-app-text mb-2">{s.myOrders}</div>
          <div className="grid grid-cols-4">
            <button {...bindTap('mine.orders.movie-open')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
              <IcFilm size={24} className="text-(--app-c-text-2)" />
              <span className="text-[11px] text-(--app-c-text-2)">{s.movieTickets}</span>
            </button>
            <button {...bindTap('mine.orders.show-open')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
              <IcTicket size={24} className="text-(--app-c-text-2)" />
              <span className="text-[11px] text-(--app-c-text-2)">{s.showOrders}</span>
            </button>
            {disabledBtn('watch', (
              <div className="flex flex-col items-center gap-1">
                <IcQr size={24} className="text-(--app-c-text-2)" />
                <span className="text-[11px] text-(--app-c-text-2)">在线观影</span>
              </div>
            ))}
            {disabledBtn('peripheral', (
              <div className="flex flex-col items-center gap-1">
                <IcGift size={24} className="text-(--app-c-text-2)" />
                <span className="text-[11px] text-(--app-c-text-2)">周边</span>
              </div>
            ))}
          </div>
        </div>

        {/* 资产条 */}
        <div className="bg-app-surface rounded-xl mt-2 p-3 flex text-center">
          <button {...bindTap('mine.coupons-open')} className="flex-1 bg-transparent border-none cursor-pointer">
            <div className="text-[14px] font-bold text-[#DC4038]">{validCoupons}张可用</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{s.coupons}</div>
          </button>
          <button {...bindTap('mine.cards-open')} className="flex-1 bg-transparent border-none cursor-pointer border-l border-app-border">
            <div className="text-[14px] font-bold text-app-text">{expiredCards}张过期</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{s.cards}</div>
          </button>
          {disabledBtn('mx', (
            <div className="flex-1 border-l border-app-border">
              <div className="text-[14px] font-bold text-app-text">去绑卡</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-0.5">猫享卡</div>
            </div>
          ))}
          {disabledBtn('coin', (
            <div className="flex-1 border-l border-app-border">
              <div className="text-[14px] font-bold text-app-text">{miaoCoins}</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{s.miaoCoins} <span className="text-[8px] text-white bg-[#F5303E] rounded px-0.5">兑权益</span></div>
            </div>
          ))}
        </div>

        {/* 精选服务 */}
        <div className="text-[15px] font-bold text-app-text mt-3 mb-2">精选服务</div>
        <div className="grid grid-cols-2 gap-2">
          <button {...bindTap('mine.profiles-open')} className="bg-app-surface rounded-xl p-3 text-left border-none cursor-pointer">
            <div className="text-[14px] font-bold text-app-text">观演人信息</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1">管理实名和地址信息</div>
            <div className="text-[10px] text-(--app-c-text-4) mt-1">购票抢先机 <IcUsers size={12} className="inline text-[#DC4038]" /></div>
          </button>
          {disabledBtn('banquet', (
            <div className="bg-app-surface rounded-xl p-3">
              <div className="text-[14px] font-bold text-app-text">请客包场</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1">电影在线 包场神器</div>
              <div className="text-[10px] text-(--app-c-text-4) mt-1">立即包场</div>
            </div>
          ))}
          <button {...bindTap('mine.ticketfolder-open')} className="bg-app-surface rounded-xl p-3 text-left border-none cursor-pointer">
            <div className="text-[14px] font-bold text-app-text">我的纪念票夹</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1">电子收藏 实体打印</div>
            <div className="text-[10px] text-(--app-c-text-4) mt-1">立即体验</div>
          </button>
          {disabledBtn('free', (
            <div className="bg-app-surface rounded-xl p-3">
              <div className="text-[14px] font-bold text-app-text">0元观演</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1">看展看剧 免费体验</div>
              <div className="text-[10px] text-(--app-c-text-4) mt-1">立即报名</div>
            </div>
          ))}
          {disabledBtn('saving', (
            <div className="bg-app-surface rounded-xl p-3">
              <div className="text-[14px] font-bold text-app-text">省钱月卡</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1">双享礼遇 购票立减</div>
              <div className="text-[10px] text-(--app-c-text-4) mt-1">点击省钱</div>
            </div>
          ))}
          <button {...bindTap('mine.hotmovies-open')} className="bg-app-surface rounded-xl p-3 text-left border-none cursor-pointer">
            <div className="text-[14px] font-bold text-app-text">正在热映</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1">{hotCount}部影片正在热映</div>
            <div className="text-[10px] text-(--app-c-text-4) mt-1">查看排片</div>
          </button>
        </div>

        {/* 更多服务(同组一致,全部 toast) */}
        <div className="text-[15px] font-bold text-app-text mt-3 mb-2">更多服务</div>
        <div className="bg-app-surface rounded-xl p-3 grid grid-cols-4 mb-3">
          {['数字藏品', '平台公告', '银行活动', '券包'].map((label, i) => disabledBtn(label, (
            <div className="flex flex-col items-center gap-1">
              <span className="w-9 h-9 rounded-lg bg-(--app-c-fill) flex items-center justify-center text-[18px]">{['💎', '📋', '💳', '🎟️'][i]}</span>
              <span className="text-[11px] text-(--app-c-text-2)">{label}</span>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
