// 答题入组(group.joinQuiz,frame:1779a1@t0035-0055,qa:Q6):
// 组主题色全屏背景 + 欢迎横幅 + 「n/5题」进度 + 单选题卡(选中绿底,自动进入下一题)
// + 第5题作答后判分:全对→result.pass(→组详情已加入,成员+1);错n题→result.fail(取消/再答一次,同套题不换题)。
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C } from '../components/ui';

type Phase = 'question' | 'fail' | 'pass';

export default function GroupJoinquizPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const { groupId = '' } = useParams();
  const groups = useDoubanStore((s) => s.groups);
  const submitGroupQuiz = useDoubanStore((s) => s.submitGroupQuiz);

  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
  const questions = group?.quiz ?? [];

  const [phase, setPhase] = useState<Phase>('question');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [wrongCount, setWrongCount] = useState(0);

  const theme = group?.themeColor ?? C.green;

  const restart = () => {
    setPhase('question');
    setIdx(0);
    setAnswers([]);
    setWrongCount(0);
  };

  const selectOption = (optionIndex: number) => {
    if (phase !== 'question') return;
    const nextAnswers = [...answers, optionIndex];
    setAnswers(nextAnswers);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      return;
    }
    // 判分
    let wrong = 0;
    nextAnswers.forEach((a, i) => {
      if (a !== questions[i].answer) wrong++;
    });
    const passed = wrong === 0;
    setWrongCount(wrong);
    submitGroupQuiz(groupId, passed);
    setPhase(passed ? 'pass' : 'fail');
  };

  if (!group || questions.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: theme }} data-status-bar-foreground="light">
        <div className="text-white text-sm">该小组无入组答题</div>
        <button {...bindBack()} className="mt-4 px-5 h-9 rounded-full text-sm bg-white cursor-pointer border-none" style={{ color: theme }}>返回</button>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="flex flex-col h-full" style={{ background: theme }} data-status-bar-foreground="light">
      {phase === 'question' && (
        <>
          {/* 欢迎横幅 + 引导小字(一段) */}
          <div className="px-5 pt-6 pb-4 shrink-0">
            <div className="text-white text-lg font-bold">欢迎你来{group.name}小组</div>
            <div className="text-white/85 text-xs mt-1.5 leading-relaxed">
              答题通过后即可加入,请仔细阅读组规,开始答题吧!
            </div>
          </div>

          {/* 进度:「n / 5 题」+ 左侧短进度小条 */}
          <div className="px-5 shrink-0">
            <div className="text-xs text-white/90 mb-1.5">{idx + 1} / {questions.length} 题</div>
            <div className="h-1 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          {/* 题卡 */}
          <div className="flex-1 overflow-y-auto px-5 py-5" data-scroll-container="main" data-scroll-direction="vertical">
            <div className="rounded-2xl bg-white p-4">
              <span className="text-[11px]" style={{ color: C.sub }}>单选</span>
              <div className="text-[16px] font-semibold mt-1 mb-4" style={{ color: C.text }}>{q.question}</div>
              <div className="space-y-2.5">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2.5">
                    {/* 字母 A-D 在白色选项条外侧灰字 */}
                    <span className="w-4 shrink-0 text-sm" style={{ color: C.sub }}>{String.fromCharCode(65 + oi)}</span>
                    <button
                      {...bindTap({ kind: 'action', id: 'groupQuiz.option.select.target' }, {
                        params: { target: String(oi) },
                        onTrigger: () => selectOption(oi),
                      })}
                      className="flex-1 text-left px-4 py-3 rounded-xl text-sm border cursor-pointer"
                      style={{ background: '#fff', color: C.text, borderColor: C.border }}
                    >
                      {opt}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 退出答题 */}
          <div className="px-5 pb-6 shrink-0">
            <button
              {...bindBack()}
              className="w-full h-11 rounded-full text-sm bg-white/20 text-white border-none cursor-pointer"
            >
              退出答题
            </button>
          </div>
        </>
      )}

      {phase === 'fail' && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="text-6xl mb-4">🙁</div>
            <div className="text-white text-xl font-bold">考试未通过</div>
            <div className="text-white/85 text-sm mt-2">答错了{wrongCount}题</div>
          </div>
          {/* 底部左右分栏:取消 | 再答一次(中间竖线) */}
          <div className="shrink-0 flex items-stretch h-13" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              {...bindBack()}
              className="flex-1 flex items-center justify-center text-sm text-white bg-transparent border-none cursor-pointer"
            >
              取消
            </button>
            <span className="w-px my-3" style={{ background: 'rgba(255,255,255,0.25)' }} />
            <button
              {...bindTap({ kind: 'action', id: 'groupQuiz.retry.restart' }, { onTrigger: restart })}
              className="flex-1 flex items-center justify-center text-sm font-semibold text-white bg-transparent border-none cursor-pointer"
            >
              再答一次
            </button>
          </div>
        </>
      )}

      {phase === 'pass' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-6xl mb-4">👏</div>
          <div className="text-white text-xl font-bold">恭喜通过答题,欢迎加入小组</div>
          <button
            {...bindTap('groupQuiz.pass-back', { params: { groupId } })}
            className="mt-10 w-full h-11 rounded-full text-sm bg-white border-none cursor-pointer"
            style={{ color: theme, fontWeight: 600 }}
          >
            好的
          </button>
        </div>
      )}
    </div>
  );
}
