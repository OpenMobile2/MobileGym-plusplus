import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pickImages } from '@/os/albumBridge';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { useToast, NOT_OPEN, VIP } from '../components/ui';
import { IcNavBack, IcSearch, IcCamera } from '../res/icons';

// 与任意词都通顺的通用后缀(不再硬编码"连衣裙")
const NEUTRAL = ['特价', '官方正品', '旗舰店', '包邮'];

export default function SearchSuggestPage() {
  const { bindTap, bindBack, go } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useToast();

  const q = searchParams.get('q') || '';
  const items = useVipshopStore((s) => s.items);

  const [keyword, setKeyword] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);
  // 自动聚焦并把光标置于已输入内容末尾,承接中间页输入无缝续打
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); const n = el.value.length; el.setSelectionRange(n, n); }
  }, []);

  const suggestions = useMemo(() => {
    const base = keyword.trim();
    if (!base) return [];
    // 命中商品:标题/二级分类/品牌/标签 相关(双向包含)
    const matched = items.filter((it) =>
      it.title.includes(base) || it.subCategory.includes(base) || base.includes(it.subCategory) ||
      it.brandName.includes(base) || it.tags.some((t) => t.includes(base) || base.includes(t)));
    const titles = Array.from(new Set(matched.map((it) => it.title))).slice(0, 6);
    // 相关词(来自命中商品的二级分类/标签),而非固定后缀
    const related = Array.from(new Set(matched.flatMap((it) => [it.subCategory, ...it.tags])))
      .filter((w) => w && w !== base)
      .slice(0, 4)
      .map((w) => (base.includes(w) ? base : `${base}${w}`));
    const neutral = NEUTRAL.map((s) => `${base}${s}`);
    return Array.from(new Set([...titles, ...related, ...neutral])).slice(0, 12);
  }, [keyword, items]);

  const submit = () => {
    const w = keyword.trim();
    if (w) go('suggest.word-open', { q: w });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部:返回 + 输入框(显示 q) + 相机 */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-11 border-b border-[#EEEEEE]">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={24} className="text-[#222222]" />
        </button>
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={15} className="text-[#888888]" />
          <input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="搜索商品"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#222222] placeholder:text-[#BBBBBB]"
          />
          <button
            {...bindTap({ kind: 'action', id: 'suggest.imageSearch.pick' }, {
              onTrigger: () => {
                // 拍照/图片搜索走系统相册选图(albumBridge → MediaService)
                void pickImages({ multiple: false }).then((r) => {
                  if (r.cancelled || r.selected.length === 0) return;
                  showToast('已选择图片,正在为你识别');
                });
              },
            })}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label="相机搜索"
          >
            <IcCamera size={16} className="text-[#888888]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-suggest" data-scroll-direction="vertical">
        {suggestions.length === 0 && (
          <div className="text-center text-[13px] text-[#888888] py-16">输入关键词查看联想</div>
        )}
        {suggestions.map((word) => (
          <button
            key={word}
            {...bindTap('suggest.word-open', { params: { q: word } })}
            className="w-full flex items-center gap-2.5 px-3 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
          >
            <IcSearch size={15} className="text-[#BBBBBB]" />
            <span className="text-[14px] text-[#222222] flex-1">{word}</span>
          </button>
        ))}
      </div>
      {toast}
    </div>
  );
}
