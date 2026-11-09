import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { colors } from '../res/colors';
import { avatarOf } from '../assets';
import { IconRenderer, IcHeadphones, IcSettings, IcRight } from '../res/icons';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';

/** 我的(s179/s227)。宫格显隐与顺序由 settings.modules 驱动(module.manage 同一字段)。 */
export default function ProfilePage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const notice = () => st.showNotice(s.notAvailable);
  const purchasePremium = () => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'ACTION_PAY',
        scheme: 'alipays',
        data: {
          amount: 18,
          orderId: `xiaorichang-vip-${TimeService.now()}`,
          merchantName: s.paymentMerchant,
          subject: s.paymentPremiumSubject,
          source: 'xiaorichang',
        },
      },
      (result) => {
        if (result.resultCode !== 'OK') return;
        st.updateUser({ vip: true });
        st.showToast(s.paymentSuccess);
      },
    );
    if (!launched) st.showNotice(s.notAvailable);
  };

  const GRID: Record<string, { label: string; icon: string; bind: Record<string, any> }> = {
    stats: { label: s.statsTitle, icon: 'IcBars', bind: bindTap('profile.grid.stats') },
    habits: { label: s.tabHabits, icon: 'IcGrid', bind: bindTap('profile.grid.habits') },
    todos: { label: s.quickTodo, icon: 'IcList', bind: bindTap('profile.grid.todos') },
    notes: { label: s.notesTitle, icon: 'IcPenLine', bind: bindTap('profile.grid.notes') },
    focus: { label: s.profileFocusSpace, icon: 'IcTomato', bind: bindTap('profile.grid.focus') },
    aiplanner: { label: s.profileAiPlanner, icon: 'IcSparkles', bind: bindTap('profile.grid.aiplanner') },
    timeline: { label: s.timelineTitle, icon: 'IcTimeline', bind: bindTap('profile.grid.timeline') },
    contexts: { label: s.profileContexts, icon: 'IcClock', bind: bindTap('profile.grid.contexts') },
    archived: { label: s.archivedTitle, icon: 'IcArchive', bind: bindTap('profile.grid.archived') },
    personalize: { label: s.personalize, icon: 'IcLeaf', bind: bindTap('profile.grid.personalize') },
    widget: { label: s.profileWidget, icon: 'IcPlusSquare', bind: bindTap('profile.grid.widget') },
    export: { label: s.dataExport, icon: 'IcExport', bind: bindTap('profile.grid.export') },
    lab: { label: s.lab, icon: 'IcDot', bind: bindTap('profile.grid.lab') },
    modules: { label: s.profileModules, icon: 'IcCard', bind: bindTap('profile.grid.modules') },
  };
  const gridItems = [...st.settings.modules].sort((a, b) => a.order - b.order)
    .filter((m) => m.enabled && GRID[m.id]);

  return (
    <div className="flex h-full flex-col" style={{ background: colors.brandWash }} data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-10">
        <button {...bindTap('profile.support.open')} aria-label="帮助与支持"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcHeadphones size={17} /></button>
        <div className="text-[15px] font-semibold text-[#424242]">{s.profileTitle}</div>
        <button {...bindTap('profile.settings.open')} aria-label="设置"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcSettings size={17} /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 资料卡(Gate4 订正 s247:卡内含四数据条 + 会员徽章 + 数据管理/使用指南并排) */}
        <div className="rounded-3xl bg-[#F5F5F5] p-3">
          <div className="flex items-center gap-3 px-1 pb-3">
            <button {...bindTap('profile.account.open')} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              {st.user.avatar.startsWith('/') ? (
                <AsyncFsImage path={st.user.avatar} fallbackSrc={avatarOf('user')}
                  alt="头像" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <img src={avatarOf(st.user.avatar)} alt="头像" className="h-14 w-14 rounded-full object-cover" />
              )}
              <span className="truncate text-lg font-bold text-[#212121]">{text(st.user.nickname)}</span>
            </button>
            <button {...action('profile.vip.pay', purchasePremium)}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: colors.brand, color: '#5B4718' }}>
              {s.profileVip}
            </button>
          </div>

          <div className="flex justify-around rounded-2xl bg-white py-3">
            {[
              { v: st.habits.filter((h) => !h.archived).length, label: s.profileHabitCount },
              { v: st.notes.length, label: s.profileNoteCount },
              { v: st.todos.filter((t) => t.done).length, label: s.profileTodoCount },
              { v: st.glow.cumulative, label: s.statGlow },
            ].map((b, i) => (
              <button key={b.label}
                {...(i === 3 ? bindTap('profile.glow.open') : {})}
                aria-label={i === 3 ? '进入光芒与心愿' : undefined}
                className={`flex-1 text-center ${i ? 'border-l border-[#F0F0F0]' : ''}`}>
                <div className="text-lg font-bold text-[#212121]">{b.v}</div>
                <div className="mt-0.5 text-xs text-[#9AA5B1]">{b.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <button {...bindTap('profile.data.open')}
              className="flex flex-1 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#212121]">
              {s.dataManage}<span className="flex items-center gap-1 text-xs font-normal text-[#C9CDD3]">{s.profileLastSync} <IcRight size={13} /></span>
            </button>
            <button {...action('profile.guide.wontfixToast', notice)}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#212121]">
              📖 {s.profileGuide}
            </button>
          </div>
        </div>

        {/* 宫格 */}
        <div className="mt-3 grid grid-cols-3 gap-y-5 rounded-3xl bg-white p-4 shadow-sm">
          {gridItems.map((m) => (
            <button key={m.id} {...GRID[m.id].bind} className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F5] text-[#212121]">
                <IconRenderer name={GRID[m.id].icon} size={22} />
              </span>
              <span className="text-xs text-[#424242]">{GRID[m.id].label}</span>
            </button>
          ))}
        </div>

        <button {...action('profile.promo.wontfixToast', notice)}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-left text-sm text-[#9AA5B1] shadow-sm">
          📔 {s.profilePromo}
        </button>
        <button {...action('profile.version.wontfixToast', notice)}
          className="mt-3 w-full text-center text-xs text-[#C9CDD3]">
          v10.4.10 {s.profileCheckUpdate}
        </button>
        {/* 悬浮 TabBar 会盖住内容最后一行,留出净空 */}
        <div className="h-6" />
      </div>
    </div>
  );
}
