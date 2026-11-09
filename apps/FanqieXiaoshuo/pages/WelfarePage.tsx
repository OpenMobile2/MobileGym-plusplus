import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useToast, useNotOpenToast } from '../components/ui';
import { IcArrowRight, IcClose, IcCoin } from '../res/icons';

/** 红包条金币数(视觉基准 89_4) */
const PACKETS = ['80', '80', '48', '64', '64'] as const;

/** 签到条 7 格(今天3828 / 2~6天??? / 第7天2.5万礼盒) */
const SIGNIN_CELLS = [
  { day: '今天', val: '3828', kind: 'today' },
  { day: '第2天', val: '???', kind: 'gray' },
  { day: '第3天', val: '???', kind: 'gray' },
  { day: '第4天', val: '???', kind: 'gray' },
  { day: '第5天', val: '???', kind: 'gray' },
  { day: '第6天', val: '???', kind: 'gray' },
  { day: '第7天', val: '2.5万', kind: 'gift' },
] as const;

export default function WelfarePage() {
  const { bindTap, bindBack, back } = useFanqieGestures();
  const str = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [toastNode, showToast] = useToast();
  const [searchParams] = useSearchParams();

  const coins = useFanqieStore((s) => s.coins);
  const welfareTasks = useFanqieStore((s) => s.welfareTasks);
  const signinDone = useFanqieStore((s) => s.signinDone);
  const doSignin = useFanqieStore((s) => s.doSignin);
  const todayReadMinutes = useFanqieStore((s) => s.todayReadMinutes);
  const recordTaskAudit = useFanqieStore((s) => s.recordTaskAudit);

  React.useEffect(() => {
    recordTaskAudit({ welfareView: { coins, todayReadMinutes } });
  }, [coins, recordTaskAudit, todayReadMinutes]);

  const signinOpen = searchParams.get('dialog') === 'signin';

  return (
    <div className="relative h-full bg-(--app-c-bg-paper-page)">
      <div
        className="h-full overflow-y-auto"
        data-scroll-container="welfare-list"
        data-scroll-direction="vertical"
      >
        {/* ===== 橙红渐变头 ===== */}
        <div className="bg-gradient-to-b from-[#FF5A3C] to-[#FF8F5E] px-3 pt-3 pb-10">
          {/* 顶部 tab */}
          <div className="flex items-center gap-4 px-1">
            <span className="text-[17px] font-bold text-white">{str.welfareCenter}</span>
            <button
              {...bindTap({ kind: 'action', id: 'welfare.tab.disabled' }, { onTrigger: showNotOpen })}
              className="text-[14px] text-white/75 bg-transparent border-none cursor-pointer p-0"
            >
              福利商城
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'welfare.tab.disabled' }, { onTrigger: showNotOpen })}
              className="text-[14px] text-white/75 bg-transparent border-none cursor-pointer p-0"
            >
              番茄柿集
            </button>
          </div>

          {/* 收益卡 */}
          <div className="bg-(--app-c-bg-card) rounded-xl mt-3 px-4 py-3">
            <div className="flex">
              <button
                {...bindTap({ kind: 'action', id: 'welfare.task.disabled' }, { onTrigger: showNotOpen })}
                className="flex-1 text-left bg-transparent border-none cursor-pointer p-0"
              >
                <div className="text-[12px] text-(--app-c-text-secondary)">金币收益</div>
                <div className="flex items-center mt-1">
                  <span className="text-[24px] font-bold text-(--app-c-text-primary) leading-none">{coins}</span>
                  <IcArrowRight size={16} className="text-(--app-c-text-disabled) ml-0.5" />
                </div>
              </button>
              <div className="w-px bg-(--app-c-divider) mx-2" />
              <button
                {...bindTap({ kind: 'action', id: 'welfare.task.disabled' }, { onTrigger: showNotOpen })}
                className="flex-1 text-left bg-transparent border-none cursor-pointer p-0"
              >
                <div className="text-[12px] text-(--app-c-text-secondary)">现金收益</div>
                <div className="flex items-center mt-1">
                  <span className="text-[24px] font-bold text-(--app-c-text-primary) leading-none">0.00</span>
                  <span className="text-[12px] text-(--app-c-text-secondary) ml-0.5">元</span>
                  <IcArrowRight size={16} className="text-(--app-c-text-disabled) ml-0.5" />
                </div>
              </button>
            </div>
            <div className="text-[11px] text-(--app-c-text-quaternary) mt-2">金币每天凌晨自动兑换成现金</div>
          </div>
        </div>

        {/* ===== 看听读横条 + 红包条 ===== */}
        <div className="bg-(--app-c-bg-card) rounded-xl mx-3 -mt-7 px-4 py-3">
          <div className="text-[15px] font-bold text-(--app-c-text-primary)">
            看听读最高赚<span className="text-(--app-c-brand)">1214</span>金币
          </div>
          <div className="flex gap-2 mt-3">
            {PACKETS.map((p, i) => (
              <div
                key={i}
                className="flex-1 rounded-lg bg-gradient-to-b from-[#FF6A45] to-[#F04A28] flex flex-col items-center justify-center py-2"
              >
                <div className="w-5 h-3.5 rounded-sm bg-[#FFD9A0] mb-1" />
                <span className="text-[12px] font-semibold text-white">{p}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              {...bindTap('welfare.home-open')}
              className="flex-1 h-8 rounded-full bg-gradient-to-r from-[#FA6E3D] to-[#FF8F5E] text-white text-[13px] font-medium border-none cursor-pointer"
            >
              {str.goRead}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'welfare.task.disabled' }, { onTrigger: showNotOpen })}
              className="flex-1 h-8 rounded-full bg-(--app-c-brand-soft) text-(--app-c-brand) text-[13px] font-medium border-none cursor-pointer"
            >
              去听书
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'welfare.task.disabled' }, { onTrigger: showNotOpen })}
              className="flex-1 h-8 rounded-full bg-(--app-c-brand-soft) text-(--app-c-brand) text-[13px] font-medium border-none cursor-pointer"
            >
              看短剧
            </button>
          </div>
        </div>

        {/* ===== 日常福利 ===== */}
        <div className="bg-(--app-c-bg-card) rounded-xl mx-3 mt-3 mb-4 px-4 py-3">
          <div className="text-[15px] font-bold text-(--app-c-text-primary) mb-1">日常福利</div>
          {welfareTasks.map((t) => (
            <div key={t.id} className="flex items-center py-3 border-b border-(--app-c-divider) last:border-b-0">
              <div className="flex-1 min-w-0 pr-3">
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-medium text-(--app-c-text-primary)">{t.title}</span>
                  <IcCoin size={13} className="text-(--app-c-brand)" />
                  <span className="text-[13px] font-semibold text-(--app-c-brand)">{t.coins}</span>
                </div>
                <div className="text-[11px] text-(--app-c-text-tertiary) mt-0.5 truncate">{t.sub}</div>
              </div>
              {t.done ? (
                <span className="shrink-0 h-7 px-3.5 rounded-full bg-(--app-c-bg-fill-weak) text-(--app-c-text-disabled) text-[12px] inline-flex items-center">
                  {str.signedIn}
                </span>
              ) : t.isSignin ? (
                <button
                  {...bindTap('welfare.signin-open')}
                  className="shrink-0 h-7 px-3.5 rounded-full bg-gradient-to-r from-[#FA6E3D] to-[#FF8F5E] text-white text-[12px] border-none cursor-pointer"
                >
                  {t.btn}
                </button>
              ) : (
                <button
                  {...bindTap({ kind: 'action', id: 'welfare.task.disabled' }, { onTrigger: showNotOpen })}
                  className="shrink-0 h-7 px-3.5 rounded-full bg-gradient-to-r from-[#FA6E3D] to-[#FF8F5E] text-white text-[12px] border-none cursor-pointer"
                >
                  {t.btn}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== 签到弹窗(searchParams dialog=signin) ===== */}
      {signinOpen && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => back()} />
          <div className="relative z-10 w-80 rounded-2xl bg-gradient-to-b from-[#F55036] to-[#E8402A] px-4 pt-5 pb-4">
            <div className="text-center text-[18px] font-bold text-white">
              {signinDone ? '明日签到领???金币' : '今日签到领3828金币'}
            </div>
            <div className="text-center text-[12px] text-white/80 mt-1">连续签到7天获大额金币</div>
            <div className="grid grid-cols-7 gap-1 mt-4">
              {SIGNIN_CELLS.map((c) => (
                <div key={c.day} className="flex flex-col items-center">
                  <div
                    className={`w-full h-11 rounded-md flex flex-col items-center justify-center ${
                      c.kind === 'today'
                        ? 'bg-[#FFE3B0]'
                        : c.kind === 'gift'
                          ? 'bg-[#FFF4E0]'
                          : 'bg-(--app-c-bg-card)/25'
                    }`}
                  >
                    {c.kind === 'gift' && <span className="text-[12px] leading-none">🎁</span>}
                    <span
                      className={`text-[11px] font-semibold ${
                        c.kind === 'today' ? 'text-[#E8402A]' : c.kind === 'gift' ? 'text-[#B7770D]' : 'text-white/80'
                      }`}
                    >
                      {c.kind === 'today' && signinDone ? '已领' : c.val}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/75 mt-1">{c.day}</span>
                </div>
              ))}
            </div>
            {signinDone ? (
              <button
                disabled
                className="w-full h-11 mt-4 rounded-full bg-(--app-c-bg-card)/30 text-white/70 text-[15px] font-semibold border-none"
              >
                今日已签到
              </button>
            ) : (
              <button
                {...bindTap(
                  { kind: 'action', id: 'welfare.signin.do' },
                  {
                    onTrigger: () => {
                      doSignin();
                      back();
                      showToast('+3828金币');
                    },
                  },
                )}
                className="w-full h-11 mt-4 rounded-full bg-gradient-to-b from-[#FFE3B0] to-[#FFC94D] text-[#8A4A00] text-[15px] font-bold border-none cursor-pointer"
              >
                {str.signinNow} +3828 金币
              </button>
            )}
          </div>
          <button
            {...bindBack()}
            className="relative z-10 mt-5 w-8 h-8 rounded-full border border-white/70 bg-transparent flex items-center justify-center cursor-pointer"
            aria-label="close"
          >
            <IcClose size={18} className="text-white" />
          </button>
        </div>
      )}

      {notOpenNode}
      {toastNode}
    </div>
  );
}
