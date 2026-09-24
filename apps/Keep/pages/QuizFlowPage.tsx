import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { WheelPicker } from '../components/WheelPicker';
import {
  IcNavBack, IcArrowRight, IcCheck, IcPerson, IcFootprints, IcDumbbell, IcActivity, IcCircle,
} from '../res/icons';

/** 步骤注册表(顺序锁定:伤病→身体信息→体型→运动类型→时长→器械→俯卧撑→跑距→深蹲→爬楼) */
const STEPS: { id: string; cat: string; title: string; options: string[] }[] = [
  { id: 'injury', cat: '基础信息', title: '你是否存在伤病困扰', options: ['膝盖', '腰部'] },
  { id: 'body', cat: '基础信息', title: '确认你的身体信息', options: [] },
  { id: 'bodytype', cat: '基础信息', title: '选择你的体型', options: ['直筒型', '梨型', '沙漏型', '苹果型'] },
  { id: 'sport', cat: '运动偏好', title: '你希望在基础训练外,增加哪些运动类型?', options: ['操课', '跳绳', '跑步'] },
  { id: 'duration', cat: '运动偏好', title: '你希望每天运动多长时间?', options: ['20 分钟左右', '30 分钟左右', '40 分钟左右'] },
  { id: 'equipment', cat: '运动偏好', title: '是否允许计划使用以下运动器械?', options: ['哑铃', '弹力带'] },
  { id: 'pushup', cat: '运动能力', title: '你可以连续完成多少个俯卧撑?', options: ['从来没试过,或 1 个也做不了', '10 个以内', '10-20 个', '20-30 个', '30 个以上'] },
  { id: 'run', cat: '运动能力', title: '你单次跑步的最远距离是多少?', options: ['少于 3 公里', '3-5 公里', '5-7 公里', '7 公里以上'] },
  { id: 'squat', cat: '运动能力', title: '你可以连续完成多少个标准深蹲?', options: ['从来没试过,或 10 个以内', '10-20 个', '20-30 个', '30-40 个', '40 个以上'] },
  { id: 'stairs', cat: '运动能力', title: '上五层楼后是否会感到疲累或呼吸局促?', options: ['很累,甚至有点喘不过气', '比较累,呼吸也比较局促', '呼吸有点局促,但可以很快恢复', '几乎没有感觉', '非常轻松,完全没影响'] },
];

const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => 150 + i);
const WEIGHT_OPTIONS = Array.from({ length: 111 }, (_, i) => 40 + i);

