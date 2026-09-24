import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';
import { IcSun } from '../res/icons';
import { PageHeader, Segmented } from '../components/common';

const THEMES = [
  { id: 'classic', name: '经典米黄', bg: '#FFF9E7' },
  { id: 'mint', name: '薄荷', bg: '#E8F6EE' },
  { id: 'sky', name: '天蓝', bg: '#E9F2FB' },
  { id: 'sakura', name: '樱粉', bg: '#FBEEF1' },
  { id: 'lilac', name: '丁香紫', bg: '#F1EDF9' },
  { id: 'plain', name: '素白', bg: '#F7F7F7' },
];

/** 预设色板(s248:每条 5 色横条) */
const PRESET_PALETTES = [
  { id: 'p_default', colors: ['#2E7DA1', '#4AAFB5', '#FBFBE0', '#FBD3AC', '#DF6B5A'] },
  { id: 'p_moss', colors: ['#F5EDD6', '#C4D5B2', '#8FC0A9', '#68A7A6', '#4B7F52'] },
  { id: 'p_dusk', colors: ['#66688A', '#8195AF', '#A5C1BF', '#BDD3AF', '#E4E2B4' ] },
  { id: 'p_blush', colors: ['#CFE0DA', '#F8E5DA', '#F5C6D8', '#EAAABF', '#8E7484'] },
  { id: 'p_coral', colors: ['#DF7B72', '#E9928A', '#F2A98E', '#F6C79B', '#FADFB0'] },
  { id: 'p_candy', colors: ['#8ADAF3', '#B7F0E5', '#EFF4F4', '#F3DCE6', '#E2B7DF'] },
];

function randomPalette(seed: number): string[] {
  // 不用 Math.random(参考实现里带 TimeService 约束的同源要求);按序号取一套预设变体
  const base = PRESET_PALETTES[seed % PRESET_PALETTES.length].colors;
  return [...base].reverse();
}

const PaletteBar: React.FC<{ id: string; colors: string[] }> = ({ id, colors: cs }) => {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const active = st.settings.paletteId === id;
  return (
    <button {...action('personalize.palette.pick', () => st.updateSettings({ paletteId: id }), { params: { paletteId: id } })}
      className="flex h-14 w-full overflow-hidden rounded-lg"
      style={active ? { outline: '2px solid #424242', outlineOffset: 2 } : undefined}>
      {cs.map((c) => <span key={c} className="h-full flex-1" style={{ background: c }} />)}
    </button>
  );
};

