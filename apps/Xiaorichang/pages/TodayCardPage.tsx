import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { cardPhotoOf } from '../assets';
import { IcBack, IcExport, IcCard } from '../res/icons';
import { todayKey } from '../utils/appTime';
import { scheduledHabits, todayProgress, totalDoneDays } from '../utils/metrics';
import { saveImageToAlbum } from '@/os/albumBridge';

const WEEK_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** 每日格言(中英双语,真机 s213/s242 卡片下半区) */
const QUOTES = [
  {
    en: '"No matter how long the rain lasts, there will be a rainbow in the end. No matter how sad you may be, believe, that happiness is waiting. "',
    zh: '不管雨下多久,最终彩虹总会出现。不管你有多难过,始终要相信,幸福就在不远处。',
  },
  {
    en: '"The secret of getting ahead is getting started. "',
    zh: '进步的秘诀,就是开始。',
  },
  {
    en: '"Small daily improvements are the key to staggering long-term results. "',
    zh: '每天微小的进步,是惊人长期成果的钥匙。',
  },
];

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  let line = '';
  let lineIndex = 0;
  for (const char of text) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineIndex * lineHeight);
      lineIndex += 1;
      if (lineIndex >= maxLines) return;
      line = char;
    } else {
      line = next;
    }
  }
  if (line && lineIndex < maxLines) ctx.fillText(line, x, y + lineIndex * lineHeight);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  await image.decode();
  return image;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

async function renderTodayCard(options: {
  photo: string;
  date: Date;
  streakDays: number;
  doneHabits: number;
  glow: number;
  quoteEn: string;
  quoteZh: string;
  note: string;
  labels: { streak: string; done: string; glow: string };
}): Promise<string> {
  const width = 720;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');
  await document.fonts?.ready;

  ctx.fillStyle = '#F5F6F7';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, 36, 36, width - 72, height - 72, 34);
  ctx.fill();

  const photo = await loadImage(options.photo);
  ctx.save();
  roundedRect(ctx, 72, 72, 280, 470, 12);
  ctx.clip();
  drawCoverImage(ctx, photo, 72, 72, 280, 470);
  ctx.restore();

  const date = options.date;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#B0B5BD';
  ctx.font = '24px sans-serif';
  ctx.fillText(`${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, '0')}`, 500, 160);
  ctx.fillStyle = '#212121';
  ctx.font = '900 116px sans-serif';
  ctx.fillText(String(date.getDate()), 500, 300);
  ctx.fillStyle = '#8C939E';
  ctx.font = '26px sans-serif';
  ctx.fillText(WEEK_ZH[date.getDay()], 500, 360);

  const stats = [
    { value: `${options.streakDays}d`, label: options.labels.streak },
    { value: String(options.doneHabits), label: options.labels.done },
    { value: String(options.glow), label: options.labels.glow },
  ];
  stats.forEach((stat, index) => {
    const x = 150 + index * 210;
    ctx.fillStyle = '#212121';
    ctx.font = '700 34px sans-serif';
    ctx.fillText(stat.value, x, 625);
    ctx.fillStyle = '#B0B5BD';
    ctx.font = '22px sans-serif';
    ctx.fillText(stat.label, x, 663);
  });

  ctx.strokeStyle = '#E3E5E8';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(72, 705);
  ctx.lineTo(648, 705);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#212121';
  ctx.font = '25px sans-serif';
  wrapText(ctx, options.quoteEn, 82, 770, 556, 38, 4);
  ctx.font = '27px sans-serif';
  wrapText(ctx, options.quoteZh, 82, 935, 556, 42, 3);

  if (options.note.trim()) {
    ctx.fillStyle = '#F7CE45';
    roundedRect(ctx, 72, 1060, 576, 94, 20);
    ctx.fill();
    ctx.fillStyle = '#5B4718';
    ctx.font = '26px sans-serif';
    wrapText(ctx, options.note.trim(), 96, 1110, 528, 34, 2);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C8CCD2';
  ctx.font = '20px sans-serif';
  ctx.fillText('小日常 APP · MobileGym', width / 2, 1210);
  return canvas.toDataURL('image/png');
}

