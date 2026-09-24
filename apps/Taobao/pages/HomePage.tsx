import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { HOME_CHANNELS, KINGKONG_GRID } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { ItemGrid } from '../components/ItemCard';
import { Img, Price, useToast } from '../components/ui';
import { IcScan, IcSearch, IcCamera } from '../res/icons';

/** 618 三栏(商品卡可点进详情,IMG_8690) */
function PromoStrip() {
  const items = useTaobaoStore((s) => s.items);
  const { bindTap } = useTaobaoGestures();
  const picks = [items[0], items[2], items[4]].filter(Boolean);
  const titles = ['淘宝直播', '百亿补贴', '淘宝秒杀'];
  const subs = ['热销TOP3', '补贴价', '秒杀价'];
  return (
    <div className="flex gap-2 px-2.5 mt-2">
      {picks.map((it, i) => (
        <div
          key={it.id}
          {...bindTap('home.item-open', { params: { itemId: it.id } })}
          className="flex-1 bg-white rounded-xl p-2 cursor-pointer"
        >
          <div className="text-[12px] font-semibold text-[#FF0036]">
            <span className="italic font-black mr-0.5">618</span>{titles[i]}
          </div>
          <Img src={it.image} className="w-full aspect-square object-cover rounded-lg mt-1" />
          <div className="mt-1 flex items-center gap-1">
            <Price value={it.price} size="s" />
            <span className="text-[9px] text-white bg-[#FF0036] rounded px-0.5">{subs[i]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 非推荐频道的静态轻实现(wontfix 交互,仅视觉) */
function ChannelStatic({ channel }: { channel: string }) {
  const label = HOME_CHANNELS.find((c) => c.id === channel)?.label ?? channel;
  const blocks: Record<string, string[]> = {
    follow: ['关注的店铺动态', '上新提醒', '直播预告'],
    flash: ['美食外卖', '超市便利', '看病买药', '到店团购', '午餐爆品', '奶茶咖啡'],
    gov: ['国家补贴 15%', '地方补贴', '以旧换新', '电饭煲榜', '手机榜'],
    '618': ['618 开门红消费券', '¥50 满500可用', '¥35 满350可用', '平台加补券'],
    fliggy: ['机票', '酒店', '火车票', '门票'],
    outfit: ['夏季穿搭', '通勤风', '山系户外'],
  };
  return (
    <div className="px-2.5 mt-2">
      <div className="bg-white rounded-xl p-4">
        <div className="text-[15px] font-semibold mb-3">{label}频道</div>
        <div className="grid grid-cols-2 gap-2">
          {(blocks[channel] ?? ['敬请期待']).map((b) => (
            <div key={b} className="bg-[#FFF1E8] text-[#C2410C] text-[13px] rounded-lg px-3 py-4 text-center">
              {b}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[#999999] mt-3 text-center">该频道为展示内容,完整功能未开放</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const channel = searchParams.get('tab') ?? 'recommend';
  const { bindTap } = useTaobaoGestures();
  const items = useTaobaoStore((s) => s.items);
  const claimed = useTaobaoStore((s) => s.homeCouponClaimed);
  const claimHomeCoupon = useTaobaoStore((s) => s.claimHomeCoupon);
  const [toast, showToast] = useToast();

  return (
    <div className="flex flex-col h-full">
      {/* 频道 Tab 条 */}
      <div className="flex items-center gap-4 px-3 h-9 shrink-0 overflow-x-auto bg-[#F5F6F7]"
        data-scroll-container="home-channels" data-scroll-direction="horizontal">
        {HOME_CHANNELS.map((c) => (
          <button
            key={c.id}
            {...bindTap({ kind: 'action', id: 'home.channelTab.select.target' }, {
              params: { tab: c.id },
              onTrigger: () =>
                setSearchParams((p) => {
                  if (c.id === 'recommend') p.delete('tab');
                  else p.set('tab', c.id);
                  return p;
                }, { replace: true }),
            })}
            className={`shrink-0 text-[15px] bg-transparent border-none cursor-pointer relative pb-0.5 ${
              channel === c.id ? 'text-[#FF5000] font-bold' : 'text-[#333333]'
            }`}
          >
            {c.label}
            {'tag' in c && c.tag && (
              <span className="absolute -top-1 -right-4 text-[8px] text-white bg-[#FF0036] rounded px-0.5">{c.tag}</span>
            )}
            {channel === c.id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF5000]" />
            )}
          </button>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="px-2.5 pb-1.5 shrink-0">
        <div
          {...bindTap('home.search.open')}
          className="flex items-center bg-white rounded-full h-9 px-3 gap-2 border border-[#FF5000] cursor-pointer"
        >
          <span onClick={(e) => { e.stopPropagation(); showToast('扫一扫需要摄像头,仿真环境未开放'); }}>
            <IcScan size={17} className="text-[#666666]" />
          </span>
          <span className="flex-1 text-[13px] text-[#999999]">山雾香氛护手霜</span>
          <span onClick={(e) => { e.stopPropagation(); showToast('拍照搜索暂未开放'); }}>
            <IcCamera size={17} className="text-[#666666]" />
          </span>
          <span className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[13px] rounded-full px-3 py-1 flex items-center gap-0.5">
            <IcSearch size={13} />搜索
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {channel !== 'recommend' ? (
          <ChannelStatic channel={channel} />
        ) : (
          <>
            {/* 二楼入口(下拉动效 wontfix,以入口条代替) */}
            <div
              {...bindTap('home.heybox-open')}
              className="mx-2.5 mb-1.5 rounded-lg bg-black text-[#D8F000] text-[11px] px-3 py-1 flex justify-between cursor-pointer"
            >
              <span>天猫小黑盒 · 新品第1现场</span>
              <span>进入二楼 ›</span>
            </div>

            {/* 金刚区(铁律①:不实现但给明确反馈) */}
            <div className="mx-2.5 bg-white rounded-xl py-3 grid grid-cols-5 gap-y-3">
              {KINGKONG_GRID.map((k) => (
                <div
                  key={k.id}
                  onClick={() => showToast(`「${k.label}」暂未开放`)}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-10 h-10 rounded-xl" style={{ background: `${k.color}22` }}>
                    <span className="w-full h-full flex items-center justify-center text-[16px] font-black"
                      style={{ color: k.color }}>
                      {k.label[0]}
                    </span>
                  </span>
                  <span className="text-[11px] text-[#333333]">{k.label}</span>
                </div>
              ))}
            </div>

            <PromoStrip />

            {/* 瀑布流 */}
            <div className="mt-2 pb-2">
              <ItemGrid
                items={items}
                bindingOf={(it) => bindTap('home.item-open', { params: { itemId: it.id } })}
              />
            </div>
          </>
        )}
      </div>

      {/* 消费券横幅 */}
      {!claimed && channel === 'recommend' && (
        <div className="shrink-0 mx-2.5 mb-1.5 rounded-lg bg-gradient-to-r from-[#FF5000] to-[#FF0036] text-white text-[12px] px-3 py-2 flex items-center justify-between">
          <span>🧧 您有3张共250元消费券待领取</span>
          <button
            {...bindTap({ kind: 'action', id: 'home.couponBanner.claim' }, {
              onTrigger: () => { claimHomeCoupon(); showToast('领取成功,可在我的权益查看'); },
            })}
            className="bg-white text-[#FF0036] rounded-full px-3 py-0.5 text-[12px] font-semibold border-none cursor-pointer"
          >
            领250元
          </button>
        </div>
      )}
      {toast}
    </div>
  );
}