/** 个性化(s183/s184)。深色模式下主题色不呈现(8184 官方文案,见 design-tokens §6)。 */
export default function PersonalizePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [tab, setTab] = useState('theme');
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

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.personalize} />
      <div className="px-4">
        <Segmented value={tab} options={[
          { key: 'theme', label: '主题', bind: action('personalize.tab.select.theme', () => setTab('theme')) },
          { key: 'palette', label: '色板', bind: action('personalize.tab.select.palette', () => setTab('palette')) },
          { key: 'border', label: '边框', bind: action('personalize.tab.select.border', () => setTab('border')) },
          { key: 'layout', label: '版式', bind: action('personalize.tab.select.layout', () => setTab('layout')) },
          { key: 'sound', label: '打卡声', bind: action('personalize.tab.select.sound', () => setTab('sound')) },
        ]} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'theme' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => (
                <button key={t.id}
                  {...action('personalize.theme.pick', () => st.updateSettings({ themeId: t.id }), { params: { themeId: t.id } })}
                  className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl text-xs text-[#424242]"
                  style={{ background: t.bg, outline: st.settings.themeId === t.id ? `2px solid ${colors.inkStrong}` : 'none' }}>
                  <span className="h-8 w-8 rounded-full bg-white shadow" />
                  {t.name}
                </button>
              ))}
            </div>
            <button {...action('personalize.theme.custom.pick', () => {
              void import('@/os/albumBridge').then(({ pickImages }) =>
                pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  const selected = r.selected[0];
                  const image = selected.path || selected.uri;
                  if (!image) return;
                  st.updateSettings({ themeId: 'custom', customThemeImage: image });
                  st.showToast('已从系统相册设置主题图');
                }),
              );
            })}
              className="mt-3 w-full rounded-2xl bg-white py-3 text-sm text-[#424242]">自定义主题(选相册图)</button>
            {st.settings.themeId === 'custom' && st.settings.customThemeImage && (
              st.settings.customThemeImage.startsWith('/') ? (
                <AsyncFsImage path={st.settings.customThemeImage} alt="自定义主题预览"
                  className="mt-2 h-24 w-full rounded-2xl object-cover" />
              ) : (
                <img src={st.settings.customThemeImage} alt="自定义主题预览"
                  className="mt-2 h-24 w-full rounded-2xl object-cover" />
              )
            )}
            <button {...action('personalize.shake.pay', purchasePremium)}
              className="mt-2 w-full rounded-2xl bg-white py-3 text-sm text-[#9AA5B1]">摇一摇换主题 (VIP)</button>
            <div className="mt-3 rounded-2xl bg-[#F2F3F5] px-4 py-3 text-xs text-[#9AA5B1]">
              手机处于暗黑模式下时,主题将暂不呈现。
            </div>
          </>
        )}
        {/* 色板 tab(Gate4 补拍 s248)。此前是「该分类沿用默认样式」死占位,属铁律① 违规。 */}
        {tab === 'palette' && (
          <>
            <div className="flex items-center justify-between rounded-2xl bg-[#F2F3F5] p-4">
              <div>
                <div className="text-base font-bold text-[#424242]">我的色板</div>
                <div className="mt-0.5 text-xs text-[#9AA5B1]">创建属于你的专属配色</div>
              </div>
              <button {...action('personalize.palette.create', () => st.addPalette(randomPalette(st.settings.customPalettes.length)))}
                className="flex items-center gap-1 rounded-full bg-[#DCEEF0] px-4 py-2 text-sm font-semibold text-[#2E7D8A]">
                ＋ 新建
              </button>
            </div>

            {st.settings.customPalettes.length === 0 ? (
              <div className="mt-3 rounded-2xl border-2 border-dashed border-[#E3E5E8] py-12 text-center">
                <div className="text-3xl text-[#E3E5E8]">🎨</div>
                <div className="mt-2 text-sm text-[#C9CDD3]">还没有自定义色板</div>
                <div className="mt-1 text-xs text-[#D5D8DC]">点击上方「新建」按钮创建</div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {st.settings.customPalettes.map((p) => <PaletteBar key={p.id} id={p.id} colors={p.colors} />)}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {PRESET_PALETTES.map((p) => <PaletteBar key={p.id} id={p.id} colors={p.colors} />)}
            </div>
          </>
        )}
        {/* 边框 tab(s258)。⚠ 直接驱动今日页习惯图标形状,不是装饰 */}
        {tab === 'border' && (
          <>
            <div className="rounded-2xl bg-[#F2F3F5] py-4 text-center text-sm text-[#C9CDD3]">
              设置首页习惯打卡的图标形状
            </div>
            <div className="mt-4 flex justify-center gap-3">
              {([
                { k: 'circle' as const, label: '圆形', r: 9999, bind: action('personalize.border.select.circle', () => st.updateSettings({ iconShape: 'circle' })) },
                { k: 'squircle' as const, label: '圆角矩形', r: 18, bind: action('personalize.border.select.squircle', () => st.updateSettings({ iconShape: 'squircle' })) },
              ]).map((o) => (
                <button key={o.k} {...o.bind}
                  className="flex w-28 flex-col items-center gap-2 rounded-2xl bg-white py-4"
                  style={st.settings.iconShape === o.k ? { outline: `2px solid ${colors.inkStrong}`, outlineOffset: -2 } : undefined}>
                  <span className="flex h-14 w-14 items-center justify-center bg-[#5BA8B0] text-white"
                    style={{ borderRadius: o.r }}>
                    <IcSun size={26} />
                  </span>
                  <span className="text-sm font-bold text-[#212121]">{o.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 版式 tab(s259)。⚠ 直接驱动今日页习惯网格列数 */}
        {tab === 'layout' && (
          <>
            <div className="rounded-2xl bg-[#F2F3F5] py-4 text-center text-sm text-[#C9CDD3]">
              设置首页习惯打卡的排版样式
            </div>
            <div className="mt-6 flex justify-around">
              {([
                { k: 'comfortable' as const, label: '舒适', cols: 3, bind: action('personalize.layout.select.comfortable', () => st.updateSettings({ layoutDensity: 'comfortable' })) },
                { k: 'compact' as const, label: '紧凑', cols: 4, bind: action('personalize.layout.select.compact', () => st.updateSettings({ layoutDensity: 'compact' })) },
                { k: 'tight' as const, label: '紧密', cols: 5, bind: action('personalize.layout.select.tight', () => st.updateSettings({ layoutDensity: 'tight' })) },
              ]).map((o) => (
                <button key={o.k} {...o.bind} className="flex flex-col items-center gap-2">
                  <span className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${o.cols}, minmax(0,1fr))` }}>
                    {Array.from({ length: o.cols * (o.cols === 3 ? 5 : o.cols === 4 ? 6 : 6) }).map((_, i) => (
                      <span key={i} className="rounded-full bg-[#D9D9D9]"
                        style={{ width: o.cols === 3 ? 16 : o.cols === 4 ? 13 : 11, height: o.cols === 3 ? 16 : o.cols === 4 ? 13 : 11 }} />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-[#212121]">{o.label}</span>
                  <span className="h-6 text-lg" style={{ color: st.settings.layoutDensity === o.k ? colors.inkStrong : 'transparent' }}>✓</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'sound' && (
          <button {...action('personalize.sound.wontfixToast', notice)}
            className="w-full rounded-2xl bg-white py-3.5 text-sm text-[#9AA5B1]">打卡声(试听)</button>
        )}
      </div>
    </div>
  );
}
