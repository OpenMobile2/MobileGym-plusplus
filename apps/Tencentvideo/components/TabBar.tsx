import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import {
  TABS,
  TAB_ROUTES,
  TABBAR_VISIBLE_ROUTES,
  activeTabOf,
  HOME_SCROLLED_KEY,
  HOME_TOTOP_REQUEST_KEY,
  TV_COLORS as C,
} from '../constants';
import { IconRenderer, IcArrowUp } from '../res/icons';

export { TAB_ROUTES, TABBAR_VISIBLE_ROUTES };

/**
 * 底部五 tab(证据 832/736/754;spec chrome.tabbar)。
 * 短剧带红点;会员专区带 V1 角标;好片页(深色策展)TabBar 同步转黑底(design-tokens §四)。
 */
export function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const setUi = useTencentvideoStore((st) => st.setUi);
  const homeScrolled = useTencentvideoStore((st) => st.ui[HOME_SCROLLED_KEY]) === true;
  const dark = pathname === '/haopian';
  const activeColor = dark ? C.darkText : C.text;
  // 未选文案比 token 的 #6E6E6E 再深一档:「会员专区/个人中心」四字在 10px 时难点
  const idleColor = dark ? '#C8C8C8' : '#4A4A4A';
  // 滚动态:首页位变「返回顶部」(证据 827);请求经 store.ui 回传给 HomeFeedPage 执行滚动
  const backTop = pathname === '/' && homeScrolled;
  return (
    <div
      className="flex items-stretch shrink-0"
      style={{ height: 52, background: dark ? C.darkBg : C.pageBg }}
      data-hide-on-keyboard
    >
      {TABS.map((t) => {
        const active = activeTabOf(pathname) === t.id;
        const asBackTop = t.id === 'home' && backTop;
        const label = asBackTop ? s.backTop : s[t.labelKey];
        return (
          <button
            key={t.id}
            {...(asBackTop
              ? bindTap({ kind: 'action', id: 'home.feed.scroll.totop' }, {
                  onTrigger: () => setUi(HOME_TOTOP_REQUEST_KEY, true),
                })
              : t.id === 'home' ? bindTap('tab.home')
              : t.id === 'shortdrama' ? bindTap('tab.shortdrama')
              : t.id === 'vipzone' ? bindTap('tab.vipzone')
              : t.id === 'haopian' ? bindTap('tab.haopian')
              : bindTap('tab.me'))}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none relative"
            aria-label={label}
            data-tab-id={`tab.${t.id}`}
          >
            <span style={{ color: active ? activeColor : idleColor }}>
              {asBackTop ? <IcArrowUp size={22} /> : <IconRenderer name={t.icon} size={22} />}
            </span>
            <span
              className="text-[11px] leading-none tracking-tight"
              style={{ color: active ? activeColor : idleColor, fontWeight: active ? 600 : 500 }}
            >
              {label}
            </span>
            {t.id === 'shortdrama' && (
              <span
                className="absolute top-1.5 right-[30%] w-1.5 h-1.5 rounded-full"
                style={{ background: C.redDot }}
              />
            )}
            {t.id === 'vipzone' && (
              <span
                className="absolute top-0.5 right-[22%] px-0.5 rounded-sm text-[8px] leading-[11px] font-bold"
                style={{ background: C.memberLevel, color: C.vipBadgeBg }}
              >
                V1
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