/** 今日卡片(Gate4 订正:此前实现成了一个简陋的成绩单,真机是竖版风景照卡片,s242)。 */
export default function TodayCardPage() {
  const st = useXiaorichangStore();
  const { action, bindBack } = useXiaorichangGestures();
  const s = useStrings();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const d = TimeService.getDate();
  const dayOfYear = Math.floor((d.getTime() - TimeService.fromLocalParts(d.getFullYear(), 0, 1).getTime()) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const sched = scheduledHabits(st.habits, d, st.logs);
  const { earned } = todayProgress(st.habits, st.logs, d);
  const doneToday = sched.filter((h) => st.logs.some((l) => l.habitId === h.id && l.date === todayKey() && l.status === 'done')).length;
  // 「坚持天数」= 有任意完成记录的不同日期数
  const streakDays = new Set(st.logs.filter((l) => l.status === 'done').map((l) => l.date)).size;
  // 「完成习惯」= 累计完成次数
  const doneHabits = st.habits.reduce((a, h) => a + totalDoneDays(st.logs, h.id), 0);
  void doneToday;

  const downloadCard = () => {
    if (saving) return;
    setSaving(true);
    void (async () => {
      try {
        const dataUrl = await renderTodayCard({
          photo: cardPhotoOf(dayOfYear),
          date: d,
          streakDays,
          doneHabits,
          glow: earned || st.glow.cumulative,
          quoteEn: quote.en,
          quoteZh: quote.zh,
          note,
          labels: { streak: s.cardsStreakDays, done: s.cardsDoneHabits, glow: s.statGlow },
        });
        const saved = await saveImageToAlbum(dataUrl, {
          album: 'Saved',
          fileName: `xiaorichang_card_${todayKey()}_${TimeService.now()}.png`,
          mimeType: 'image/png',
          width: 720,
          height: 1280,
        });
        st.showToast(saved ? s.cardSavedToAlbum : s.cardSaveFailed);
      } catch {
        st.showToast(s.cardSaveFailed);
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center px-4 pb-3 pt-10">
        <button {...bindBack()}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
          <IcBack size={18} />
          <span className="text-base font-bold text-[#212121]">{s.quickTodayCard}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="overflow-hidden rounded-2xl bg-white">
          {/* 上半:竖版风景照 + 日期 */}
          <div className="flex gap-4 p-4">
            <img src={cardPhotoOf(dayOfYear)} alt=""
              className="h-56 w-36 shrink-0 rounded-sm object-cover" />
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-sm tracking-wider text-[#C9CDD3]">
                {d.getFullYear()} / {`${d.getMonth() + 1}`.padStart(2, '0')}
              </div>
              <div className="mt-1 flex h-24 w-24 items-center justify-center rounded-full bg-[#FAFAFA]">
                <span className="text-6xl font-black text-[#212121]">{d.getDate()}</span>
              </div>
              <div className="mt-2 text-sm text-[#9AA5B1]">{WEEK_ZH[d.getDay()]}</div>
              <div className="mt-2 h-px w-16 bg-[#E3E5E8]" />
            </div>
          </div>

          {/* 三数据 */}
          <div className="flex justify-around pb-4">
            {[
              { v: `${streakDays}d`, label: '坚持天数' },
              { v: `${doneHabits}`, label: '完成习惯' },
              { v: `${earned || st.glow.cumulative}`, label: s.statGlow },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <div className="text-lg font-bold text-[#212121]">{b.v}</div>
                <div className="mt-0.5 text-xs text-[#C9CDD3]">{b.label}</div>
              </div>
            ))}
          </div>

          {/* 双语格言 */}
          <div className="border-t border-dashed border-[#E3E5E8] px-5 py-5">
            <p className="text-sm leading-relaxed text-[#212121]">{quote.en}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#212121]">{quote.zh}</p>
          </div>

          {/* 竖排水印 */}
          <div className="flex justify-around border-t border-dashed border-[#E3E5E8] px-6 py-2 text-xs tracking-widest text-[#D5D8DC]">
            {'小日常APP'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
          </div>
        </div>

        <div className="mt-5 px-1">
          <div className="text-sm text-[#9AA5B1]">写在卡片上:</div>
          <input
            {...action('today.card.note.input', () => {}, { params: { value: note } })}
            value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注"
            className="mt-2 w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none" />
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button {...action('today.card.download', downloadCard)} disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#212121] shadow-sm">
            <IcExport size={16} /> {saving ? s.cardSaving : s.cardDownload}
          </button>
          {/* Gate4 翻案:卡包是真页面(s250),故本动作从 wontfix 改为真实现 */}
          <button
            {...action('today.card.save', () => {
              st.saveCard({
                date: todayKey(), streakDays, doneHabits, glow: st.glow.cumulative,
                quote: quote.zh, note: note || undefined, photo: dayOfYear,
                allScheduledDone: sched.length > 0 && doneToday === sched.length,
              });
              st.showToast(s.cardSavedToPack);
            })}
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#212121] shadow-sm">
            <IcCard size={16} /> 存进卡包
          </button>
        </div>
      </div>
    </div>
  );
}
