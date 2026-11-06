import React, { useEffect, useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, Img, PriceYuan } from '../components/ui';
import { ICON_REGISTRY, IcPackage } from '../res/icons';
import type { Item } from '../types';

const CATEGORY_MATCH: Record<string, string[]> = {
  玩乐: ['玩乐'],
  百货: ['百货', '个护', '美妆'],
  食品: ['食品'],
  手机数码: ['数码'],
  鞋包服饰: ['男装', '女装', '运动', '出行'],
  家居家电: ['家居', '家电'],
};

const SUBCATEGORY_MATCH: Record<string, { categories: string[]; keywords: string[] }> = {
  '玩乐/毛绒玩具': { categories: ['玩乐'], keywords: ['毛绒', '玩偶', '公仔', '抱枕'] },
  '玩乐/益智积木': { categories: ['玩乐', '母婴'], keywords: ['积木', '拼图', '益智', '拆装'] },
  '玩乐/遥控玩具': { categories: ['玩乐'], keywords: ['遥控', '玩具车', '泡泡机'] },
  '玩乐/潮玩手办': { categories: ['玩乐'], keywords: ['盲盒', '手办', '潮玩', '捏捏', '解压'] },
  '百货/纸品湿巾': { categories: ['百货'], keywords: ['卷纸', '抽纸', '纸巾', '湿巾'] },
  '百货/个人护理': { categories: ['个护', '美妆'], keywords: ['牙膏', '牙刷', '洗发', '沐浴', '香皂', '面膜', '口红'] },
  '百货/清洁用品': { categories: ['百货'], keywords: ['洗衣液', '垃圾袋', '百洁布', '清洁'] },
  '百货/家居收纳': { categories: ['百货', '家居'], keywords: ['收纳', '置物架', '保鲜盒', '储物'] },
  '食品/饮料冲调': { categories: ['食品'], keywords: ['饮料', '咖啡', '格瓦斯', '脉动', '尖叫'] },
  '食品/乳品酸奶': { categories: ['食品'], keywords: ['牛奶', '酸奶', '乳品', '发酵乳'] },
  '食品/休闲零食': { categories: ['食品'], keywords: ['坚果', '面包', '鸭脖', '红枣', '零食'] },
  '食品/粮油米面': { categories: ['食品'], keywords: ['挂面', '面条', '粮油', '米面', '方便速食'] },
  '手机数码/蓝牙耳机': { categories: ['数码'], keywords: ['耳机', 'FreeBuds', 'FreeClip'] },
  '手机数码/手机': { categories: ['数码'], keywords: ['智能手机', '手机整机'] },
  '手机数码/智能配件': { categories: ['数码'], keywords: ['充电器', '移动电源', '智能手表', '键盘', '鼠标', 'U盘'] },
  '手机数码/影音设备': { categories: ['数码'], keywords: ['蓝牙音箱', '音箱'] },
  '鞋包服饰/男装': { categories: ['男装'], keywords: ['男', 'POLO', '衬衫', '工装裤'] },
  '鞋包服饰/女装': { categories: ['女装'], keywords: ['女', '连衣裙', '半身裙', '针织'] },
  '鞋包服饰/箱包': { categories: ['出行'], keywords: ['行李箱', '拉杆箱', '背包', '箱包'] },
  '鞋包服饰/运动鞋': { categories: ['运动'], keywords: ['运动鞋', '跑步鞋', '鞋'] },
  '家居家电/厨房电器': { categories: ['家电'], keywords: ['破壁机', '电热水壶', '水壶'] },
  '家居家电/家居装饰': { categories: ['家居'], keywords: ['相框', '台灯', '香薰', '装饰'] },
  '家居家电/餐厨用品': { categories: ['家居', '百货'], keywords: ['餐具', '碗', '刀具', '保鲜盒'] },
  '家居家电/个护清洁': { categories: ['家电', '个护'], keywords: ['电吹风', '牙刷', '剃须', '沐浴', '洗发'] },
};

function interleaveItems(groups: Item[][]): Item[] {
  const output: Item[] = [];
  const longestGroup = Math.max(0, ...groups.map((group) => group.length));
  for (let index = 0; index < longestGroup; index += 1) {
    groups.forEach((group) => {
      if (group[index]) output.push(group[index]);
    });
  }
  return output;
}

function findSubcategoryItem(items: Item[], groupName: string, subcategoryName: string): Item | undefined {
  const match = SUBCATEGORY_MATCH[`${groupName}/${subcategoryName}`];
  if (!match) return undefined;
  for (const keyword of match.keywords) {
    const item = items.find(
      (candidate) =>
        match.categories.includes(candidate.category) &&
        candidate.title.includes(keyword),
    );
    if (item) return item;
  }
  return undefined;
}

