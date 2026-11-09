import React, { useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useComposeSession } from '../components/composeStore';
import { Img } from '../components/ui';
import { TOPIC_CATEGORIES } from '../constants';

export default function TopicPickerPage() {
  const { bindTap, bindBack, back } = useWeiboGestures();
  const topics = useWeiboStore((s) => s.topics);
  const session = useComposeSession();
  const [cat, setCat] = useState<string>('美食');
  const [kw, setKw] = useState('');

  const list = topics.filter((t) => (kw ? t.name.includes(kw) : t.category === cat));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部搜索 */}
      <div className="flex items-center gap-2 px-3 h-12 shrink-0">
        <div className="flex-1 flex items-center gap-1 h-8 bg-[#F5F5F5] rounded-full px-3">
          <span className="text-[#9A9A9A]">#</span>
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="话题、电影、书、歌曲、地点、股票"
            data-action="topicPicker.search.input"
            data-action-type="input"
            className="flex-1 bg-transparent border-none outline-none text-[13px]"
          />
        </div>
        <button {...bindBack()} className="text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer">取消</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类 */}
        <div className="w-20 shrink-0 overflow-y-auto bg-[#F7F7F7]">
          {TOPIC_CATEGORIES.map((c) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'topicPicker.category.select.target' }, {
                params: { target: c },
                onTrigger: () => { setCat(c); setKw(''); },
              })}
              className={`block w-full py-3 text-[13px] border-none cursor-pointer relative ${cat === c && !kw ? 'bg-white text-[#1A1A1A] font-semibold' : 'bg-transparent text-[#5B5B5B]'}`}
            >
              {cat === c && !kw && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF8200] rounded-r" />}
              {c}
            </button>
          ))}
        </div>
        {/* 右侧列表 */}
        <div className="flex-1 overflow-y-auto" data-scroll-container="topic-list" data-scroll-direction="vertical">
          {list.map((t) => (
            <button
              key={t.name}
              {...bindTap({ kind: 'action', id: 'topicPicker.topic.insert' }, {
                params: { topic: t.name },
                onTrigger: () => { session.append(`#${t.name}# `); back(); },
              })}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 bg-transparent border-none cursor-pointer text-left"
            >
              <Img src={t.cover} label={t.name[0]} className="w-11 h-11 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#1A1A1A] truncate">#{t.name}#</div>
                <div className="text-[12px] text-[#9A9A9A]">{t.discuss}</div>
              </div>
            </button>
          ))}
          {list.length === 0 && <div className="text-center text-[13px] text-[#9A9A9A] py-10">加载中….</div>}
        </div>
      </div>
    </div>
  );
}
