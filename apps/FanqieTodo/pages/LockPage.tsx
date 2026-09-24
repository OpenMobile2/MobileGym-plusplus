import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { LOCK_QUICK_MINUTES } from '../constants';
import { IcClock } from '../res/icons';

export default function LockPage() {
  const { search } = useLocation();
  const sheet = new URLSearchParams(search).get('sheet');
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const toast = () => showToast(t('toast.unavailable'));

  return (
    <div className="relative flex h-full flex-col bg-[#F4F6F8]" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 pb-2 pt-10">
        <span className="text-lg font-bold text-[#222]">{t('lock.title')}</span>
        <div className="flex items-center gap-3 text-[#8A8F99]">
          <button {...action('lock.studyroom.wontfixToast', () => showToast(t('toast.studyroom')))} aria-label="自习室">
            <span className="inline-flex items-end gap-[2px]">
              <i className="inline-block h-2 w-[3px] rounded-sm bg-[#8A8F99]" />
              <i className="inline-block h-3.5 w-[3px] rounded-sm bg-[#8A8F99]" />
              <i className="inline-block h-2.5 w-[3px] rounded-sm bg-[#8A8F99]" />
            </span>
          </button>
          <button {...bindTap('lock.checkin.open')} aria-label="打卡"><IcClock size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 小憩 */}
        <button {...bindTap('lock.breath.open')} className="mb-3 block w-full rounded-2xl bg-[#26B99A] p-4 text-left text-white">
          <div className="text-lg font-semibold">🍃 {t('lock.rest')}</div>
          <div className="mt-1 text-xs text-white/90">{t('lock.restDesc')}</div>
        </button>

        {/* 快速锁机常用时长 */}
        <div className="mb-3 rounded-2xl bg-[#F1685E] p-4 text-white">
          <div className="mb-3 text-sm font-semibold">点击可快速开始,长按可编辑此常用时长</div>
          <div className="grid grid-cols-4 gap-y-3 text-[15px]">
            {LOCK_QUICK_MINUTES.map((m) => (
              <button key={m} {...bindTap('lock.quick.open', { params: { minutes: m } })}>{m}分钟</button>
            ))}
            <button {...action('lock.quick.custom.wontfixToast', toast)}>自定义</button>
            <button {...action('lock.quick.cancel.action', () => showToast('已取消'))}>取消</button>
            <button {...action('lock.whitelist.wontfixToast', toast)}>APP</button>
          </div>
        </div>

        {/* 添加自定义锁机时间段 */}
        <button {...action('lock.schedule.wontfixToast', toast)} className="mb-3 block w-full rounded-2xl bg-[#3E8BF5] p-4 text-left text-white">
          <div className="text-base font-semibold">＋ 添加自定义锁机时间段</div>
          <div className="mt-1 text-xs text-white/90">在指定时间范围内锁住手机,不做熬夜手机党</div>
        </button>

        <div className="flex justify-end">
          <button {...action('lock.force.wontfixToast', toast)} className="rounded-full bg-[#F1685E] px-4 py-2 text-sm text-white">⚙ 提升强制性选项 | 锁机设置</button>
        </div>

        <div className="mt-16 text-center text-sm text-[#8A8F99]">{t('lock.emptySchedule')}</div>
        <div className="mt-1 text-center text-sm font-semibold text-[#F1685E]">锁机是比学霸模式更严格的自控功能</div>
      </div>

      {sheet === 'quick' && <QuickLockDialog minutes={new URLSearchParams(search).get('minutes') ?? '2'} />}
    </div>
  );
}

function QuickLockDialog({ minutes }: { minutes: string }) {
  const { bindTap, bindBack, action, back } = useFanqieTodoGestures();
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-[300px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#5CA4E0] to-[#7FB8E8] px-4 py-2.5 text-white">
          <span className="font-semibold">快速锁机</span>
          <button {...bindBack()} aria-label="关闭">✕</button>
        </div>
        <div className="p-5 text-center">
          <div className="mb-4 text-left text-lg font-semibold text-[#4A90D9]">{minutes} 分钟</div>
          <button {...bindTap('lock.active.start', { params: { minutes } })}
            className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[#F1685E] text-xl font-bold text-white">
            {t('lock.startNow')}
          </button>
          <button {...action('lock.quick.force.wontfixToast', () => showToast(t('toast.unavailable')))}
            className="mx-auto mt-4 block rounded-full bg-[#FDE7E4] px-4 py-1.5 text-sm text-[#F1685E]">*提升锁机强制性选项</button>
          <button {...action('lock.quick.delay.action', () => back())}
            className="mt-3 text-sm text-[#8A8F99]">短暂推迟</button>
        </div>
      </div>
    </div>
  );
}