export function CategoryPage() {
  const { bindTap } = usePinduoduoGestures();
  const categories = usePinduoduoStore((st) => st.categories);
  const items = usePinduoduoStore((st) => st.items);
  const recordTaskAudit = usePinduoduoStore((st) => st.recordTaskAudit);
  const [activeIdx, setActiveIdx] = useState(0);

  const active = categories[activeIdx];
  useEffect(() => {
    if (active?.name) recordTaskAudit({ category: active.name });
  }, [active?.name, recordTaskAudit]);
  const catItems = active
    ? active.itemIds.map((id) => items.find((it) => it.id === id)).filter(Boolean)
    : [];
  const relatedCategories = active ? CATEGORY_MATCH[active.name] || [] : [];
  const displayItems = active
    ? [
        ...catItems,
        ...interleaveItems(
          relatedCategories.map((category) =>
            items.filter(
              (item) =>
                item.category === category &&
                !active.itemIds.includes(item.id),
            ),
          ),
        ),
      ].slice(0, 12)
    : [];

  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      <TopBar title="分类" className="border-b border-[#F0F0F0]" />

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧竖直类目列表 */}
        <div className="w-[88px] shrink-0 bg-[#F5F5F5] overflow-y-auto">
          {categories.map((cat, i) => {
            const on = i === activeIdx;
            return (
              <button
                key={cat.id}
                {...bindTap(
                  { kind: 'action', id: 'category.select.group' },
                  { params: { cat: cat.name }, onTrigger: () => { setActiveIdx(i); recordTaskAudit({ category: cat.name }); } },
                )}
                className={`relative w-full h-14 text-left pl-4 pr-2 text-[13px] ${
                  on ? 'bg-white text-[#E22E1F] font-semibold' : 'text-[#333]'
                }`}
              >
                {on && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-7 bg-[#E22E1F]" />}
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* 右侧内容(可左右滑切类目) */}
        <div
          {...bindTap({ kind: 'action', id: 'category.swipe.switch' }, { onTrigger: () => {} })}
          className="flex-1 overflow-y-auto bg-white"
          data-scroll-container
          data-scroll-direction="vertical"
        >
          {/* 子频道宫格 */}
          {active && (
            <div className="grid grid-cols-3 gap-y-3 px-3 pt-4 pb-3">
              {active.subs.map((sub) => {
                const relevantItem = findSubcategoryItem(items, active.name, sub.name);
                const iconSrc = relevantItem?.image;
                const FallbackIcon = ICON_REGISTRY[sub.icon] || IcPackage;
                return (
                <button
                  key={sub.name}
                  {...bindTap('category.sub-open', { params: { q: sub.name } })}
                  className="flex flex-col items-center gap-1.5 min-w-0"
                >
                  <span className="w-[58px] h-[58px] rounded-lg bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                    {iconSrc ? (
                      <Img src={iconSrc} className="w-full h-full object-cover" alt={sub.name} />
                    ) : (
                      <FallbackIcon size={28} strokeWidth={1.6} className="text-[#E22E1F]" />
                    )}
                  </span>
                  <span className="w-full text-[12px] text-[#666] text-center leading-tight truncate">{sub.name}</span>
                </button>
              )})}
            </div>
          )}

          {/* 该类目商品 */}
          <div className="pb-3 border-t-8 border-[#F5F5F5]">
            <div className="flex items-center justify-center gap-2 h-10 text-[13px] text-[#999]">
              <span className="w-5 h-px bg-[#CFCFCF]" />
              精选好货
              <span className="w-5 h-px bg-[#CFCFCF]" />
            </div>
            <div className="grid grid-cols-2 gap-px bg-[#E9E9E9]">
              {displayItems.map((it) => it && (
                <div
                  key={it.id}
                  {...bindTap('category.item-open', { params: { itemId: it.id } })}
                  className="bg-white overflow-hidden min-w-0"
                >
                  <div className="w-full aspect-square bg-[#F5F5F5]">
                    <Img src={it.image} className="w-full h-full object-cover" alt={it.title} />
                  </div>
                  <div className="px-2 pt-1.5 pb-2">
                    <div className="text-[12px] leading-[17px] text-[#333] line-clamp-2">{it.title}</div>
                    <div className="mt-1 flex items-baseline gap-1 min-w-0">
                      <PriceYuan value={it.pinPrice} className="text-[#E22E1F] text-[17px] shrink-0" symbolClass="text-[11px]" />
                      <span className="text-[9px] text-[#999] truncate">{it.sold}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
