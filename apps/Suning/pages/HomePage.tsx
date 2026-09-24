import React, { useEffect, useState } from 'react';
import Img from '../components/Img';
import {
  IcScan, IcQr, IcMessage, IcAppliance, IcBasket, IcPhone, IcSign, IcRecharge,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { promoLabel, searchHint, isSelfShop } from '../utils/search';

const PLACEHOLDER_MS = 3000;

/** 金刚区前三项进对应品类列表(走查 0729);签到/充值仍 toast */
const METRO = [
  { key: 'appliance', label: '苏宁家电', Icon: IcAppliance, bg: 'from-[#4FA8F5] to-[#2E7CE8]', keyword: '家电' },
  { key: 'market', label: '苏宁超市', Icon: IcBasket, bg: 'from-[#5ECC62] to-[#2FA742]', keyword: '超市' },
  { key: 'digital', label: '手机电脑', Icon: IcPhone, bg: 'from-[#6E9BF7] to-[#4666E8]', keyword: '手机电脑' },
  { key: 'signin', label: '现金签到', Icon: IcSign, bg: 'from-[#FFB74D] to-[#FD7101]', badge: '今日未签' },
  { key: 'recharge', label: '充值缴费', Icon: IcRecharge, bg: 'from-[#FF7B6B] to-[#F13A21]' },
] as const;

/** 首页(spec home.main,s273/s274):顶部双Tab+搜索框 → 金刚区 → 四宫格 → 横幅 → 商品瀑布流 */
export default function HomePage() {
  const { bindTap, action } = useSuningGestures();
  const S = useStrings();
  const showToast = useSuningStore((s) => s.showToast);
  const unread = useSuningStore((s) => s.unread);

  const placeholders = SUNING_CONFIG.searchConfig.placeholders;
  const [phIdx, setPhIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setPhIdx((i) => (i + 1) % placeholders.length), PLACEHOLDER_MS);
    return () => window.clearInterval(t);
  }, [placeholders.length]);
  const currentWord = placeholders[phIdx];

  const wontfix = () => showToast(S.toastNotOpen);
  const unreadTotal = unread.trade + unread.notice + unread.interact;

  const products = SUNING_CONFIG.products;
  const durian = products.find((p) => p.id === 'durian-jinzhen');
  const rankAc = products.find((p) => p.id === 'ac-leader-shengdian');
  const liveCover = products.find((p) => p.id === 'phone-iphone17-256');
  const seedCover = products.find((p) => p.id === 'tv-changhong-65d6');

  return (
    <div className="relative flex h-full flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--app-bg)]"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部浅蓝 banner 区(design-tokens:首页顶部随 banner,按 s273 海信蓝一版干净实现) */}
        <div className="bg-gradient-to-b from-[#59B0F6] via-[#8FCBF9] to-[#C4E4FC] px-3 pb-3 pt-10">
          <div className="flex items-center gap-1.5">
            {/* 活动角标:静态装饰不建交互(spec note) */}
            <div className="rounded-full border border-[#C6F04E] bg-gradient-to-r from-[#2E4E9E] to-[#3B6BD6] px-2 py-1 text-[11px] font-bold leading-none text-[#D8F65A]">
              海信超级品牌周
            </div>
            <div className="ml-1 flex flex-1 items-center justify-center">
              <div className="flex items-center rounded-full bg-white/70 p-0.5">
                {/* 「首页」为当前态不建交互(spec 范围拍板#6) */}
                <span className="rounded-full bg-[var(--app-surface)] px-3 py-1 text-[14px] font-bold leading-none text-[var(--app-primary)]">
                  {S.tabHome}
                </span>
                <button
                  {...action('home.main.wontfix.toast', wontfix)}
                  className="relative cursor-pointer border-none bg-transparent px-2.5 py-1 text-[14px] font-semibold leading-none text-[#333]"
                >
                  {S.govSubsidyTab}
                  <span className="absolute -right-1.5 -top-2 rounded-full bg-[#3BAE44] px-1 text-[9px] font-bold leading-[14px] text-white">
                    15%
                  </span>
                </button>
              </div>
            </div>
            <button
              {...action('home.main.wontfix.toast', wontfix)}
              className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 text-[#222]"
            >
              <IcQr size={20} strokeWidth={2} />
              <span className="mt-0.5 text-[9px] leading-none">{S.rideCode}</span>
            </button>
            {/* 消息气泡 → 消息中心;未读总数(三频道)>0 时右上角红点 */}
            <button
              {...bindTap('home.main.msg.open')}
              className="relative cursor-pointer border-none bg-transparent p-1 text-[#222]"
            >
              <IcMessage size={22} strokeWidth={2} />
              {unreadTotal > 0 && (
                <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-[var(--app-c-danger)]" />
              )}
            </button>
          </div>

          {/* 搜索框:扫一扫 + 轮播占位词 + 橙「搜索」按钮(s273 橙描边白底) */}
          <div
            {...bindTap('home.main.search.open', { params: { placeholder: currentWord } })}
            className="mt-2.5 flex h-11 cursor-pointer items-center rounded-xl border-2 border-[var(--app-primary)] bg-[var(--app-surface)] pl-2 pr-1"
          >
            <button
              {...action('home.main.wontfix.toast', wontfix, { stopPropagation: true })}
              className="cursor-pointer border-none bg-transparent p-1 text-[#8A8A8A]"
            >
              <IcScan size={20} />
            </button>
            <span className="mx-1.5 h-4 w-px bg-[#E5E5E5]" />
            <span className="flex-1 truncate text-[14px] text-[var(--app-text-muted)]">{currentWord}</span>
            <button
              {...bindTap('home.main.searchDirect.open', {
                params: { keyword: currentWord },
                stopPropagation: true,
              })}
              className="cursor-pointer rounded-lg border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[14px] font-bold text-white"
            >
              {S.search}
            </button>
          </div>
        </div>

        {/* 金刚区(横滑,5 个) */}
        <div className="bg-gradient-to-b from-[#C4E4FC] to-[var(--app-bg)] px-1 pb-1">
          <div
            className="flex overflow-x-auto rounded-xl bg-white/80 py-3"
            data-scroll-container="metro"
            data-scroll-direction="horizontal"
          >
            {METRO.map((item) => {
              const { key, label, Icon, bg } = item;
              const keyword = 'keyword' in item ? item.keyword : null;
              const badge = 'badge' in item ? item.badge : null;
              const binding = keyword
                ? bindTap('home.main.searchDirect.open', { params: { keyword } })
                : action('home.main.wontfix.toast', wontfix);
              return (
                <button
                  key={key}
                  {...binding}
                  className="relative flex w-1/5 shrink-0 cursor-pointer flex-col items-center gap-1 border-none bg-transparent"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${bg}`}>
                    <Icon size={24} className="text-white" strokeWidth={1.8} />
                  </div>
                  {badge ? (
                    <span className="absolute -top-1.5 right-1 rounded-full rounded-bl-none bg-[var(--app-c-danger)] px-1 text-[9px] leading-[14px] text-white">
                      {badge}
                    </span>
                  ) : null}
                  <span className="text-[12px] leading-none text-[#333]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 四宫格:百亿补贴 / 排行榜 | 苏宁直播 / 好物种草(s273 两卡各两列) */}
        <div className="mt-2 flex gap-2 px-2">
          <div className="flex flex-1 rounded-xl bg-[var(--app-surface)] p-2">
            <button
              {...bindTap('home.main.baibu.open')}
              className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent"
            >
              <span className="text-[14px] font-bold text-[var(--app-text)]">百亿补贴</span>
              <div className="mt-1 h-16 w-16 rounded-lg bg-[var(--app-c-chip-bg)]">
                {durian && <Img src={durian.image} className="h-full w-full object-contain" />}
              </div>
              <span className="mt-0.5 rounded bg-[var(--app-c-danger)] px-1 text-[10px] leading-4 text-white">已补 ¥20</span>
              <span className="text-[13px] font-bold text-[var(--app-c-danger)]">¥93.8</span>
            </button>
            <button
              {...bindTap('home.main.rank.open')}
              className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent"
            >
              <span className="text-[14px] font-bold text-[var(--app-text)]">排行榜</span>
              <div className="mt-1 h-16 w-16 rounded-lg bg-[var(--app-c-chip-bg)]">
                {rankAc && <Img src={rankAc.image} className="h-full w-full object-contain" />}
              </div>
              <span className="mt-0.5 rounded bg-[#FFF1E5] px-1 text-[10px] leading-4 text-[var(--app-primary)]">强势上榜</span>
              <span className="text-[13px] font-bold text-[var(--app-c-danger)]">¥1529.15</span>
            </button>
          </div>
          <div className="flex flex-1 rounded-xl bg-[var(--app-surface)] p-2">
            {/* 苏宁直播:放弃清单,入口保留 toast */}
            <button
              {...action('home.main.wontfix.toast', wontfix)}
              className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent"
            >
              <span className="text-[14px] font-bold text-[var(--app-text)]">苏宁直播</span>
              <div className="mt-1 h-[5.5rem] w-16 overflow-hidden rounded-lg bg-gradient-to-b from-[#5B3BD6] to-[#2E1D8E]">
                {liveCover && <Img src={liveCover.image} className="h-full w-full object-cover opacity-90" />}
              </div>
              <span className="mt-0.5 text-[10px] leading-4 text-[var(--app-text-muted)]">看直播享专属优惠</span>
            </button>
            {/* 好物种草 → 发现Tab「精选」(Q12=A) */}
            <button
              {...bindTap('home.main.seeding.open')}
              className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent"
            >
              <span className="text-[14px] font-bold text-[var(--app-text)]">好物种草</span>
              <div className="mt-1 h-[5.5rem] w-16 overflow-hidden rounded-lg bg-[#1B1B27]">
                {seedCover && <Img src={seedCover.image} className="h-full w-full object-cover opacity-90" />}
              </div>
              <span className="mt-0.5 text-[10px] leading-4 text-[var(--app-text-muted)]">看大片超有代入感</span>
            </button>
          </div>
        </div>

        {/* 横幅:苏品苏货超享购(范围内定义为静态横幅,点击 toast) */}
        <button
          {...action('home.main.wontfix.toast', wontfix)}
          className="mx-2 mt-2 block h-20 w-[calc(100%-1rem)] cursor-pointer overflow-hidden rounded-xl border-none bg-gradient-to-r from-[#1F63D6] via-[#2E8BE8] to-[#15B7E8] p-0"
        >
          <div className="flex h-full flex-col items-center justify-center">
            <span className="text-[20px] font-black italic tracking-wide text-white">苏品苏货 超享购</span>
            <span className="mt-0.5 text-[10px] text-white/80">苏新消费 · 江苏好物</span>
          </div>
        </button>

        {/* 商品瀑布流:双列卡(标签组/到手价/找相似,s274) */}
        <div className="mt-2 px-2 pb-3 [column-gap:0.5rem] columns-2">
          {products.map((p) => {
            const label = promoLabel(p);
            return (
              <div
                key={p.id}
                {...bindTap('home.main.product.open', { params: { productId: p.id } })}
                className="mb-2 cursor-pointer overflow-hidden rounded-xl bg-[var(--app-surface)] break-inside-avoid"
              >
                <div className="aspect-square w-full bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-[13px] leading-[18px] text-[var(--app-text)]">
                    {isSelfShop(p.shopId) && (
                      <span className="mr-1 inline-block translate-y-[-1px] rounded-sm bg-[var(--app-primary)] px-0.5 text-[9px] font-bold leading-[14px] text-white">
                        {S.selfTag}
                      </span>
                    )}
                    {p.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {label && (
                      <span className="rounded-sm bg-[var(--app-c-danger)] px-1 text-[9px] leading-4 text-white">{label}</span>
                    )}
                    <span className="truncate text-[10px] text-[var(--app-c-text-muted)]">{searchHint(p)}</span>
                  </div>
                  <div className="mt-1 flex items-end justify-between">
                    <div className="flex min-w-0 items-baseline gap-1">
                      <span className="text-[11px] font-bold text-[var(--app-c-danger)]">¥</span>
                      <span className="text-[16px] font-bold leading-none text-[var(--app-c-danger)]">{p.price}</span>
                      <span className="text-[10px] text-[var(--app-c-text-muted)]">到手价</span>
                    </div>
                    <button
                      {...bindTap('home.main.similar.open', {
                        params: { productId: p.id },
                        stopPropagation: true,
                      })}
                      className="shrink-0 cursor-pointer border-none bg-transparent pl-1 text-[10px] leading-4 text-[var(--app-c-text-muted)]"
                    >
                      {S.findSimilar}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