/** 定制问卷(一页多步 step=1..10)—— 节点 quiz.flow(证据 s038-s047/s051) */
export default function QuizFlowPage() {
  const { bindTap, bindBack, back } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const quiz = useKeepStore((st) => st.quiz);
  const user = useKeepStore((st) => st.user);
  const setQuizAnswer = useKeepStore((st) => st.setQuizAnswer);
  const setBodyInfo = useKeepStore((st) => st.setBodyInfo);

  const step = Math.min(10, Math.max(1, Number(searchParams.get('step') ?? 1)));
  const hwSheetOpen = searchParams.get('hw') === '1';
  const cur = STEPS[step - 1];

  // 双滚轮弹层待确认值(表单暂存)
  const [pendH, setPendH] = useState<number>(user.heightCm);
  const [pendW, setPendW] = useState<number>(Math.round(user.weightKg));

  const injuries = Array.isArray(quiz.answers.injury) ? (quiz.answers.injury as string[]) : [];
  const answerOf = (qid: string): string => {
    const v = quiz.answers[qid];
    if (Array.isArray(v)) return v.join('、');
    return v ?? '';
  };
  const bodyType = (quiz.answers.bodytype as string) || '苹果型';

  const gotoStep = (n: number) =>
    setSearchParams((p) => { p.set('step', String(n)); return p; });

  const stepAnswered = (() => {
    if (cur.id === 'injury') return injuries.length > 0;
    if (cur.id === 'body') return true;
    return Boolean(quiz.answers[cur.id]);
  })();

  /** 已答折叠区摘要 */
  const collapsedSummary = (st: typeof STEPS[number]): string => {
    if (st.id === 'injury') return answerOf('injury') || '不存在伤病困扰';
    if (st.id === 'body') return `${user.heightCm}cm,${Math.round(user.weightKg)}kg · ${bodyType}`;
    if (st.id === 'bodytype') return bodyType;
    return answerOf(st.id);
  };

  return (
    <div className="flex flex-col h-full bg-app-surface relative" data-status-bar-foreground="dark">
      {/* 顶部导航:返回 + 进度条 */}
      <div className="flex items-center gap-3 px-3 h-12 shrink-0">
        <button {...bindBack()} className="p-1 bg-transparent border-none text-app-text" aria-label={s.back}>
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(step / STEPS.length) * 100}%`, background: '#3B3A44' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 已答项折叠区 */}
        {STEPS.slice(0, step - 1).map((st, i) => (
          <button
            key={st.id}
            {...bindTap(
              { kind: 'action', id: 'quiz.flow.answered.expand' },
              { params: { q: st.id }, onTrigger: () => gotoStep(i + 1) },
            )}
            className="flex items-center w-full mb-2 px-4 py-3 rounded-xl border border-app-border bg-transparent text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-app-text-muted">{st.title}</div>
              <div className="text-[14px] text-app-text mt-0.5 truncate">{collapsedSummary(st)}</div>
            </div>
            <IcArrowRight size={16} className="text-app-text-muted shrink-0" />
          </button>
        ))}

        {/* 当前题干 */}
        <div className="inline-block px-2 py-1 rounded text-[12px] text-app-text bg-gray-100 mt-2">{cur.cat}</div>
        <div className="text-[22px] font-bold text-app-text mt-3 leading-snug">{cur.title}</div>

        {cur.id === 'injury' && (
          <>
            <div className="text-[13px] text-app-text-muted mt-2">
              选择伤病部位后,将为你去除不适合的动作及器械类动作
            </div>
            <div className="flex gap-3 mt-8">
              {[
                { name: '膝盖', desc: '关节疼痛、卡顿或不适' },
                { name: '腰部', desc: '疼痛或下肢麻木' },
              ].map((it) => {
                const sel = injuries.includes(it.name);
                return (
                  <button
                    key={it.name}
                    {...bindTap(
                      { kind: 'action', id: 'quiz.flow.injury.toggle' },
                      {
                        params: { value: it.name },
                        onTrigger: () =>
                          setQuizAnswer(
                            'injury',
                            sel ? injuries.filter((x) => x !== it.name) : [...injuries, it.name],
                          ),
                      },
                    )}
                    className="flex-1 rounded-xl pt-6 pb-4 flex flex-col items-center gap-1"
                    style={{
                      background: sel ? '#EDFBF4' : '#F5F6F8',
                      border: sel ? `1.5px solid ${C.green}` : '1.5px solid transparent',
                    }}
                  >
                    <span className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                      {it.name === '膝盖' ? <IcCircle size={22} className="text-app-text" /> : <IcPerson size={22} className="text-app-text" />}
                    </span>
                    <span className="text-[16px] font-semibold text-app-text mt-1">{it.name}</span>
                    <span className="text-[11px] text-app-text-muted">{it.desc}</span>
                    <span
                      className="mt-1 w-5 h-5 rounded flex items-center justify-center"
                      style={{ background: sel ? C.green : 'transparent', border: sel ? 'none' : '1.5px solid #D9DBE0' }}
                    >
                      {sel && <IcCheck size={14} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {cur.id === 'body' && (
          <>
            <div className="text-[13px] text-app-text-muted mt-2">体型越接近真实的自己,能匹配更合适你的运动</div>
            <div className="flex items-center mt-8 gap-4">
              <div
                className="w-28 h-52 rounded-2xl shrink-0"
                style={{ background: 'linear-gradient(180deg, #F7E8DC 20%, #FDF7F2 100%)' }}
              />
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-app-text">身高体重</div>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'quiz.flow.hw.edit' },
                    {
                      onTrigger: () => {
                        setPendH(user.heightCm);
                        setPendW(Math.round(user.weightKg));
                        setSearchParams((p) => { p.set('hw', '1'); return p; });
                      },
                    },
                  )}
                  className="flex items-center justify-between w-full mt-2 px-3 py-3 rounded-lg border border-app-border bg-transparent"
                >
                  <span className="text-[15px] text-app-text">{user.heightCm}cm,{Math.round(user.weightKg)}kg</span>
                  <IcArrowRight size={16} className="text-app-text-muted" />
                </button>
                <div className="text-[16px] font-semibold text-app-text mt-4">体型信息</div>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'quiz.flow.bodytype.edit' },
                    { onTrigger: () => gotoStep(3) },
                  )}
                  className="flex items-center justify-between w-full mt-2 px-3 py-3 rounded-lg border border-app-border bg-transparent"
                >
                  <span className="text-[15px] text-app-text">{bodyType}</span>
                  <IcArrowRight size={16} className="text-app-text-muted" />
                </button>
              </div>
            </div>
          </>
        )}

        {cur.id === 'bodytype' && (
          <>
            <div className="text-[13px] text-app-text-muted text-center mt-10">选择和你的身材相近的体型</div>
            <div className="flex gap-2.5 mt-4">
              {cur.options.map((o) => {
                const sel = (quiz.answers.bodytype as string) === o;
                return (
                  <button
                    key={o}
                    {...bindTap(
                      { kind: 'action', id: 'quiz.flow.option.select' },
                      { params: { q: 'bodytype', value: o }, onTrigger: () => setQuizAnswer('bodytype', o) },
                    )}
                    className="flex-1 flex flex-col items-center gap-2 bg-transparent border-none p-0"
                  >
                    <span
                      className="w-full h-20 rounded-xl flex items-end justify-center overflow-hidden"
                      style={{
                        background: '#F5F6F8',
                        border: sel ? `1.5px solid ${C.green}` : '1.5px solid transparent',
                      }}
                    >
                      <span
                        className="mb-2 rounded-t-full"
                        style={{
                          width: o === '直筒型' ? 22 : o === '梨型' ? 28 : o === '沙漏型' ? 24 : 34,
                          height: 44,
                          background: sel ? '#BFE8D6' : '#E2E3E8',
                        }}
                      />
                    </span>
                    <span className="text-[13px]" style={{ color: sel ? C.greenDeep : '#4A4E57', fontWeight: sel ? 600 : 400 }}>
                      {o}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {(cur.id === 'sport' || cur.id === 'equipment') && (
          <div className="flex gap-3 mt-6">
            {cur.options.map((o) => {
              const sel = (quiz.answers[cur.id] as string) === o;
              return (
                <button
                  key={o}
                  {...bindTap(
                    { kind: 'action', id: 'quiz.flow.option.select' },
                    { params: { q: cur.id, value: o }, onTrigger: () => setQuizAnswer(cur.id, o) },
                  )}
                  className="flex-1 rounded-xl overflow-hidden bg-transparent p-0 text-left"
                  style={{ border: sel ? `1.5px solid ${C.green}` : '1.5px solid transparent' }}
                >
                  <span
                    className="block h-24 flex items-center justify-center"
                    style={{ background: sel ? '#EDFBF4' : '#F0F3F7' }}
                  >
                    {o === '操课' ? <IcActivity size={28} className="text-app-text" />
                      : o === '跳绳' ? <IcCircle size={28} className="text-app-text" />
                      : o === '跑步' ? <IcFootprints size={28} className="text-app-text" />
                      : o === '哑铃' ? <IcDumbbell size={28} className="text-app-text" />
                      : <IcDumbbell size={28} className="text-app-text-muted" />}
                  </span>
                  <span
                    className="block px-3 py-2.5 text-[15px]"
                    style={{ background: '#FAFAFB', color: sel ? C.greenDeep : '#1A1A1A', fontWeight: sel ? 600 : 400 }}
                  >
                    {o}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {(cur.id === 'duration' || cur.id === 'pushup' || cur.id === 'run' || cur.id === 'squat' || cur.id === 'stairs') && (
          <div className="flex flex-wrap gap-3 mt-6">
            {cur.options.map((o) => {
              const sel = (quiz.answers[cur.id] as string) === o;
              return (
                <button
                  key={o}
                  {...bindTap(
                    { kind: 'action', id: 'quiz.flow.option.select' },
                    { params: { q: cur.id, value: o }, onTrigger: () => setQuizAnswer(cur.id, o) },
                  )}
                  className="px-5 py-3 rounded-full border-none text-[15px]"
                  style={{
                    background: sel ? '#EDFBF4' : '#F5F6F8',
                    color: sel ? C.greenDeep : '#1A1A1A',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        )}
        <div className="h-8" />
      </div>

      {/* 底部主按钮 */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        {cur.id === 'injury' && injuries.length === 0 ? (
          <button
            {...bindTap(
              { kind: 'action', id: 'quiz.flow.injury.none' },
              {
                onTrigger: () => { setQuizAnswer('injury', '不存在伤病困扰'); gotoStep(2); },
              },
            )}
            className="w-full py-3.5 rounded-full border-none text-white text-[16px] font-medium"
            style={{ background: C.green }}
          >
            不存在伤病困扰
          </button>
        ) : cur.id === 'body' ? (
          <button
            {...bindTap(
              { kind: 'action', id: 'quiz.flow.confirm.body' },
              { onTrigger: () => gotoStep(step + 1) },
            )}
            className="w-full py-3.5 rounded-full border-none text-white text-[16px] font-medium"
            style={{ background: C.green }}
          >
            无需调整
          </button>
        ) : step < STEPS.length ? (
          <button
            {...bindTap(
              { kind: 'action', id: 'quiz.flow.step.next' },
              { onTrigger: () => { if (stepAnswered) gotoStep(step + 1); } },
            )}
            disabled={!stepAnswered}
            className="w-full py-3.5 rounded-full border-none text-white text-[16px] font-medium"
            style={{ background: stepAnswered ? C.green : '#A8E8CF' }}
          >
            {cur.id === 'bodytype' ? '下一步' : s.confirm}
          </button>
        ) : (
          <button
            {...bindTap('quiz.generating.open')}
            disabled={!stepAnswered}
            className="w-full py-3.5 rounded-full border-none text-white text-[16px] font-medium"
            style={{ background: stepAnswered ? C.green : '#A8E8CF' }}
          >
            生成计划
          </button>
        )}
      </div>

      {/* 双滚轮弹层:身高一轮 / 体重一轮(锁定Q15A) */}
      {hwSheetOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/45" {...bindBack()} />
          <div className="relative bg-app-surface rounded-t-2xl px-4 pt-4 pb-5">
            <div className="text-center font-semibold text-[16px] text-app-text">身高体重</div>
            <div className="flex justify-center gap-8 mt-3">
              <WheelPicker
                options={HEIGHT_OPTIONS}
                value={pendH}
                onChange={(v) => setPendH(Number(v))}
                unit="cm"
                widthClass="w-28"
              />
              <WheelPicker
                options={WEIGHT_OPTIONS}
                value={pendW}
                onChange={(v) => setPendW(Number(v))}
                unit="kg"
                widthClass="w-28"
              />
            </div>
            <button
              {...bindTap(
                { kind: 'action', id: 'quiz.flow.hw.edit' },
                {
                  params: { stage: 'confirm', heightCm: pendH, weightKg: pendW },
                  onTrigger: () => { setBodyInfo(pendH, pendW); back(); },
                },
              )}
              className="w-full mt-4 py-3 rounded-full border-none text-white text-[16px] font-medium"
              style={{ background: C.green }}
            >
              {s.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
