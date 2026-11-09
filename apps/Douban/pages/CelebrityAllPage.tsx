import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img } from '../components/ui';

// 节点: celebrity.all —— 全部演职员页(分组粘性小节头:导演N/演员N)。
// evidence: IMG_Ff60ef9_t0014

/** 英文名(evidence t0014 行内第二行);seed 无 enName 字段,页面侧映射。 */
const EN_NAMES: Record<string, string> = {
  cel_xuzhanxiong: 'Changlin Gu',
  cel_liuye: 'Mozhi Shen',
  cel_yushi: 'Yu Cheng',
  cel_wangzhifei: 'Zhifei Lu',
  cel_wanglei: 'Zichuan Lei',
  cel_wangyaoqing: 'Zhilang Yao',
  cel_zhangli: 'Manli Zhang',
};

/** 职务行文案:导演 Director / 演员 Actor (饰 角色) */
function roleLine(role: string): string {
  if (role.includes('导演')) return '导演 Director';
  if (role.startsWith('饰 ')) return `演员 Actor (${role})`;
  return `演员 Actor (${role})`;
}

export default function CelebrityAllPage() {
  const { bindTap, bindBack } = useDoubanGestures();
  const routeParams = useParams();
  const subjects = useDoubanStore((s) => s.subjects);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const toast = useDoubanStore((s) => s.toast);

  const itemId = routeParams.itemId ?? 'm1';
  const subject = useMemo(
    () => subjects.find((s) => s.id === itemId) ?? subjects[0],
    [subjects, itemId],
  );
  const credits = subject.credits ?? [];
  const directors = credits.filter((cr) => cr.role.includes('导演'));
  const actors = credits.filter((cr) => !cr.role.includes('导演'));
  const celebById = useMemo(() => new Map(celebrities.map((c) => [c.id, c])), [celebrities]);

  const personRow = (cr: (typeof credits)[number]) => {
    const celeb = cr.celebrityId ? celebById.get(cr.celebrityId) : undefined;
    return (
      <div
        key={cr.name}
        {...(cr.celebrityId
          ? bindTap('celebrity.all.person-open', { params: { celebrityId: cr.celebrityId } })
          : bindTap({ kind: 'action', id: 'celebrity.all.person.missing' }, { onTrigger: () => toast('暂无影人资料') })
        )}
        className="flex items-center gap-3.5 px-4 py-3 cursor-pointer bg-white"
      >
        <Img src={celeb?.avatar ?? cr.avatar ?? ''} className="w-[80px] h-[110px] rounded object-cover shrink-0 self-center" />
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold truncate" style={{ color: C.text }}>{cr.name}</div>
          {cr.celebrityId && EN_NAMES[cr.celebrityId] && (
            <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{EN_NAMES[cr.celebrityId]}</div>
          )}
          <div className="mt-0.5 text-xs truncate" style={{ color: '#B9BEC6' }}>{roleLine(cr.role)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      {/* 顶部条:左上 X 关闭 + 居中标题 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white">
        <button
          {...bindBack()}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="关闭"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>全部演职员</div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {directors.length > 0 && (
          <>
            <div className="sticky top-0 z-10 px-4 py-1.5 text-xs" style={{ background: C.bg, color: C.sub }}>
              导演 {directors.length}
            </div>
            {directors.map(personRow)}
          </>
        )}
        {actors.length > 0 && (
          <>
            <div className="sticky top-0 z-10 px-4 py-1.5 text-xs" style={{ background: C.bg, color: C.sub }}>
              演员 {actors.length}
            </div>
            {actors.map(personRow)}
          </>
        )}
      </div>
    </div>
  );
}
