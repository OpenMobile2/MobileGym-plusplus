import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, SegRow } from '../components/ui';

// 节点: subject.toc —— 全部目录/全部摘录 全屏弹层(sheet)。
// evidence: frame:8b7ecc@t0018/t0020/t0022
// 源条目:约定取 history 中最近的 subject(与 markSheet overlay 同款约定)。
interface Digest {
  text: string;
  chapter: string;
  userId: string;
  page: number;
  hot: number;
}

export default function SubjectTocPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const [searchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const users = useDoubanStore((s) => s.users);
  const history = useDoubanStore((s) => s.history);

  const sourceSubject = useMemo(() => {
    const h = history.find((x) => x.kind === 'subject');
    return subjects.find((s) => s.id === h?.refId) ?? subjects.find((s) => s.type === 'book') ?? subjects[0];
  }, [history, subjects]);

  const toc = sourceSubject?.toc ?? [];
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const neighbors = useMemo(() => users.filter((u) => !u.isSelf).slice(0, 4), [users]);

  const digests = useMemo<Digest[]>(() => {
    const chapters = toc.length > 0 ? toc : ['正文'];
    return [
      { text: '我们习惯把乌托邦读成逃避,可它更像一次演习——在纸上把不同的社会分工试跑一遍。', chapter: chapters[0], userId: neighbors[0]?.id ?? 'u2', page: 12, hot: 233 },
      { text: '语言里的人称代词被磨平,权力就少了一个藏身之处。', chapter: chapters[Math.min(1, chapters.length - 1)], userId: neighbors[1]?.id ?? 'u3', page: 88, hot: 156 },
      { text: '每一个制度设想都给出了代价,这份耐心比激进更打动我。', chapter: chapters[chapters.length - 1], userId: neighbors[2]?.id ?? 'u4', page: 205, hot: 47 },
    ];
  }, [toc, neighbors]);

  const initialTab = searchParams.get('tab') === '目录' ? 'toc' : 'digest';
  const [tab] = useState<'toc' | 'digest'>(initialTab);
  const [sort, setSort] = useState<'hot' | 'page'>('hot');

  const sortedDigests = useMemo(
    () => (sort === 'hot' ? [...digests].sort((a, b) => b.hot - a.hot) : [...digests].sort((a, b) => a.page - b.page)),
    [digests, sort],
  );

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      {/* 顶栏:×关闭(无 tab 条,evidence t0020) */}
      <div className="flex items-center h-11 px-1 shrink-0">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>✕</button>
        <div className="flex-1" />
        <div className="w-10" />
      </div>

      {/* 左对齐大标题(× 下一行) */}
      <div className="px-4 pt-1 pb-3">
        <div className="text-[22px] font-bold" style={{ color: C.text }}>{tab === 'toc' ? '完整目录' : '全部摘录'}</div>
      </div>

      {/* 排序分段(仅摘录态):右对齐方形分段,active=白底描边深字 */}
      {tab === 'digest' && (
        <div className="flex items-center px-4 pb-2">
          <div className="flex-1" />
          <SegRow
            options={['热度', '按页码']}
            value={sort === 'hot' ? '热度' : '按页码'}
            bindFor={(opt) =>
              bindTap(
                { kind: 'action', id: 'subject.toc.sort.select.byPage' },
                { params: { target: opt === '热度' ? 'hot' : 'page' }, onTrigger: () => setSort(opt === '热度' ? 'hot' : 'page') },
              )
            }
            size="sm"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'toc' ? (
          <div className="px-4 py-2">
            {(toc.length > 0 ? toc : ['暂无目录']).map((line, i) => (
              <div key={i} className="py-3 border-b text-[15px]" style={{ borderColor: '#F5F6F7', color: C.text }}>{line}</div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-2">
            {sortedDigests.map((d, i) => {
              const u = userById.get(d.userId);
              return (
                <div key={i} className="py-4 border-b" style={{ borderColor: '#F5F6F7' }}>
                  {/* 左上角大引号装饰 */}
                  <div className="text-[26px] leading-none font-serif mb-0.5" style={{ color: '#D8DCE1' }}>“</div>
                  <div className="text-[15px] leading-relaxed" style={{ color: C.text }}>{d.text}</div>
                  <div className="mt-2 text-xs" style={{ color: C.sub }}>引自 {d.chapter}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      {...bindTap('subject.toc.user-open', { params: { userId: d.userId } })}
                      className="bg-transparent border-none cursor-pointer p-0 text-xs"
                      style={{ color: C.sub }}
                    >
                      {u?.name ?? '豆友'}
                    </button>
                    <button
                      {...bindTap({ kind: 'action', id: 'subject.toc.original.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                      className="text-xs bg-transparent border-none cursor-pointer"
                      style={{ color: C.sub }}
                    >
                      查看原文 ›
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
