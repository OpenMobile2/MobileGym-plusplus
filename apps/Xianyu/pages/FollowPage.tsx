import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState } from '../components/ui';
import { Avatar } from '../components/ItemImage';
import { IcArrowRight } from '../res/icons';

const TABS = [
  { id: 'people', label: '关注的人' },
  { id: 'feed', label: '关注动态' },
  { id: 'circle', label: '兴趣圈' },
] as const;

function SellerRow({
  id, name, isShop, shopLevel, goodRate, followed, onToggle,
}: {
  id: string; name: string; isShop: boolean; shopLevel: number; goodRate: number;
  followed: boolean; onToggle: object;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 bg-white">
      <Avatar seed={id} name={name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-[#111] font-medium truncate">{name}</div>
        <div className="text-[12px] text-[#999] mt-0.5">
          {isShop ? `鱼小铺 Lv.${shopLevel}` : '个人闲置'} · 好评{goodRate}%
        </div>
      </div>
      <button
        {...onToggle}
        className={`shrink-0 text-[12px] px-3 py-1 rounded-full border cursor-pointer ${
          followed ? 'bg-[#F4F4F4] text-[#999] border-[#EEE]' : 'bg-white text-[#FF8A00] border-[#FF8A00]'
        }`}
      >
        {followed ? '已关注' : '+关注'}
      </button>
    </div>
  );
}

export default function FollowPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const sellers = useXianyuStore((s) => s.sellers);
  const followedSellers = useXianyuStore((s) => s.followedSellers);
  const circles = useXianyuStore((s) => s.circles);
  const joinedCircles = useXianyuStore((s) => s.joinedCircles);
  const toggleFollowSeller = useXianyuStore((s) => s.toggleFollowSeller);

  const tab = searchParams.get('tab') ?? 'people';

  const followedList = sellers.filter((s) => followedSellers.includes(s.id));
  const recommendList = sellers.filter((s) => s.id !== 'me' && !followedSellers.includes(s.id));
  const joinedList = circles.filter((c) => joinedCircles.includes(c.id));

  const bindSellerToggle = (id: string) =>
    bindTap(
      { kind: 'action', id: 'follow.seller.toggle' },
      { params: { sellerId: id }, onTrigger: () => toggleFollowSeller(id) },
    );

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="关注" />

      {/* tab 行 */}
      <div className="bg-white shrink-0 flex items-center px-2 border-b border-[#EEEEEE]">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'follow.tab.select.target' },
                {
                  params: { tab: t.id },
                  onTrigger: () =>
                    setSearchParams((p) => {
                      if (t.id === 'people') p.delete('tab');
                      else p.set('tab', t.id);
                      return p;
                    }, { replace: true }),
                },
              )}
              className={`flex-1 bg-transparent border-none cursor-pointer py-2.5 text-[14px] relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="FollowPage-main" data-scroll-direction="vertical">
        {/* 关注的人 */}
        {tab === 'people' && (
          <div className="pb-3">
            {followedList.length === 0 ? (
              <EmptyState text="还没有关注的人" hint="关注喜欢的卖家,第一时间看新品" />
            ) : (
              <div className="mt-2 divide-y divide-[#F4F4F4]">
                {followedList.map((s) => (
                  <SellerRow
                    key={s.id} id={s.id} name={s.name} isShop={s.isShop}
                    shopLevel={s.shopLevel} goodRate={s.goodRate} followed
                    onToggle={bindSellerToggle(s.id)}
                  />
                ))}
              </div>
            )}
            {recommendList.length > 0 && (
              <>
                <div className="text-[13px] text-[#666] font-semibold px-3 pt-4 pb-2">你可能感兴趣的人</div>
                <div className="divide-y divide-[#F4F4F4]">
                  {recommendList.map((s) => (
                    <SellerRow
                      key={s.id} id={s.id} name={s.name} isShop={s.isShop}
                      shopLevel={s.shopLevel} goodRate={s.goodRate} followed={false}
                      onToggle={bindSellerToggle(s.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 关注动态 */}
        {tab === 'feed' && (
          <div className="p-3 flex flex-col gap-3">
            {followedList.length === 0 ? (
              <EmptyState text="暂无关注动态" hint="关注卖家后,这里会看到 Ta 的上新" />
            ) : (
              followedList.map((s, i) => (
                <div key={s.id} className="bg-white rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Avatar seed={s.id} name={s.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#111] font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-[#999]">{i === 0 ? '刚刚' : `${i + 1}小时前`}</div>
                    </div>
                  </div>
                  <div className="text-[14px] text-[#333] mt-2">
                    上新了 {i + 1} 件闲置好物,快来看看吧~
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 兴趣圈 */}
        {tab === 'circle' && (
          <div className="pb-3">
            {joinedList.length === 0 ? (
              <EmptyState text="还没有加入的圈子" hint="去圈子广场找找感兴趣的圈" />
            ) : (
              <div className="mt-2 divide-y divide-[#F4F4F4]">
                {joinedList.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-3 bg-white">
                    <Avatar seed={c.id} name={c.name} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] text-[#111] font-medium truncate">{c.name}</div>
                      <div className="text-[12px] text-[#999] mt-0.5 truncate">
                        {c.desc} · {(c.memberCount / 10000).toFixed(1)}万成员
                      </div>
                    </div>
                    <IcArrowRight size={16} className="text-[#CCC]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
