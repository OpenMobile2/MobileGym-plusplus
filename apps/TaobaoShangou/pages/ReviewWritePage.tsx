import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, TopBar, showToast } from '../components/common';
import { IcCamera, IcClose, IcStar } from '../res/icons';

const TAGS = ['好吃', '分量足', '包装好', '配送快'];

/** 写评价页(spec order.review,证据 IMG_6035,qa:Q10) */
export default function ReviewWritePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const { orderId } = useParams<{ orderId: string }>();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const submitReview = useTbsgStore((st) => st.submitReview);

  const [stars, setStars] = useState(0);
  const [riderGood, setRiderGood] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [anon, setAnon] = useState(false);

  const order = orders.find((o) => o.id === orderId);
  const shop = shops.find((x) => x.id === order?.shopId);

  if (!order || !shop) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <TopBar title={s.reviewBtn} />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const progress = Math.min(text.length, 20);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar
        title={(
          <span className="inline-flex items-center gap-1">
            <span className="text-[#F6C443]">🫘</span>
            <span>写20字+1图得<span className="text-[#EB493B]">20吃货豆</span></span>
          </span>
        )}
      />

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 字数进度 + 活动横幅 */}
        <div className="bg-white px-4 pt-1 pb-2 flex items-center gap-2">
          <span className="text-[13px]">🫘</span>
          <div className="w-36 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-[#ED6C2C] rounded-full" style={{ width: `${(progress / 20) * 100}%` }} />
          </div>
          <span className="text-[13px]">
            <span className="text-[#ED6C2C] font-bold">{progress}</span>
            <span className="text-[#999999]">/20</span>
          </span>
        </div>
        <div className="mx-3 mt-1 rounded-xl px-3 py-2.5 text-[14px] text-[#1A1A1A]" style={{ background: 'rgba(245,183,130,0.45)' }}>
          👨‍🍳 写美食评价 赢<span className="text-[#ED6C2C] font-bold">爆款周边</span>
        </div>

        {/* ---------- 白卡1:商家/菜品 ---------- */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <div className="text-[18px] font-bold text-[#1A1A1A]">您对商家/菜品满意吗?</div>
          <div className="flex items-center mt-4">
            <AppImg src={shop.logo} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="ml-2.5 text-[15px] text-[#1A1A1A] truncate">{shop.fullName}</div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-[14px] text-[#1A1A1A] mr-4">满意度</span>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'review.stars.set' },
                    { params: { stars: i }, onTrigger: () => setStars(i) },
                  )}
                  className="bg-transparent border-none cursor-pointer p-0"
                  aria-label={`${i}星`}
                >
                  <IcStar
                    size={32}
                    className={i <= stars ? 'text-[#ED6C2C]' : 'text-gray-300'}
                    fill={i <= stars ? '#ED6C2C' : '#E5E7EB'}
                  />
                </button>
              ))}
            </div>
          </div>

          {stars > 0 && (
            <div className="mt-4">
              {/* 推荐标签 */}
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setText((cur) => (cur ? `${cur} ${t}` : t))}
                    className="h-8 px-3 rounded-full bg-[#F5F6F7] text-[13px] text-[#1A1A1A] border-none cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* 文字评价 */}
              <div className="mt-3 rounded-xl bg-[#F5F6F7] p-3">
                <textarea
                  {...bindTap<HTMLTextAreaElement>({ kind: 'action', id: 'review.text.input' }, { onTrigger: () => {} })}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 500))}
                  placeholder="说说菜品口味、包装、配送体验~"
                  className="w-full h-24 bg-transparent outline-none border-none resize-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
                />
              </div>
              {/* 传图 */}
              {images.length === 0 ? (
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'review.photo.add' },
                    { onTrigger: () => setImages([order.lines[0].image]) },
                  )}
                  className="mt-3 w-24 h-24 rounded-xl bg-[#F5F6F7] border border-dashed border-[#CCCCCC] flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IcCamera size={24} className="text-[#999999]" />
                  <span className="text-[12px] text-[#999999]">添加图片</span>
                </button>
              ) : (
                <div className="mt-3 flex gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-24 h-24">
                      <AppImg src={img} className="w-full h-full rounded-xl object-cover" />
                      <button
                        onClick={() => setImages([])}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center border-none cursor-pointer"
                        aria-label="移除图片"
                      >
                        <IcClose size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---------- 白卡2:骑手 ---------- */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <div className="flex items-center">
            <span className="text-[18px] font-bold text-[#1A1A1A]">您对骑手满意吗?</span>
            <div className="flex-1" />
            <span className="text-[13px] text-[#999999]">已对骑士匿名</span>
          </div>
          <div className="flex items-center mt-4">
            <AppImg src="/@app-assets/TaobaoShangou/avatars/rider.jpg" className="w-12 h-12 rounded-full object-cover shrink-0" />
            <div className="ml-2.5 min-w-0">
              <div className="text-[15px] text-[#1A1A1A]">平台配送</div>
              <div className="text-[13px] text-[#999999] mt-0.5">{order.riderName || '骑士'}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {([[false, '😞', '不满意'], [true, '🤩', '满意']] as [boolean, string, string][]).map(([good, emoji, label]) => (
              <button
                key={label}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'review.rider.set' },
                  { params: { good: String(good) }, onTrigger: () => setRiderGood(good) },
                )}
                className={`h-12 rounded-xl flex items-center justify-center gap-2 text-[15px] cursor-pointer ${
                  riderGood === good
                    ? 'bg-[#FDEFE4] text-[#ED6C2C] font-semibold border border-[#ED6C2C]'
                    : 'bg-[#F5F6F7] text-[#1A1A1A] border border-transparent'
                }`}
              >
                <span className="text-[18px]">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 底部:匿名 + 提交 ---------- */}
      <div className="shrink-0 bg-white px-4 pt-2.5 pb-3 border-t border-[#EEEEEE]" data-hide-on-keyboard>
        <div
          {...bindTap<HTMLDivElement>({ kind: 'action', id: 'review.anonymous.toggle' }, { onTrigger: () => setAnon((v) => !v) })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${anon ? 'bg-[#ED6C2C]' : 'border border-gray-300'}`}>
            {anon && <span className="text-white text-[12px] leading-none">✓</span>}
          </span>
          <span className="text-[14px] text-[#1A1A1A]">匿名评价</span>
        </div>
        {stars === 0 ? (
          <button
            onClick={() => showToast('请先给商家打分')}
            className="w-full h-11 mt-2.5 rounded-full bg-[#F7C4A3] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {s.submitReview}
          </button>
        ) : (
          <button
            {...bindTap<HTMLButtonElement>('review.submit', {
              beforeTrigger: () => {
                submitReview(order.id, stars, riderGood, text, images, anon);
                showToast(text.length >= 20 && images.length > 0 ? '评价成功,获得20吃货豆' : '评价成功');
              },
            })}
            className="w-full h-11 mt-2.5 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {s.submitReview}
          </button>
        )}
      </div>
    </div>
  );
}
