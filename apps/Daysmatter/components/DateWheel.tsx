import { useEffect, useRef } from 'react';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { useI18n } from '../i18n';

interface Props {
  y: number;
  m: number;
  d: number;
  /** data-action id(须已在声明中,如 add.date.set) */
  actionId: string;
  onSet: (y: number, m: number, d: number) => void;
}

const ITEM_H = 36;
const VISIBLE = 5;
const CONTAINER_H = ITEM_H * VISIBLE;
const PAD = (CONTAINER_H - ITEM_H) / 2;

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i += 1) out.push(i);
  return out;
}

function daysInMonth(y: number, m: number): number {
  return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

function Col({ items, sel, suffix, actionId, pick }: { items: number[]; sel: number; suffix: string; actionId: string; pick: (v: number) => void }) {
  const { action } = useDaysmatterGestures();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const lockUntil = useRef(0);
  const scrollTimer = useRef<number | null>(null);
  const idx = items.indexOf(sel);

  useEffect(() => {
    const el = ref.current;
    if (!el || idx < 0) return;
    const smooth = !first.current;
    lockUntil.current = Date.now() + (smooth ? 380 : 80);
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
    first.current = false;
  }, [idx]);

  const onScroll = () => {
    if (Date.now() < lockUntil.current) return;
    if (scrollTimer.current) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      if (items[i] !== sel) {
        pick(items[i]);
      } else if (el.scrollTop !== i * ITEM_H) {
        lockUntil.current = Date.now() + 380;
        el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
      }
    }, 140);
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="relative flex-1 overflow-y-auto no-scrollbar"
      style={{ height: CONTAINER_H, scrollSnapType: 'y mandatory' }}
    >
      <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {items.map((v) => (
          <button
            key={v}
            {...action<HTMLButtonElement>(actionId, () => pick(v), { params: { value: v } })}
            className={`flex w-full items-center justify-center transition-colors ${v === sel ? 'text-[20px] font-bold text-[#3E7CB1]' : 'text-[16px] text-[#B0B0B0]'}`}
            style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
          >
            {v}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 三列滚轮(年/月/日):滑动停止后中心项即选中,也可直接点选。 */
export default function DateWheel({ y, m, d, actionId, onSet }: Props) {
  const { t } = useI18n();
  const years = range(y - 60, y + 60);
  const months = range(1, 12);
  const days = range(1, daysInMonth(y, m));

  return (
    <div className="relative px-4">
      <div
        className="pointer-events-none absolute inset-x-4 z-10 border-y border-[#E4E2DC] bg-[#F4F8FB]/40"
        style={{ top: PAD, height: ITEM_H }}
      />
      <div className="relative flex items-stretch">
        <Col items={years} sel={y} suffix={t('dateWheel.year')} actionId={actionId} pick={(v) => onSet(v, m, Math.min(d, daysInMonth(v, m)))} />
        <Col items={months} sel={m} suffix={t('dateWheel.month')} actionId={actionId} pick={(v) => onSet(y, v, Math.min(d, daysInMonth(y, v)))} />
        <Col items={days} sel={d} suffix={t('dateWheel.day')} actionId={actionId} pick={(v) => onSet(y, m, v)} />
      </div>
    </div>
  );
}
