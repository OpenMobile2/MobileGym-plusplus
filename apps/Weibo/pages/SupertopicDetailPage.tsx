import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img, fmtCount, TopBar } from '../components/ui';
import { IcBack, IcDiscover, IcShare, IcCalendar } from '../res/icons';

const ST_TABS = ['详情', '热门', '最新', '名人动态', '超友趣', '追星纪念'] as const;

export default function SupertopicDetailPage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const supertopics = useWeiboStore((st) => st.supertopics);
  const statuses = useWeiboStore((st) => st.statuses);
  const signSupertopic = useWeiboStore((st) => st.signSupertopic);
  const followSupertopic = useWeiboStore((st) => st.followSupertopic);

  const topic = supertopics.find((t) => t.id === id);
  const tab = searchParams.get('tab') ?? '热门';

  const posts = statuses.filter((x) => x.supertopicId === id);
  const shown = tab === '最新' ? [...posts].sort((a, b) => b.timestamp - a.timestamp) : [...posts].sort((a, b) => b.likes - a.likes);

  if (!topic) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar backBinding={bindBack()} title="超话" />
        <div className="flex-1 flex items-center justify-center text-[#9A9A9A]">超话不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      {/* 头部卡 */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <Img src={topic.cover} label={topic.name[0]} className="w-full h-full object-cover blur-md scale-110 opacity-70" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative">
          <div className="flex items-center h-11 px-2">
            <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-white p-1"><IcBack size={22} /></button>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'supertopic.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="bg-transparent border-none cursor-pointer text-white p-1"
            >
              <IcDiscover size={18} />
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'supertopic.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="bg-transparent border-none cursor-pointer text-white p-1"
            >
              <IcShare size={18} />
            </button>
          </div>
          <div className="flex gap-3 px-3 pb-3">
            <Img src={topic.cover} label={topic.name[0]} className="w-16 h-16 rounded-lg object-cover shrink-0 border-2 border-white/40" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[18px] font-bold text-white">{topic.name}</span>
                {topic.badge && <span className="text-[9px] text-white bg-[#7FB3F5] rounded px-1 leading-4">💎{topic.badge}</span>}
              </div>
              <div className="text-[12px] text-white/85 mt-0.5">
                {fmtCount(topic.posts)}帖子 | {fmtCount(topic.fans)}{topic.fanName} &gt;
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-white/90 bg-white/20 rounded px-1.5 py-0.5">明星超话</span>
                <span className="text-[10px] text-white/90 bg-white/20 rounded px-1.5 py-0.5">今日签到{fmtCount(topic.todaySigned)}人</span>
                {!topic.followed && (
                  <button
                    {...bindTap({ kind: 'action', id: 'supertopic.follow.toggle' }, {
                      params: { supertopicId: topic.id },
                      onTrigger: () => followSupertopic(topic.id),
                    })}
                    className="text-[11px] text-[#FF8200] bg-white rounded-full px-2.5 py-0.5 border-none cursor-pointer"
                  >
                    + {s.follow.replace('+', '').trim()}
                  </button>
                )}
              </div>
            </div>
            {/* 签到按钮/连签挂件 */}
            <button
              {...bindTap({ kind: 'action', id: 'supertopic.signin.submit' }, {
                params: { supertopicId: topic.id },
                onTrigger: () => {
                  if (!topic.followed) { toast('需先关注超话'); return; }
                  if (topic.signedToday) { toast('今天已签过'); return; }
                  signSupertopic(topic.id);
                  toast(s.signedToast);
                },
              })}
              className="shrink-0 self-start flex flex-col items-center bg-white/95 rounded-lg px-2.5 py-1.5 border-none cursor-pointer"
            >
              <IcCalendar size={18} className="text-[#FF8200]" />
              <span className="text-[11px] text-[#1A1A1A] mt-0.5">
                {topic.signedToday ? `连签${topic.signStreak}天` : s.signin}
              </span>
              {!topic.signedToday && <span className="w-1.5 h-1.5 rounded-full bg-[#FF3852] absolute -top-0.5 -right-0.5" />}
            </button>
          </div>
          {/* 超友趣卡(wontfix壳) */}
          <button
            {...bindTap({ kind: 'action', id: 'supertopic.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="mx-3 mb-3 w-[calc(100%-24px)] flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 border-none cursor-pointer text-left"
          >
            <span className="text-[12px] text-[#FFD766] font-bold shrink-0">超友趣</span>
            <span className="text-[13px] text-white truncate flex-1">点击寻找演唱会搭子 · 一键参与找搭子/拼房/换物料</span>
            <span className="text-[11px] text-[#1A1A1A] bg-[#FFD766] rounded-full px-2 py-0.5 shrink-0">去发起</span>
          </button>
        </div>
      </div>

      {/* tab 条 */}
      <div className="flex items-center gap-4 px-3 h-10 bg-white overflow-x-auto shrink-0" data-scroll-container="st-tabs" data-scroll-direction="horizontal">
        {ST_TABS.map((t) => (
          <button
            key={t}
            {...(t === '超友趣' || t === '追星纪念'
              ? bindTap({ kind: 'action', id: 'supertopic.tab.select.target' }, { params: { target: t }, onTrigger: () => toast(s.notOpen) })
              : bindTap({ kind: 'action', id: 'supertopic.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setSearchParams((p) => { t === '热门' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
              }))}
            className={`text-[14px] bg-transparent border-none cursor-pointer whitespace-nowrap relative pb-1 shrink-0 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="supertopic-feed" data-scroll-direction="vertical">
        {tab === '详情' && (
          <div className="bg-white p-4 mb-2 text-[14px] leading-relaxed text-[#1A1A1A]">
            <div className="font-bold mb-2">◇{topic.name} 超话</div>
            欢迎来到{topic.name}超话!这里聚集了 {fmtCount(topic.fans)} 位{topic.fanName},共发布 {fmtCount(topic.posts)} 条帖子。
            发帖请遵守社区规范,理性讨论,友善交流~
          </div>
        )}
        {tab === '名人动态' && (
          <div className="bg-white mb-2">
            <div className="flex gap-3 px-3 pt-3 text-[13px]">
              {['名人动态', '空降超话', '上热搜了'].map((sub, i) => (
                <span key={sub} className={i === 0 ? 'text-[#FF8200] font-bold' : 'text-[#7F7F7F]'}>{sub}</span>
              ))}
            </div>
            <div className="flex items-center gap-2.5 px-3 py-3 border-b border-[#FAFAFA]">
              <Img src={topic.cover} label={topic.name[0]} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="text-[14px] text-[#E68A3C]">{topic.name}</div>
                <div className="text-[12px] text-[#9A9A9A]">6-30在线了</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-3">
              <span className="w-9 h-9 rounded-full bg-[#2B4B8C] text-white flex items-center justify-center text-[14px] shrink-0">📅</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">名人日程表</div>
                <div className="text-[12px] text-[#9A9A9A] truncate">08.02 19:30 {topic.name}「安泊猜想」演唱会-武汉站</div>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'supertopic.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="text-[12px] text-[#FF8200] border border-[#FF8200] rounded-full px-2.5 py-1 bg-transparent cursor-pointer shrink-0"
              >
                查看
              </button>
            </div>
          </div>
        )}
        {(tab === '热门' || tab === '最新') && (
          <>
            <div className="bg-white px-3 py-2 mb-0.5 flex items-center gap-1.5">
              <span className="text-[9px] text-white bg-[#FF3852] rounded px-1 leading-4">置顶</span>
              <span className="text-[13px] text-[#1A1A1A] truncate">关于尊重与保护{topic.name}知识产权及肖像权的倡导</span>
            </div>
            {shown.length ? shown.map((st) => (
              <div key={st.id} className="relative">
                <StatusCard status={st} openTransition="supertopic.status-open" userTransition="supertopic.user-open" showFollow={false} />
              </div>
            )) : (
              <div className="text-center text-[13px] text-[#9A9A9A] py-10">还没有帖子,快来发第一帖!</div>
            )}
          </>
        )}
        <div className="h-14" />
      </div>

      {/* 底部栏:我来发一帖 | 群聊 | 我的 */}
      <div className="flex items-center gap-3 px-3 h-12 bg-[#1F1F1F] shrink-0">
        <button
          {...bindTap('supertopic.compose-open', { params: { id: topic.id } })}
          className="flex-1 h-8 rounded-full bg-[#333333] text-left px-3 text-[13px] text-[#AAAAAA] border-none cursor-pointer"
        >
          ✏️ {s.postBar}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'supertopic.bottom.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="flex flex-col items-center text-[#CCCCCC] bg-transparent border-none cursor-pointer"
        >
          <span className="text-[15px]">👥</span>
          <span className="text-[9px]">群聊</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'supertopic.bottom.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="flex flex-col items-center text-[#CCCCCC] bg-transparent border-none cursor-pointer"
        >
          <span className="text-[10px] text-[#FFD766] font-bold leading-none mt-0.5">LV{Math.min(topic.signStreak + 1, 9)}</span>
          <span className="text-[9px]">我的</span>
        </button>
      </div>
      {toastNode}
    </div>
  );
}
