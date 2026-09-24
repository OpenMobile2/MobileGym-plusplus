import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Tag, wontfix } from '../components/ui';
import { IcNavBack, IcCamera, IcTrash } from '../res/icons';

type Word = { word: string; tag?: string; tagColor?: string };

// 搜索发现词(静态运营词,带标签)—— 主站
const DISCOVERY: Word[] = [
  { word: '黄桃罐头' },
  { word: 'vivox300', tag: '国家补贴', tagColor: '#1BA956' },
  { word: 'thinkbook14+笔记本' },
  { word: '先享后付入口食品' },
  { word: '苹果全家桶套装' },
  { word: '水果罐头' },
  { word: '冷酸灵牙膏免费试用', tag: '促', tagColor: '#E1251B' },
  { word: '先用后付零食' },
];

// 秒送/外卖入口进来时,搜索发现与热搜都是吃的(真机行为)
const DISCOVERY_FOOD: Word[] = [
  { word: '塔斯汀汉堡' },
  { word: '蜜雪冰城', tag: '低价', tagColor: '#FF4E33' },
  { word: '麦当劳麦辣鸡腿堡' },
  { word: '潮汕牛肉粿条' },
  { word: '黄焖鸡米饭' },
  { word: '瑞幸咖啡9.9', tag: '券', tagColor: '#FF4E33' },
  { word: '螺蛳粉' },
  { word: '水果切盒装' },
];

const HOT_FOOD = ['七鲜小厨现炒', '草本汤把子肉', '幸运咖冰美式', '百尖山手工水饺', '王兴亮胡辣汤', '盒马鲜生麒麟西瓜', '关东煮', '现切果盘'];

const HOT_TABS = ['今日热搜', '地道特产', '清凉一夏', '居家好物'];
const HOT_TABS_FOOD = ['秒送热搜', '午餐必点', '夜宵榜', '奶茶咖啡'];

export function SearchPage() {
  const { bindTap, bindBack } = useJingdongGestures();
  const [sp] = useSearchParams();
  const history = useJingdongStore((s) => s.searchHistory);
  const mainHot = useJingdongStore((s) => s.hotSearch);
  const removeHistory = useJingdongStore((s) => s.removeSearchHistory);
  const clearHistory = useJingdongStore((s) => s.clearSearchHistory);
  const addSearchHistory = useJingdongStore((s) => s.addSearchHistory);
  const [edit, setEdit] = useState(false);
  const [ai, setAi] = useState(false);
  const [q, setQ] = useState('');

  const from = sp.get('from');
  const food = from === 'miaosong' || from === 'waimai';
  const discovery = food ? DISCOVERY_FOOD : DISCOVERY;
  const hotSearch = food ? HOT_FOOD : mainHot;
  const hotTabs = food ? HOT_TABS_FOOD : HOT_TABS;
  const accent = food ? '#FF4E33' : '#E1251B';
  const placeholder = food ? '塔斯汀 · 品质好物一键直达' : '联想think book14+';
  const query = q.trim() || placeholder;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部搜索区 */}
      <div className="shrink-0 pt-10 px-3 pb-2 bg-white">
        <div className="flex items-center gap-1">
          <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center -ml-1">
            <IcNavBack size={22} className="text-[#333]" />
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="flex-1 text-left text-[15px] text-[#1A1A1A] placeholder:text-[#999] bg-transparent outline-none"
            data-action="search.input.type"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'search.aitoggle.switch' }, { onTrigger: () => setAi((v) => !v) })}
            className="flex items-center gap-1.5 border border-[#EEE] rounded-full pl-2.5 pr-1.5 py-1"
          >
            <span className="text-[14px] font-semibold bg-gradient-to-r from-[#7A5CFF] to-[#E1251B] bg-clip-text text-transparent">Ai 搜索</span>
            <span className="w-8 h-4 rounded-full relative transition-colors" style={{ background: ai ? accent : '#DDD' }}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${ai ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button {...bindTap({ kind: 'action', id: 'search.camera.wontfix' }, { onTrigger: wontfix })} aria-label="拍照" className="w-8 h-8 flex items-center justify-center text-[#666] relative">
              <IcCamera size={22} />
              <span className="absolute top-0 right-0 text-[8px] text-[#7A5CFF] font-bold">AI</span>
            </button>
            <div className="w-px h-4 bg-[#EEE]" />
            <button
              {...bindTap('search.submit', {
                params: { q: query, from: from || '' },
                beforeTrigger: () => addSearchHistory(query),
              })}
              style={{ background: accent }}
              className="px-4 h-9 rounded-full text-white text-[15px] font-semibold flex items-center"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {/* 搜索历史 */}
        {history.length > 0 && (
          <div className="px-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold text-[#1A1A1A]">搜索历史</span>
              {edit ? (
                <div className="flex items-center gap-4 text-[13px]">
                  <button {...bindTap({ kind: 'action', id: 'search.history.clearall.confirm' }, { onTrigger: () => { clearHistory(); setEdit(false); } })} className="text-[#999]">
                    全部删除
                  </button>
                  <button {...bindTap({ kind: 'action', id: 'search.history.editmode.toggle' }, { onTrigger: () => setEdit(false) })} style={{ color: accent }}>
                    完成
                  </button>
                </div>
              ) : (
                <button {...bindTap({ kind: 'action', id: 'search.history.editmode.toggle' }, { onTrigger: () => setEdit(true) })} aria-label="编辑历史" className="text-[#999]">
                  <IcTrash size={18} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {history.map((h) => (
                <div key={h} className="relative">
                  <button {...bindTap('search.suggest-open', { params: { q: h, from: from || '' } })} className="bg-[#F4F4F4] rounded-full px-3.5 py-1.5 text-[13px] text-[#333] max-w-[220px] truncate">
                    {h}
                  </button>
                  {edit && (
                    <button
                      {...bindTap({ kind: 'action', id: 'search.history.item.remove' }, { params: { keyword: h }, onTrigger: () => removeHistory(h) })}
                      aria-label="删除"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BBB] text-white text-[10px] flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索发现 */}
        <div className="px-3 pt-5">
          <div className="text-[16px] font-bold text-[#1A1A1A]">搜索发现</div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 mt-3">
            {discovery.map((d) => (
              <button key={d.word} {...bindTap('search.suggest-open', { params: { q: d.word, from: from || '' } })} className="flex items-center gap-1.5 text-left">
                <span className="text-[15px] text-[#333] truncate">{d.word}</span>
                {d.tag && (
                  <Tag className="text-white shrink-0" >
                    <span style={{ background: d.tagColor }} className="px-1 rounded-sm">{d.tag}</span>
                  </Tag>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 今日热搜 */}
        <div className="px-3 pt-6 pb-4">
          <div className="flex gap-5">
            {hotTabs.map((t, i) => (
              <span key={t} className="text-[16px]" style={i === 0 ? { color: accent, fontWeight: 700 } : { color: '#999' }}>{t}</span>
            ))}
          </div>
          <div className="mt-3 flex flex-col">
            {hotSearch.map((w, i) => (
              <button key={w} {...bindTap('search.suggest-open', { params: { q: w, from: from || '' } })} className="flex items-center gap-3 py-2.5 text-left">
                <span className="w-5 text-center text-[15px] font-bold" style={{ color: i < 3 ? accent : '#BBB' }}>{i + 1}</span>
                <span className="flex-1 text-[15px] text-[#333] truncate">{w}</span>
                <span className="text-[12px] text-[#BBB]">热度{(645 - i * 14).toFixed(1)}万</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
