import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { MascotCat } from '../components/ui';
import { toast } from '../components/toast';
import { money, todayTs, monthKey } from '../components/format';
import { monthBills, sumByType } from '../components/derive';
import { IcClose } from '../res/icons';
import { useStrings } from '../hooks/useStrings';
import ContentResolver from '@/os/ContentResolver';
import * as MediaService from '@/os/MediaService';
import * as TimeService from '@/os/TimeService';
import { shareImage } from '@/os/shareBridge';
import type { KapiBill } from '../types';

function queryAlbumCount(): number {
  try {
    const viaCr = ContentResolver.query('content://media/images').items.length;
    const viaFs = MediaService.getMediaItems({ type: 'image' }).length;
    // 取较大值，避免两路尚未完全同步时读到 0
    return Math.max(viaCr, viaFs);
  } catch {
    try {
      return MediaService.getMediaItems({ type: 'image' }).length;
    } catch {
      return 0;
    }
  }
}

/** 本月无账单时，回退到账本里「最近有数据的那个月」（避免 sim 时钟与种子错位显示 0） */
function billsForShare(bills: KapiBill[], ledgerId: string, now: number): { list: KapiBill[]; monthTs: number } {
  const current = monthBills(bills, ledgerId, now);
  if (current.length > 0) return { list: current, monthTs: now };
  const inLedger = bills.filter((b) => b.ledgerId === ledgerId);
  if (inLedger.length === 0) return { list: [], monthTs: now };
  const latest = Math.max(...inLedger.map((b) => b.date));
  return { list: monthBills(bills, ledgerId, latest), monthTs: latest };
}

