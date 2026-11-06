import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { checkinBgUrl } from '../assets';
import { formatCnDate, getAppTodayMs } from '../utils/appTime';
import { IcClose, IcDownload, IcRefresh, IcShare } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import { saveImageToAlbum } from '@/os/albumBridge';

type CardType = 'sleep' | 'earlyrise' | 'focus';
const TITLE: Record<CardType, string> = { sleep: '睡眠打卡', earlyrise: '起床打卡', focus: '打卡 | 保存' };
const QUOTE: Record<CardType, string> = {
  sleep: '更好的事情正在来临。', earlyrise: '早安,新的一天。', focus: '习惯养成 学霸必备-番茄ToDo',
};

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function renderCardPng(input: {
  backgroundUrl: string;
  heading: string;
  streakDays: number;
  totalDays: number;
  quote: string;
}): Promise<Blob | null> {
  const background = await blobToDataUrl(await (await fetch(input.backgroundUrl)).blob());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="986" viewBox="0 0 720 986">
    <image href="${background}" width="720" height="986" preserveAspectRatio="xMidYMid slice"/>
    <rect width="720" height="986" fill="#000" opacity="0.2"/>
    <text x="44" y="96" fill="#fff" font-family="sans-serif" font-size="58" font-weight="700">${escapeXml(input.heading)}</text>
    <rect x="44" y="126" width="220" height="56" rx="10" fill="#fff" opacity="0.2"/>
    <text x="62" y="163" fill="#fff" font-family="sans-serif" font-size="25">连续专注${input.streakDays}天</text>
    <rect x="282" y="126" width="210" height="56" rx="10" fill="#fff" opacity="0.2"/>
    <text x="300" y="163" fill="#fff" font-family="sans-serif" font-size="25">共专注${input.totalDays}天</text>
    <text x="360" y="910" fill="#fff" font-family="sans-serif" font-size="34" text-anchor="middle">${escapeXml(input.quote)}</text>
  </svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('分享卡渲染失败'));
      image.src = svgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 986;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export default function CheckinPage() {
  const { search } = useLocation();
  const type = (new URLSearchParams(search).get('type') as CardType) || 'focus';
  const { bindBack, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const s = useFanqieTodoStore();
  const stats = useFanqieTodoStore((x) => x.stats);
  const bg = checkinBgUrl(type === 'earlyrise' ? 'earlyrise' : type === 'focus' ? 'focus' : 'sleep');
  const saveCard = async () => {
    if (!bg) {
      s.showToast('保存图片失败');
      return;
    }
    try {
      const card = await renderCardPng({
        backgroundUrl: bg,
        heading: type === 'focus' ? formatCnDate(getAppTodayMs()) : '19:02',
        streakDays: stats.streakDays,
        totalDays: stats.totalDays,
        quote: QUOTE[type],
      });
      const saved = card && await saveImageToAlbum(card, {
        album: 'Saved',
        fileName: `fanqietodo-checkin-${type}.png`,
        mimeType: 'image/png',
      });
      s.showToast(saved ? t('toast.saved') : '保存图片失败');
    } catch {
      s.showToast('保存图片失败');
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#2A3550]" data-status-bar-foreground="light">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 pb-2 pt-10 text-white">
        <span className="font-semibold">{TITLE[type]}</span>
        <div className="flex items-center gap-4">
          <button {...action('checkin.share.download.wontfixToast', () => { void saveCard(); })} aria-label="下载" className="text-white"><IcDownload size={20} /></button>
          <button {...action('checkin.share.refresh.wontfixToast', () => s.showToast('更换背景功能暂未开放'))} aria-label="刷新" className="text-white"><IcRefresh size={20} /></button>
          <button {...action('checkin.share.share.wontfixToast', () => {
            const launched = sharePlainText('【番茄Todo】打卡分享', { onResult: (r) => { if (r.resultCode === 'OK') s.showToast('分享成功'); } });
            if (!launched) s.showToast('分享功能暂未开放');
          })} aria-label="分享" className="text-white"><IcShare size={20} /></button>
          <button {...bindBack()} aria-label="关闭"><IcClose size={20} /></button>
        </div>
      </div>

      {/* 分享卡 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="overflow-hidden rounded-2xl" style={{ background: bg ? `center/cover url(${bg})` : '#3A4A72' }}>
          <div className="flex min-h-[460px] flex-col justify-between bg-black/20 p-5 text-white">
            <div>
              <div className="text-3xl font-bold">{type === 'focus' ? formatCnDate(getAppTodayMs()) : '19:02'}</div>
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
