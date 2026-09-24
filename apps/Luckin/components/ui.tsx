import React from 'react';
import { useLocation } from 'react-router-dom';
import type { Product } from '../types';
import { useLuckinGestures } from '../hooks/useLuckinGestures';
import { useLuckinStrings } from '../hooks/useLuckinStrings';
import { useLuckinStore } from '../state';
import { IcBack, IcBag, IcChevron, IcClose, IcCoffee, IcCrown, IcDeer, IcHome, IcMenu, IcMinus, IcPlus } from '../res/icons';
import coconutLatteImage from '../assets/generated/coconut-latte.png';
import cloudLatteImage from '../assets/generated/cloud-latte.png';
import grapeLatteImage from '../assets/generated/grape-latte.png';
import instantCoffeeLiquidImage from '../assets/generated/instant-01.png';
import instantFreezeDriedImage from '../assets/generated/instant-02.png';
import instantDripCoffeeImage from '../assets/generated/instant-03.png';
import instantCoconutDrinkImage from '../assets/generated/instant-04.png';
import instantCoffeeBeansImage from '../assets/generated/instant-05.png';
import lemonTeaImage from '../assets/generated/lemon-tea.png';
import orangeCHeroImage from '../assets/generated/orange-c-hero.png';
import velvetCImage from '../assets/generated/velvet-c.png';

const PRODUCT_IMAGES: Record<string, string> = {
  'orange-c': orangeCHeroImage,
  'coconut-latte': coconutLatteImage,
  'velvet-c': velvetCImage,
  'grape-latte': grapeLatteImage,
  'cloud-latte': cloudLatteImage,
  'lemon-tea': lemonTeaImage,
  'instant-01': instantCoffeeLiquidImage,
  'instant-02': instantFreezeDriedImage,
  'instant-03': instantDripCoffeeImage,
  'instant-04': instantCoconutDrinkImage,
  'instant-05': instantCoffeeBeansImage,
};

const PRODUCT_IMAGE_FALLBACK = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x2=%221%22 y2=%221%22%3E%3Cstop stop-color=%22%23e8efff%22/%3E%3Cstop offset=%221%22 stop-color=%22%23fff7e8%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=%22120%22 height=%22120%22 rx=%2216%22 fill=%22url(%23g)%22/%3E%3Cpath d=%22M39 42h36v42H39zM75 51h8a10 10 0 010 20h-8%22 fill=%22none%22 stroke=%22%231c2e9c%22 stroke-width=%225%22 stroke-linejoin=%22round%22/%3E%3Cpath d=%22M45 35c0-6 7-6 7-12M60 35c0-6 7-6 7-12%22 fill=%22none%22 stroke=%22%231c2e9c%22 stroke-width=%224%22 stroke-linecap=%22round%22/%3E%3C/svg%3E';

export function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div data-scroll-container="main" data-scroll-direction="vertical" className={`h-full overflow-y-auto bg-[#F4F5F7] text-[#1A1A1A] ${className}`}>{children}</div>;
}

export function TopBar({ title, right, transparent = false }: { title: string; right?: React.ReactNode; transparent?: boolean }) {
  const { bindBack } = useLuckinGestures();
  return (
    <div className={`h-12 px-3 flex items-center shrink-0 ${transparent ? 'bg-transparent' : 'bg-white'} sticky top-0 z-20`}>
      <button {...bindBack()} aria-label="back" className="w-10 h-10 shrink-0 flex items-center justify-center -ml-2"><IcBack size={23} /></button>
      <h1 className="flex-1 min-w-0 text-center text-[17px] leading-6 font-semibold truncate whitespace-nowrap">{title}</h1>
      <div className="w-10 shrink-0 flex justify-end">{right}</div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-white rounded-xl ${className}`}>{children}</section>;
}

export function Segmented({ options, value, onSelect, actionId }: { options: Array<{ id: string; label: string }>; value: string; onSelect: (id: string) => void; actionId: string }) {
  const { bindAction } = useLuckinGestures();
  return (
    <div className="min-w-0 bg-[#F2F3F5] rounded-full p-1 flex gap-1">
      {options.map((option) => (
        <button key={option.id} {...bindAction(actionId, () => onSelect(option.id), { target: option.id })} className={`flex-1 min-w-0 h-8 px-2 rounded-full text-[13px] leading-5 whitespace-nowrap overflow-hidden text-ellipsis ${value === option.id ? 'bg-[#1C2E9C] text-white font-medium shadow-sm' : 'text-[#666]'}`}>{option.label}</button>
      ))}
    </div>
  );
}

export function ProductArt({ product, size = 82 }: { product: Product; size?: number }) {
  const image = PRODUCT_IMAGES[product.id];
  return (
    <div className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-white" style={{ width: size, height: size }}>
      {image ? (
        <img src={image} alt={product.name} onError={(event) => { if (event.currentTarget.src !== PRODUCT_IMAGE_FALLBACK) event.currentTarget.src = PRODUCT_IMAGE_FALLBACK; }} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${product.color}, #FFFFFF)` }} />
          <div className="absolute w-[70%] h-[70%] rounded-full bg-white/35 -top-3 -right-2" />
          <div className="relative w-[44%] h-[58%] rounded-b-[16px] rounded-t-md border-2 border-white/90 bg-white/45 shadow-md flex items-center justify-center">
            <IcCoffee size={22} className="text-[#1C2E9C]" />
          </div>
        </>
      )}
    </div>
  );
}

