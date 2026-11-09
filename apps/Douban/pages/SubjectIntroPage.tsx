import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Img } from '../components/ui';

// 节点: subject.intro —— 剧情简介全文页(深色皮肤,与 subject.movie 同板)。
// evidence: IMG_Ff60ef9_t0010(详情页截断简介);全文页按豆瓣惯例为纯文本静态页。

/** 深色皮肤色板(与 SubjectMoviePage 一致) */
const D = {
  bg: '#33373D',
  text: '#F2F3F5',
  sub: '#9BA1A8',
  body: '#C9CDD2',
} as const;

/** 全文简介(原创虚构,与 seed 条目 赤水长歌 对应);seed intro 为一行摘要,全文页展开完整段。 */
const FULL_INTROS: Record<string, string> = {
  m1: '战火年代,一支被围困的行军队伍身陷绝境。年轻的指挥官凌沨(沈默之 饰)临危受命,带领残部沿赤水一带辗转周旋。一渡形势所迫、实属无奈;二渡出其不意,打乱追兵阵脚;三渡以虚为实,尽显调度智慧;四渡更是险中求胜。渡口的月光下,是无数普通人用脚步丈量出的生路。影片以群像视角还原一段惊心动魄的战略转移,写给每一个在绝境里仍然向前的人。',
};

export default function SubjectIntroPage() {
  const { bindBack } = useDoubanGestures();
  const routeParams = useParams();
  const subjects = useDoubanStore((s) => s.subjects);
  const toast = useDoubanStore((s) => s.toast);

  const itemId = routeParams.itemId ?? 'm1';
  const subject = useMemo(
    () => subjects.find((s) => s.id === itemId) ?? subjects[0],
    [subjects, itemId],
  );
  const fullText = FULL_INTROS[subject.id] ?? subject.intro ?? '暂无简介';

  return (
    <div className="flex flex-col h-full" style={{ background: D.bg }} data-status-bar-foreground="light">
      {/* 顶部条:返回 + 条目名 */}
      <div className="flex items-center h-11 px-1 shrink-0" style={{ background: D.bg }}>
        <button
          {...bindBack()}
          className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer"
          style={{ color: D.text }}
        >
          ‹
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0 px-1">
          <Img src={subject.cover} className="w-6 h-8 rounded-sm object-cover shrink-0" />
          <span className="font-semibold text-base truncate" style={{ color: D.text }}>{subject.title}</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-10" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-lg font-bold" style={{ color: D.text }}>剧情简介</div>
        {subject.year && (
          <div className="mt-1 text-xs" style={{ color: D.sub }}>
            {subject.title}({subject.year})
          </div>
        )}
        <div className="mt-3 text-[15px] leading-[1.9] whitespace-pre-wrap" style={{ color: D.body }}>
          {fullText}
        </div>
        {/* 投诉简介(t0010 简介区右下灰字) */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => toast('该功能暂未开放')}
            className="text-xs bg-transparent border-none cursor-pointer"
            style={{ color: D.sub }}
          >
            投诉简介
          </button>
        </div>
      </div>
    </div>
  );
}
