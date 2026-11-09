import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { IcChevronRight } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

const PLATFORMS = [
  { name: '小红书', color: '#FE2C55', status: '已授权' },
  { name: '快手', color: '#FF6E00', status: '已授权' },
  { name: '淘宝', color: '#FF5000', status: '已授权, 已导入14件' },
  { name: '圆通速递小程序', color: '#7B2D8B', status: '已授权' },
  { name: '申通快递', color: '#3B3B3B', status: '已授权' },
  { name: '极兔速递小程序', color: '#D0021B', status: '已授权' },
  { name: '韵达快递小程序', color: '#F5C518', status: '已授权' },
];

/** 包裹导入设置(spec home.importSettings,a178):静态展示,条目统一「暂未开放」 */
export default function ImportSettingsPage() {
  const { isDark } = useDarkMode();
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-(--app-c-header-to) to-(--app-c-wash-to)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="包裹导入设置" transparent />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 自动导入卡 */}
        <div className="mt-2 rounded-2xl bg-(--app-c-card-bg) p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] text-(--app-c-text-primary)">自动导入</div>
              <div className="mt-1.5 text-[21px] font-extrabold text-(--app-c-text-primary)">支持全网包裹查询</div>
              <div className="mt-1 text-[13px] text-(--app-c-text-secondary)">一次授权实现自动导入</div>
            </div>
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg viewBox="0 0 96 96" className="absolute inset-0">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#E8EDF4" strokeWidth="9" />
                <circle
                  cx="48" cy="48" r="40" fill="none" stroke="#1677FF" strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 40} 0`}
                  strokeLinecap="round" transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="text-center">
                <span className="text-[26px] font-extrabold text-(--app-c-text-primary)">100</span>
                <span className="text-[13px] font-bold text-(--app-c-text-primary)">%</span>
                <div className="text-[10px] text-(--app-c-text-muted)">授权完成度</div>
              </div>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-(--app-c-brand-soft) px-3 py-2 text-[12px] text-(--app-c-text-primary)">
            <span className="font-semibold text-(--app-c-brand)">建议助手:</span> 完成度良好,授权越多包裹展示越全哦
          </div>
        </div>

        {/* 平台授权列表 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) px-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.name}
              {...action('home.importSettings.wontfixToast', wontfix)}
              className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3 text-left last:border-b-0"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.name.slice(0, 1)}
              </span>
              <span className="ml-2.5 text-[15px] text-(--app-c-text-primary)">{p.name}</span>
              <span className="ml-auto text-[13px] text-(--app-c-text-muted)">{p.status}</span>
              <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
            </button>
          ))}
          <div className="py-2.5 text-center text-[11px] text-(--app-c-text-muted)">
            - 取自菜鸟60天内包裹数据 (抖音/拼多多等平台持续接入中) -
          </div>
        </div>

        {/* 授权取件手机 / 绑定亲友 */}
        <div className="mt-3 flex gap-2">
          <button {...action('home.importSettings.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) p-3 text-left">
            <div className="text-[15px] font-semibold text-(--app-c-text-primary)">授权取件手机</div>
            <div className="mt-1 flex items-center text-[13px] text-(--app-c-brand)">已授权1个手机号 <IcChevronRight size={13} /></div>
          </button>
          <button {...action('home.importSettings.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) p-3 text-left">
            <div className="text-[15px] font-semibold text-(--app-c-text-primary)">绑定亲友</div>
            <div className="mt-1 flex items-center text-[13px] text-(--app-c-brand)">立即授权 <IcChevronRight size={13} /></div>
          </button>
        </div>

        {/* 手动添加 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[16px] font-bold text-(--app-c-text-primary)">手动添加</div>
          <div className="mt-2 flex gap-2">
            {[
              { name: '拼多多', color: '#E02E24' },
              { name: '抖音', color: '#161823' },
              { name: '京东', color: '#E1251B' },
            ].map((p) => (
              <button key={p.name} {...action('home.importSettings.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-xl border border-(--app-c-border) bg-(--app-c-card-bg) p-2.5 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: p.color }}>
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="text-[14px] font-semibold text-(--app-c-text-primary)">{p.name}</span>
                </div>
                <div className="mt-1.5 flex items-center text-[12px] text-(--app-c-text-muted)">添加包裹 <IcChevronRight size={12} /></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