export function Stepper({ value, minusProps, plusProps }: { value: number; minusProps?: object; plusProps?: object }) {
  return (
    <div className="shrink-0 flex items-center gap-2 whitespace-nowrap">
      <button {...minusProps} className="w-7 h-7 shrink-0 rounded-lg border border-[#D9D9D9] flex items-center justify-center bg-white"><IcMinus size={15} /></button>
      <span className="min-w-4 text-center text-sm font-medium tabular-nums">{value}</span>
      <button {...plusProps} className="w-7 h-7 shrink-0 rounded-lg bg-[#1C2E9C] text-white flex items-center justify-center"><IcPlus size={15} /></button>
    </div>
  );
}

export function Row({ icon, title, subtitle, onClickProps, trailing }: { icon?: React.ReactNode; title: string; subtitle?: string; onClickProps?: object; trailing?: React.ReactNode }) {
  return (
    <button {...onClickProps} className="w-full min-h-14 px-4 py-3 flex items-center gap-3 text-left bg-white border-b border-[#F1F1F1] last:border-0">
      {icon && <span className="shrink-0 text-[#1C2E9C]">{icon}</span>}
      <span className="flex-1 min-w-0"><span className="block text-[14px] leading-5 font-medium truncate whitespace-nowrap">{title}</span>{subtitle && <span className="block mt-0.5 text-[11px] leading-4 text-[#777] truncate whitespace-nowrap">{subtitle}</span>}</span>
      <span className="shrink-0 whitespace-nowrap">{trailing ?? <IcChevron size={17} className="text-[#A7ADB4]" />}</span>
    </button>
  );
}

export function Sheet({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { bindBack } = useLuckinGestures();
  return (
    <div className="absolute inset-0 z-40 bg-black/45 flex flex-col justify-end">
      <div className="bg-white rounded-t-2xl max-h-[88%] flex flex-col">
        <div className="h-13 px-4 flex items-center border-b border-[#EEE]">
          <h2 className="flex-1 min-w-0 text-[16px] leading-6 font-semibold truncate whitespace-nowrap">{title}</h2>
          <button {...bindBack()} aria-label="close" className="w-9 h-9 shrink-0 flex items-center justify-center"><IcClose size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-3 border-t border-[#EEE]">{footer}</div>}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, props, disabled = false, tone = 'blue' }: { children: React.ReactNode; props?: object; disabled?: boolean; tone?: 'blue' | 'orange' | 'cream' }) {
  const color = tone === 'orange' ? 'bg-[#EE5022] text-white' : tone === 'cream' ? 'bg-[#F8E5C1] text-[#362A19]' : 'bg-[#1C2E9C] text-white';
  return <button {...props} disabled={disabled} className={`h-12 min-w-0 rounded-[24px] px-5 text-[15px] leading-5 font-medium whitespace-nowrap overflow-hidden text-ellipsis ${color} ${disabled ? 'opacity-40' : ''}`}>{children}</button>;
}

export function UnavailableButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { bindAction } = useLuckinGestures();
  const s = useLuckinStrings();
  const showToast = useLuckinStore((state) => state.showToast);
  return <button {...bindAction('common.feature.unavailable', () => showToast(s.feature_unavailable))} className={`min-w-0 ${className}`}>{children}</button>;
}

export function UnavailableRow({ title, subtitle, trailing }: { title: string; subtitle?: string; trailing?: React.ReactNode }) {
  const { bindAction } = useLuckinGestures();
  const s = useLuckinStrings();
  const showToast = useLuckinStore((state) => state.showToast);
  return <Row title={title} subtitle={subtitle} trailing={trailing} onClickProps={bindAction('common.feature.unavailable', () => showToast(s.feature_unavailable))} />;
}

export function ToastHost() {
  const toast = useLuckinStore((state) => state.toast);
  const clearToast = useLuckinStore((state) => state.clearToast);
  React.useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(clearToast, 1800);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);
  if (!toast) return null;
  return <div role="status" className="absolute z-[70] left-1/2 -translate-x-1/2 bottom-24 bg-black/75 text-white text-[13px] rounded-lg px-4 py-2 shadow-lg">{toast}</div>;
}

export function TabBar() {
  const location = useLocation();
  const { bindTap } = useLuckinGestures();
  const s = useLuckinStrings();
  const tabs = [
    { path: '/home', label: s.tab_home, icon: IcHome, props: bindTap('tabbar.home-open') },
    { path: '/', label: s.tab_menu, icon: IcMenu, props: bindTap('tabbar.menu-open') },
    { path: '/instant', label: s.tab_instant, icon: IcBag, props: bindTap('tabbar.instant-open') },
    { path: '/member', label: s.tab_member, icon: IcCrown, props: bindTap('tabbar.member-open') },
    { path: '/mine', label: s.tab_mine, icon: IcDeer, props: bindTap('tabbar.mine-open') },
  ];
  if (!tabs.some((tab) => tab.path === location.pathname)) return null;
  return (
    <div data-hide-on-keyboard className="h-14 shrink-0 bg-white border-t border-[#EEE] flex">
      {tabs.map((tab) => { const active = location.pathname === tab.path; const Icon = tab.icon; return (
        <button key={tab.path} {...tab.props} className={`flex-1 min-w-0 bg-white flex flex-col items-center justify-center gap-0.5 text-[10px] leading-3 ${active ? 'text-[#1C2E9C] font-semibold' : 'text-[#8D949C]'}`}>
          <Icon size={22} className="shrink-0" /><span className="block max-w-full truncate whitespace-nowrap">{tab.label}</span>
        </button>
      ); })}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return <div className="py-16 flex flex-col items-center text-center"><div className="w-24 h-20 rounded-[50%] bg-[#E9EEFF] flex items-center justify-center"><IcCoffee size={42} className="text-[#5C74D6]" /></div><p className="mt-4 text-sm font-medium">{title}</p>{hint && <p className="mt-1 text-xs text-[#999]">{hint}</p>}</div>;
}
