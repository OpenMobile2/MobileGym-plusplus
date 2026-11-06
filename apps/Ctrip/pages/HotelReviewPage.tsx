import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, useToast } from '../components/ui';

/** 酒店点评：可浏览；带 orderId 时可写点评。 */
export default function HotelReviewPage() {
  const s = useCtripStrings();
  const FILTERS = [s.t('全部'), s.t('有图'), s.t('好评'), s.t('差评'), s.t('性价比高'), s.t('服务好')];
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId') || '';
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const hotels = useCtripStore((st) => st.hotels);
  const reviewMap = useCtripStore((st) => st.hotelReviews);
  const submitHotelReview = useCtripStore((st) => st.submitHotelReview);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);
  const hotel = hotels.find((h) => h.id === id);
  React.useEffect(() => {
    if (hotel && !orderId) recordTaskAudit(`hotelReviewsViewed:${hotel.id}`, true);
  }, [hotel, orderId, recordTaskAudit]);
  const [filter, setFilter] = React.useState(s.t('全部'));
  const [score, setScore] = React.useState(5);
  const [content, setContent] = React.useState('');
  const reviews = React.useMemo(() => reviewMap[id] ?? [], [reviewMap, id]);

  const shown = React.useMemo(() => {
    if (filter === s.t('有图')) return reviews.filter((r) => r.images.length > 0);
    if (filter === s.t('好评')) return reviews.filter((r) => r.score >= 4.5);
    if (filter === s.t('差评')) return reviews.filter((r) => r.score < 4);
    if (filter === s.t('性价比高')) return reviews.filter((r) => /性价比|便宜|划算/.test(r.content));
    if (filter === s.t('服务好')) return reviews.filter((r) => /服务|前台|热情/.test(r.content));
    return reviews;
  }, [reviews, filter, s]);

  if (!hotel) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title={s.t('酒店')} />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">{s.t('未找到该酒店')}</div>
      </div>
    );
  }
  const onSubmit = () => {
    if (!content.trim()) {
      showToast(s.t('请填写点评内容'));
      return;
    }
    submitHotelReview(hotel.id, content, score, orderId || undefined);
    setContent('');
    showToast(s.t('点评已提交'));
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('酒店点评')} backTo={orderId ? '/orders' : `/hotel/${encodeURIComponent(hotel.id)}${sp.toString() ? `?${sp.toString()}` : ''}`} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {orderId ? (
          <div className="bg-white px-3 py-3 mb-2">
            <div className="text-[14px] font-semibold mb-2">{s.t('写点评')}</div>
            <div className="flex gap-2 mb-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <button key={n} type="button" onClick={() => setScore(n)} className={`px-3 py-1 rounded-full border-none cursor-pointer text-[13px] ${score === n ? 'bg-[#0086F6] text-white' : 'bg-[#F2F4F7]'}`}>{n}分</button>
              ))}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="分享本次入住体验…"
              className="w-full border border-[#EEEEEE] rounded-lg p-2 text-[13px] outline-none resize-none"
            />
            <button
              type="button"
              {...bindTap({ kind: 'action', id: 'hotelReview.filter.select.withpic' }, { onTrigger: onSubmit })}
              className="mt-2 w-full py-2.5 rounded-full bg-[#0086F6] text-white text-[14px] border-none cursor-pointer"
            >{s.t('提交点评')}</button>
          </div>
        ) : null}

        <div className="bg-white px-3 py-3 flex items-center gap-4">
          <div className="text-center">
            <div className="text-[30px] font-bold text-[#0086F6] leading-none">{hotel.score}</div>
            <div className="text-[12px] text-[#666666] mt-1">{s.t('超棒')}</div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-y-1 text-[12px] text-[#666666]">
            {[[s.t('卫生'), 4.8], [s.t('环境'), 4.7], [s.t('服务'), 4.9], [s.t('设施'), 4.6]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between pr-3"><span>{k}</span><span className="text-[#333333]">{v}</span></div>
            ))}
          </div>
        </div>

        <div className="bg-white px-3 py-3 mt-2">
          <div className="text-[13px] text-[#0086F6] font-semibold mb-1">{s.t('✨ AI 点评总结')}</div>
          <div className="text-[13px] text-[#555555] leading-relaxed">{s.t('住客普遍反馈位置优越、离景区近,前台服务热情,房间干净整洁,早餐口味不错。整体性价比高,适合家庭出行。')}</div>
        </div>

        <div className="bg-white px-3 py-2 mt-2 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              {...bindTap({ kind: 'action', id: 'hotelReview.filter.select.withpic' }, { params: { filter: f }, onTrigger: () => setFilter(f) })}
              className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${filter === f ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-[#F7F8FA] text-[#555555] border-transparent'}`}
            >{f}</button>
          ))}
        </div>

        <div className="mt-2">
          {shown.length === 0 ? (
            <div className="bg-white py-12 text-center text-[14px] text-[#999999]">{s.t('暂无该类点评')}</div>
          ) : shown.map((r) => (
            <div key={r.id} className="bg-white px-3 py-3 mb-0.5">
              <div className="flex items-center gap-2">
                <Img src={r.avatar} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-[13px] text-[#222222]">{r.user}</div>
                  <div className="text-[11px] text-[#999999]">{r.level} · {r.date}</div>
                </div>
                <span className="text-[13px] font-semibold text-[#0086F6]">{r.score}分</span>
              </div>
              <div className="text-[13px] text-[#333333] mt-2 leading-relaxed">{r.content}</div>
              {r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((im, i) => (
                    <Img key={i} src={im} className="w-20 h-20 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="text-[11px] text-[#999999] mt-2">{r.roomType}</div>
            </div>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}
