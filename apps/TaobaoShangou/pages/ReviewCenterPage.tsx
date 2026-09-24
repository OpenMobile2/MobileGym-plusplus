import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, Stars, TopBar, fmtTime, showToast } from '../components/common';

/** 评价中心页(spec review.center,证据 IMG_6046/6063) */
export default function ReviewCenterPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const [sp, setSp] = useSearchParams();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const user = useTbsgStore((st) => st.user);
  const reviewStats = useTbsgStore((st) => st.reviewStats);
  const myReviews = useTbsgStore((st) => st.myReviews);

  const tab = sp.get('tab') ?? 'pending';
  const pending = orders.filter((o) => o.status === 'delivered' && !o.reviewed);
  const firstPending = pending[0];
  const qualityDone = Math.min(myReviews.filter((r) => r.text.length >= 20).length, 2);

  const tabs = [
    { id: 'pending', label: `待评价 ${pending.length}` },
    { id: 'reviewed', label: '已评价' },
  ];

  const taskBtnCls = 'h-9 px-4 rounded-full bg-white text-[14px] font-semibold text-[#6B4FBB] border-none cursor-pointer shrink-0';

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar
        title={s.reviewCenter}
        right={(
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'reviewcenter.rules.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="text-[14px] text-[#666666] bg-transparent border-none cursor-pointer"
          >
            规则
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部统计 */}
        <div className="bg-white px-4 pt-3 pb-4 flex items-center">
          <AppImg src={user.avatar} className="w-14 h-14 rounded-full object-cover shrink-0" />
          <div className="flex-1 grid grid-cols-3 ml-3">
            {([
              ['被浏览', reviewStats.viewed],
              ['被点赞', reviewStats.liked],
              ['优质评价', reviewStats.quality],
            ] as [string, number][]).map(([label, num], i) => (
              <div key={label} className={`text-center ${i > 0 ? 'border-l border-[#EEEEEE]' : ''}`}>
                <div className="text-[20px] font-bold text-[#1A1A1A]">{num}</div>
                <div className="text-[13px] text-[#999999] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 评价官任务卡 */}
        <div className="mx-3 mt-2.5 rounded-xl bg-[#EFEAFB] p-3.5 flex items-center">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[#1A1A1A]">🖊️ 写2条优质评价,解锁评价官身份</div>
            <div className="flex items-center mt-2">
              <div className="w-32 h-1.5 rounded-full bg-white/80 overflow-hidden">
                <div className="h-full bg-[#6B4FBB] rounded-full" style={{ width: `${(qualityDone / 2) * 100}%` }} />
              </div>
              <span className="text-[12px] text-[#999999] ml-2">{qualityDone}/2</span>
            </div>
          </div>
          {firstPending ? (
            <button
              {...bindTap<HTMLButtonElement>('reviewcenter.task-open', { params: { orderId: firstPending.id } })}
              className={taskBtnCls}
            >
              去评价
            </button>
          ) : (
            <button onClick={() => showToast('暂无待评价订单')} className={taskBtnCls}>
              去评价
            </button>
          )}
        </div>

        {/* 活动banner */}
        <div className="mx-3 mt-2.5">
          <AppImg src="/@app-assets/TaobaoShangou/banners/banner_member.jpg" className="w-full h-24 rounded-xl object-cover" />
        </div>

        {/* tab */}
        <div className="flex items-center mt-2 bg-transparent">
          {tabs.map((t) => (
            <button
              key={t.id}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'reviewcenter.tab.select' },
                {
                  params: { tab: t.id },
                  onTrigger: () => setSp((p) => { p.set('tab', t.id); return p; }, { replace: true }),
                },
              )}
              className={`flex-1 h-11 text-center bg-transparent border-none cursor-pointer ${
                tab === t.id ? 'text-[#1A1A1A] text-[17px] font-bold' : 'text-[#666666] text-[16px]'
              }`}
            >
              {t.label}
              {tab === t.id && <div className="w-6 h-[3px] bg-[#1A1A1A] rounded-full mx-auto mt-0.5" />}
            </button>
          ))}
        </div>

        {/* 待评价列表 */}
        {tab === 'pending' && (
          pending.length === 0 ? (
            <EmptyState text={s.emptyList} />
          ) : (
            pending.map((o) => {
              const shop = shops.find((x) => x.id === o.shopId);
              const count = o.lines.reduce((a, l) => a + l.qty, 0);
              return (
                <div key={o.id} className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
                  <div className="flex items-center">
                    <span className="text-[13px] font-bold text-[#ED6C2C] italic mr-1.5 shrink-0">闪购</span>
                    <span className="flex-1 text-[15px] font-semibold text-[#1A1A1A] truncate">{shop?.fullName}</span>
                    <span className="text-[13px] text-[#999999] shrink-0 ml-2">{fmtTime(o.createdAt)}</span>
                  </div>
                  <div className="flex items-center mt-3">
                    <AppImg src={o.lines[0]?.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0 px-2.5">
                      <div className="text-[14px] text-[#1A1A1A] truncate">{o.lines[0]?.name}</div>
                      <div className="text-[13px] text-[#999999] mt-1">共{count}件</div>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="text-[11px] font-semibold text-[#8A5A00] px-2 py-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg,#FBE3A8,#F6C443)' }}
                      >
                        得20吃货豆
                      </span>
                      <button
                        {...bindTap<HTMLButtonElement>('reviewcenter.review-open', { params: { orderId: o.id } })}
                        className="mt-1 h-9 px-6 rounded-full bg-[#FDEFE4] text-[#ED6C2C] text-[15px] font-semibold border-none cursor-pointer"
                      >
                        {s.reviewBtn}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* 已评价列表 */}
        {tab === 'reviewed' && (
          myReviews.length === 0 ? (
            <EmptyState text={s.emptyList} />
          ) : (
            myReviews.map((r) => {
              const shop = shops.find((x) => x.id === r.shopId);
              return (
                <div key={r.id} className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
                  <div className="flex items-center">
                    <span className="flex-1 text-[15px] font-semibold text-[#1A1A1A] truncate">{shop?.fullName}</span>
                    <span className="text-[13px] text-[#999999] shrink-0 ml-2">{fmtTime(r.ts)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Stars value={r.stars} size={14} />
                  </div>
                  {r.text && <div className="text-[14px] text-[#1A1A1A] mt-1.5 leading-5">{r.text}</div>}
                  {r.images.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.images.map((img, i) => (
                        <AppImg key={i} src={img} className="w-20 h-20 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