function monthLabel(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 生成可见海报（720×1280），避免 1×1 像素点 */
async function renderSharePoster(opts: {
  title: string;
  expenseLabel: string;
  expense: number;
  incomeLabel: string;
  income: number;
  balanceLabel: string;
  balance: number;
  countLabel: string;
  count: number;
  month: string;
}): Promise<string> {
  const w = 720;
  const h = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1A1D26');
  bg.addColorStop(1, '#2A3350');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // card
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 48, 180, w - 96, 760, 36);
  ctx.fill();

  ctx.fillStyle = '#1A1D26';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.title, w / 2, 280);

  ctx.fillStyle = '#8A8F9C';
  ctx.font = '28px sans-serif';
  ctx.fillText(`${opts.month} · ${opts.expenseLabel}`, w / 2, 360);

  ctx.fillStyle = '#3D6CF0';
  ctx.font = 'bold 96px sans-serif';
  ctx.fillText(`¥${money(opts.expense)}`, w / 2, 490);

  const cols = [
    { label: opts.incomeLabel, value: `¥${money(opts.income)}`, color: '#FF7B4A' },
    { label: opts.balanceLabel, value: `¥${money(opts.balance)}`, color: '#22B07D' },
    { label: opts.countLabel, value: String(opts.count), color: '#1A1D26' },
  ];
  cols.forEach((c, i) => {
    const x = 140 + i * 200;
    ctx.fillStyle = '#8A8F9C';
    ctx.font = '24px sans-serif';
    ctx.fillText(c.label, x, 620);
    ctx.fillStyle = c.color;
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(c.value, x, 670);
  });

  ctx.fillStyle = '#8A8F9C';
  ctx.font = '22px sans-serif';
  ctx.fillText('Kapi · MobileGym', w / 2, 860);

  return canvas.toDataURL('image/png');
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function SharePage() {
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const currentLedgerId = useKapiStore((st) => st.currentLedgerId);
  const now = todayTs();
  const { list: mBills, monthTs } = useMemo(
    () => billsForShare(bills, currentLedgerId, now),
    [bills, currentLedgerId, now],
  );
  const expense = sumByType(mBills, 'expense');
  const income = sumByType(mBills, 'income');
  const [albumCount, setAlbumCount] = useState(queryAlbumCount);

  const refreshAlbum = useCallback(() => setAlbumCount(queryAlbumCount()), []);

  useEffect(() => {
    refreshAlbum();
    const unsub = ContentResolver.registerContentObserver('content://media', () => {
      refreshAlbum();
    });
    return unsub;
  }, [refreshAlbum]);

  const month = monthLabel(monthTs);
  const usingFallback = monthKey(monthTs) !== monthKey(now);
  const shareText = `${s.shareCardTitle}（${month}）\n${s.monthExpenseLabel} ¥${money(expense)} · ${s.income} ¥${money(income)} · ${mBills.length}${s.billsCountLabel}`;

  const savePosterToAlbum = async () => {
    const dataUrl = await renderSharePoster({
      title: s.shareCardTitle,
      expenseLabel: s.monthExpenseLabel,
      expense,
      incomeLabel: s.income,
      income,
      balanceLabel: s.balance,
      balance: income - expense,
      countLabel: s.billsCountLabel,
      count: mBills.length,
      month,
    });
    const fileName = `kapi_share_${month.replace('-', '')}_${TimeService.now()}.png`;
    const saved = await MediaService.saveToGallery(dataUrl, {
      album: 'Saved',
      fileName,
      mimeType: 'image/png',
    });
    const uri = saved?.uri || dataUrl;
    const path = saved?.path || `/sdcard/Pictures/Saved/${fileName}`;
    ContentResolver.insert('content://media/images', {
      fileName,
      mimeType: 'image/png',
      uri,
      path,
      width: 720,
      height: 1280,
    });
    refreshAlbum();
    return { uri, path, fileName };
  };

  const handleSavePoster = async () => {
    try {
      await savePosterToAlbum();
      toast(s.savedToAlbumToast);
    } catch {
      toast(s.shareFailedToast);
    }
  };

  const shareToWechat = async () => {
    try {
      const saved = await savePosterToAlbum();
      toast(s.savedToAlbumToast);
      const launched = shareImage(saved.path || saved.uri, {
        targetAppId: 'wechat',
        text: shareText,
        onResult: (r) => {
          if (r.resultCode === 'OK') toast(s.shareSuccessToast);
        },
      });
      if (!launched) toast(s.shareFailedToast);
    } catch {
      toast(s.shareFailedToast);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1D26]">
      <div className="flex items-center justify-end px-3 h-11 shrink-0">
        <button {...bindTap('share.close')} className="bg-transparent border-none cursor-pointer"><IcClose size={22} className="text-white" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="bg-app-surface rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MascotCat size={36} />
            <span className="text-[16px] font-bold text-app-text">{s.shareCardTitle}</span>
          </div>
          <div className="text-center py-4">
            <div className="text-[13px] text-app-text-muted">
              {month} · {s.monthExpenseLabel}
              {usingFallback ? s.shareFallbackMonthHint : ''}
            </div>
            <div className="text-[34px] font-bold text-[#3D6CF0]">¥{money(expense)}</div>
          </div>
          <div className="flex justify-around py-3 border-t border-app-border">
            <div className="text-center"><div className="text-[12px] text-app-text-muted">{s.income}</div><div className="text-[16px] font-bold text-[#FF7B4A]">¥{money(income)}</div></div>
            <div className="text-center"><div className="text-[12px] text-app-text-muted">{s.balance}</div><div className="text-[16px] font-bold text-[#22B07D]">¥{money(income - expense)}</div></div>
            <div className="text-center"><div className="text-[12px] text-app-text-muted">{s.billsCountLabel}</div><div className="text-[16px] font-bold text-app-text">{mBills.length}</div></div>
          </div>
          <div className="text-center text-[11px] text-app-text-muted mt-4">{s.shareFooterHint}</div>
          <div className="text-center text-[11px] text-app-text-muted mt-2">
            {s.albumViaResolverPrefix}{albumCount}{s.albumViaResolverSuffix}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6 flex-wrap">
          <button {...bindAction('share.date.select.period', () => toast(s.switchRangeToast), { value: 'month' })} className="px-5 py-2 rounded-full bg-app-surface/15 text-white text-[14px] border-none cursor-pointer">{s.switchDateBtn}</button>
          <button {...bindAction('share.save.noop', () => { void handleSavePoster(); })} className="px-5 py-2 rounded-full bg-[#4B6EF5] text-white text-[14px] border-none cursor-pointer">{s.saveImageBtn}</button>
          <button
            {...bindAction('share.wechat.send', () => { void shareToWechat(); })}
            className="px-5 py-2 rounded-full bg-[#07C160] text-white text-[14px] border-none cursor-pointer"
          >
            {s.shareToWechatBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
