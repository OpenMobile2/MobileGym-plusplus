import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcClose, IcHistory, IcArrowRight } from '../res/icons';

type Perspective = {
  id: string;
  name: string;
  author: string;
  desc: string;
  insight: string;
};

const PERSPECTIVES: Perspective[] = [
  {
    id: 'default',
    name: '默认洞察',
    author: 'by flomo',
    desc: '挖掘笔记背后隐藏的思维模式与深层内在矛盾',
    insight:
      '你的笔记反复回到「做难而正确的事」与「保持记录习惯」两条主线。表面是知识管理，底层其实是在对抗拖延与遗忘——你倾向用书写把模糊的念头固定下来，再回看时才发现真正在意的是「持续」本身。',
  },
  {
    id: 'value',
    name: '价值澄清',
    author: 'by shaonan',
    desc: '从笔记里找出你真正看重的东西，从混乱回到核心',
    insight:
      '在反复出现的标签里，「读书 / 记忆 / 如果」占了大半。它们指向同一个价值：你更看重「长期复利」而非短期反馈。建议把这条价值显性化，下次取舍时拿它当尺子。',
  },
  {
    id: 'reverse',
    name: '逆向思考',
    author: 'by shaonan',
    desc: '通过苛刻的逆向思维来考察笔记中的关键目标',
    insight:
      '反过来问：如果你想彻底失去这套笔记带来的复利，最快的方式是什么？大概是「只记不看」。你的回顾频率明显低于记录频率——这正是当前最脆弱的环节。',
  },
  {
    id: 'second',
    name: '二阶思考',
    author: 'by shaonan',
    desc: '从笔记中识别出问题，并提炼出问题之上的问题',
    insight:
      '你常记录「怎么做」，却很少追问「为什么是这个问题」。把一阶的执行笔记往上提一层，写下它服务的更大目标，洞察会显著变深。',
  },
  {
    id: 'cbt',
    name: 'CBT 疗法',
    author: 'by flomo',
    desc: '识别笔记中的思维陷阱并提供具体的改善建议',
    insight:
      '部分笔记里有「应该 / 必须」式的绝对化措辞，这是典型的认知扭曲信号。试着把「我必须每天都记」改写成「我希望尽量保持记录」，压力会小很多，反而更可持续。',
  },
  {
    id: 'mbti',
    name: 'MBTI 分析',
    author: 'by flomo',
    desc: '从你的笔记内容中解读真实的 MBTI 人格类型',
    insight:
      '从用词偏好看，你倾向抽象归纳（N）、重逻辑结构（T）、习惯先想清再动手（J），同时记录多为独处思考（I）。综合更接近 INTJ——擅长把零散信息收敛成体系。',
  },
];

export default function AiInsightPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const user = useFlomoStore((s) => s.user);
  const toast = useFlomoStore((s) => s.toast);
  const [active, setActive] = useState<Perspective | null>(null);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 / 历史洞察 */}
      <div className="flex items-center justify-between h-12 px-3 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'ai.insight.history.open' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full border-none cursor-pointer"
          style={{ background: C.surface, color: C.text, fontSize: 13 }}
        >
          <IcHistory size={15} />
          历史洞察
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <h1 className="font-bold text-xl mt-1 mb-2" style={{ color: C.text }}>
          选择任意视角，开始洞察
        </h1>

        {/* 洞察范围 */}
        <button
          {...bindTap({ kind: 'action', id: 'ai.insight.scope.open' }, { onTrigger: () => toast('设置洞察的笔记范围') })}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 mb-4"
          style={{ color: C.sub, fontSize: 13 }}
        >
          <span style={{ color: C.linkBlue }}>{user.memoCount} 条笔记</span>
          <span>/ {user.tagCount} 标签</span>
          <span>/ {user.days} 天</span>
          <span style={{ color: C.linkBlue }}>洞察范围</span>
        </button>

        {/* 生成结果(选视角后展示预置模拟文本) */}
        {active && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <div className="font-semibold mb-2" style={{ color: C.text, fontSize: 14 }}>
              {active.name} · 洞察
            </div>
            <div className="whitespace-pre-wrap break-words" style={{ color: C.text, fontSize: 14, lineHeight: 1.7 }}>
              {active.insight}
            </div>
            <div className="mt-3" style={{ color: C.sub, fontSize: 11 }}>
              当前内容由 AI 生成，仅供参考
            </div>
          </div>
        )}

        {/* 视角卡片列表 */}
        <div className="flex flex-col gap-2.5">
          {PERSPECTIVES.map((p) => (
            <button
              key={p.id}
              {...bindTap(
                { kind: 'action', id: 'ai.insight.perspective.run' },
                {
                  onTrigger: () => {
                    setActive(p);
                    toast(`已按「${p.name}」视角生成洞察`);
                  },
                },
              )}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 border-none cursor-pointer text-left"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: C.tagBg, color: C.tagText, fontSize: 16 }}
              >
                ✦
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold" style={{ color: C.text, fontSize: 15 }}>{p.name}</span>
                  <span style={{ color: C.sub, fontSize: 11 }}>{p.author}</span>
                </div>
                <div className="truncate mt-0.5" style={{ color: C.sub, fontSize: 12 }}>{p.desc}</div>
              </div>
              <IcArrowRight size={16} style={{ color: C.sub }} />
            </button>
          ))}
        </div>

        {/* 发现更多视角 / 自定义 */}
        <button
          {...bindTap({ kind: 'action', id: 'ai.insight.more.open' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-full flex items-center justify-between rounded-2xl px-4 h-12 border-none cursor-pointer mt-2.5"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 14 }}
        >
          发现更多视角 / 自定义
          <IcArrowRight size={16} style={{ color: C.sub }} />
        </button>
      </div>
    </div>
  );
}
