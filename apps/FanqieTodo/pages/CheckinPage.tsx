import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { checkinBgUrl } from '../assets';
import { APP_TODAY_MS, formatCnDate } from '../utils/appTime';
import { IcClose } from '../res/icons';

type CardType = 'sleep' | 'earlyrise' | 'focus';
const TITLE: Record<CardType, string> = { sleep: '睡眠打卡', earlyrise: '起床打卡', focus: '打卡 | 保存' };
const QUOTE: Record<CardType, string> = {
  sleep: '更好的事情正在来临。', earlyrise: '早安,新的一天。', focus: '习惯养成 学霸必备-番茄ToDo',
};

export default function CheckinPage() {
  const { search } = useLocation();
  const type = (new URLSearchParams(search).get('type') as CardType) || 'focus';
  const { bindBack, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const s = useFanqieTodoStore();
  const stats = useFanqieTodoStore((x) => x.stats);
  const savedToast = () => s.showToast(t('toast.saved'));
  const bg = checkinBgUrl(type === 'earlyrise' ? 'earlyrise' : type === 'focus' ? 'focus' : 'sleep');

  return (
    <div className="flex h-full flex-col bg-[#2A3550]" data-status-bar-foreground="light">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 pb-2 pt-10 text-white">
        <span className="font-semibold">{TITLE[type]}</span>
        <div className="flex items-center gap-4">
          <button {...action('checkin.share.download.wontfixToast', savedToast)} aria-label="下载">⬇</button>
          <button {...action('checkin.share.refresh.wontfixToast', () => s.showToast('更换背景功能暂未开放'))} aria-label="刷新">⟳</button>
          <button {...action('checkin.share.share.wontfixToast', () => s.showToast('分享功能暂未开放'))} aria-label="分享">↗</button>
          <button {...bindBack()} aria-label="关闭"><IcClose size={20} /></button>
        </div>
      </div>

      {/* 分享卡 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="overflow-hidden rounded-2xl" style={{ background: bg ? `center/cover url(${bg})` : '#3A4A72' }}>
          <div className="flex min-h-[460px] flex-col justify-between bg-black/20 p-5 text-white">
            <div>
              <div className="text-3xl font-bold">{type === 'focus' ? formatCnDate(APP_TODAY_MS) : '19:02'}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded bg-white/20 px-2 py-1">连续专注{stats.streakDays}天</span>
                <span className="rounded bg-white/20 px-2 py-1">共专注{stats.totalDays}天</span>
              </div>
            </div>
            <div className="text-center text-lg">{QUOTE[type]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
