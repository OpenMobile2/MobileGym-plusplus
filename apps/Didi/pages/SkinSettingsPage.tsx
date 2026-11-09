import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

/** 皮肤设置 —— 证据 n21(三张横幅卡:默认/王安宇/足球季)。 */

const SKINS = [
  {
    id: 'default',
    name: '滴滴默认皮肤',
    bg: 'linear-gradient(135deg,#FFE8D6,#FFD9BE)',
    fg: '#8A4B0F',
    photo: false,
  },
  {
    id: 'wanganyu',
    name: '王安宇 -「宇」你上场皮肤',
    bg: 'linear-gradient(135deg,#FFEFE0,#FFE0C7)',
    fg: '#7A4A20',
    photo: true,
    art: '/@app-assets/Didi/images/skin_star.png',
  },
  {
    id: 'football',
    name: '去往足球的夏天·足球季限定皮肤',
    bg: 'linear-gradient(135deg,#8FD98A,#4CBF6E)',
    fg: '#FFFFFF',
    photo: false,
    art: '/@app-assets/Didi/images/skin_football.png',
  },
];

export default function SkinSettingsPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const skin = useDidiStore((s) => s.settings.skin);
  const setSkin = useDidiStore((s) => s.setSkin);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="皮肤设置" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3 pb-6 flex flex-col gap-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {SKINS.map((s) => {
          const inUse = skin === s.id;
          return (
            <div
              key={s.id}
              className="rounded-2xl px-4 py-5 overflow-hidden relative"
              style={{ background: s.bg, minHeight: s.photo ? 140 : 88 }}
            >
              {'art' in s && s.art && (
                <img
                  src={s.art}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  onError={(e) => { const el = e.currentTarget; if (!el.dataset.fb) { el.dataset.fb = '1'; el.style.display = 'none'; } }}
                />
              )}
              {s.photo && (
                <svg
                  className="absolute right-2 top-2"
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                >
                  <defs>
                    <linearGradient id="skinPh" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#D8D8DC" />
                      <stop offset="1" stopColor="#B9BCC4" />
                    </linearGradient>
                  </defs>
                  <rect width="120" height="120" rx="12" fill="url(#skinPh)" />
                  <circle cx="60" cy="46" r="20" fill="#9CA1AC" />
                  <path d="M22 112c6-26 24-34 38-34s32 8 38 34" fill="#9CA1AC" />
                </svg>
              )}
              <div className="flex items-end h-full relative">
                <div
                  className="flex-1 text-[16px] font-bold pr-3"
                  style={{ color: s.fg, marginTop: s.photo ? 72 : 0 }}
                >
                  {s.name}
                </div>
                {inUse ? (
                  <span className="shrink-0 rounded-full px-4 py-1.5 text-[13px] bg-white/90 text-app-text-muted">
                    使用中
                  </span>
                ) : (
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'skin.settings.use' },
                      {
                        onTrigger: () => {
                          setSkin(s.id);
                          toast('皮肤已切换(演示)');
                        },
                        params: { skin: s.id },
                      },
                    )}
                    className="shrink-0 border-none rounded-full px-4 py-1.5 text-[13px] bg-white font-medium"
                    style={{ color: C.orangeDeep }}
                  >
                    去使用
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
