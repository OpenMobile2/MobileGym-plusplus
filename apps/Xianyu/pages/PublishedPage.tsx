import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage } from '../components/ItemImage';
import { EmptyState, Price } from '../components/ui';
import { PUBLISHED_TABS } from '../constants';
import type { XyItem, XyDraft } from '../types';

export default function PublishedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const items = useXianyuStore((s) => s.items);
  const listings = useXianyuStore((s) => s.listings);
  const drafts = useXianyuStore((s) => s.drafts);

  const tab = searchParams.get('tab') ?? 'onSale';

  const onSale: XyItem[] = listings
    .filter((l) => l.status === 'onSale')
    .map((l) => items.find((i) => i.id === l.itemId))
    .filter((i): i is XyItem => Boolean(i));
  const offShelf: XyItem[] = listings
    .filter((l) => l.status === 'offShelf')
    .map((l) => items.find((i) => i.id === l.itemId))
    .filter((i): i is XyItem => Boolean(i));

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="我的发布" />

      {/* tab */}
      <div className="bg-white shrink-0 flex items-center border-b border-[#EEEEEE]">
        {PUBLISHED_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'published.tab.select.target' },
                {
                  params: { target: t.id },
                  onTrigger: () =>
                    setSearchParams((p) => {
                      if (t.id === 'onSale') p.delete('tab');
                      else p.set('tab', t.id);
                      return p;
                    }, { replace: true }),
                },
              )}
              className={`flex-1 bg-transparent border-none cursor-pointer py-3 text-[14px] relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="PublishedPage-main" data-scroll-direction="vertical">
        {tab === 'draft' ? (
          drafts.length === 0
            ? <EmptyState text="暂无草稿" hint="编辑中的闲置会存到这里" />
            : drafts.map((d) => <DraftCard key={d.id} draft={d} />)
        ) : (
          (() => {
            const list = tab === 'offShelf' ? offShelf : onSale;
            return list.length === 0
              ? <EmptyState text={tab === 'offShelf' ? '暂无已下架宝贝' : '还没有在卖的宝贝'} hint={tab === 'offShelf' ? undefined : '去发布闲置赚点小钱吧'} />
              : list.map((it) => <ItemRow key={it.id} item={it} offShelf={tab === 'offShelf'} />);
          })()
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, offShelf }: { item: XyItem; offShelf: boolean }) {
  const { bindTap } = useXianyuGestures();
  return (
    <div
      {...bindTap('home.item-open', { params: { itemId: item.id } })}
      className="bg-white mx-3 mt-3 rounded-xl p-3 flex gap-2 cursor-pointer"
    >
      <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-20 h-20 rounded-lg" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{item.title}</div>
        <div className="mt-auto flex items-center justify-between">
          <Price value={item.price} size={15} />
          <span className="text-[11px] text-[#999]">{offShelf ? '已下架' : `${item.wantCount}人想要`}</span>
        </div>
      </div>
    </div>
  );
}

function DraftCard({ draft }: { draft: XyDraft }) {
  return (
    <div className="bg-white mx-3 mt-3 rounded-xl p-3 flex gap-2">
      <ItemImage seed={draft.id} src={draft.images[0]} label={draft.title} className="w-20 h-20 rounded-lg" />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{draft.title || '未命名草稿'}</div>
        <div className="mt-auto flex items-center justify-between">
          {draft.price != null ? <Price value={draft.price} size={15} /> : <span className="text-[12px] text-[#999]">未定价</span>}
          <span className="text-[11px] text-[#FF8A00] bg-[#FFF3E0] px-1.5 py-0.5 rounded">草稿</span>
        </div>
      </div>
    </div>
  );
}
