import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { PURPLE, NEUTRAL } from '../res/colors';
import { IcHome, IcDm, IcActivity, IcOverflow, IcSearch, IcPlus } from '../res/icons';

/**
 * 底栏：白色圆角悬浮容器内 4 个标签 + 右侧一个分离的圆形搜索钮（design-tokens.md §7）。
 * 「活动」上有未读紫点；主页与更多 Tab 右下各有紫色 FAB（点按后弹出快捷卡）。
 * 紫点消失规则（阶段④ 订正）：须逐条点开活动行，行内紫点全清后底栏紫点才消失。
 */
const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useSlackGestures();
  const { t } = useI18n();
  const hasUnreadActivity = useSlackStore((s) => s.activity.some((a) => !a.read));

  // bindTap 第一个参数必须是字面量，逐个显式绑定
  const items = [
    { path: '/', labelKey: 'tab.home', Icon: IcHome, bind: bindTap('slack.tab.home'), dot: false },
    { path: '/dms', labelKey: 'tab.dms', Icon: IcDm, bind: bindTap('slack.tab.dms'), dot: false },
    {
      path: '/activity',
      labelKey: 'tab.activity',
      Icon: IcActivity,
      bind: bindTap('slack.tab.activity'),
      dot: hasUnreadActivity,
    },
    { path: '/more', labelKey: 'tab.more', Icon: IcOverflow, bind: bindTap('slack.tab.more'), dot: false },
  ];

  const isHome = pathname === '/';
  const isMore = pathname === '/more';
  const showFab = isHome || isMore;

  const searchFromHome = bindTap('slack.tab.search.fromhome');
  const searchFromDms = bindTap('slack.tab.search.fromdms');
  const searchFromActivity = bindTap('slack.tab.search.fromactivity');
  const searchFromMore = bindTap('slack.tab.search.frommore');
  const searchBind =
    pathname === '/dms'
      ? searchFromDms
      : pathname === '/activity'
        ? searchFromActivity
        : pathname === '/more'
          ? searchFromMore
          : searchFromHome;

  return (
    <div data-hide-on-keyboard className="relative flex-shrink-0 px-3 pb-2 pt-1">
      {showFab && (
        <button
          {...bindTap(isHome ? 'slack.home.openfabmenu' : 'slack.more.openfabmenu')}
          aria-label="compose"
          className="absolute -top-16 right-4 flex h-14 w-14 items-center justify-center rounded-full border-none text-white shadow-lg"
          style={{ backgroundColor: PURPLE.fab }}
        >
          <IcPlus size={26} />
        </button>
      )}

      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 items-center justify-around rounded-full bg-white py-1.5"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
        >
          {items.map((it) => {
            const active = pathname === it.path;
            return (
              <button
                key={it.path}
                {...it.bind}
                className="relative flex flex-col items-center gap-0.5 rounded-full border-none px-4 py-1"
                style={{
                  // 选中项是一颗浅灰紫胶囊，图标填充实心紫（实测 IMG_2367 底栏）
                  backgroundColor: active ? '#EDEAEF' : 'transparent',
                  color: active ? PURPLE.tabActive : NEUTRAL.textPrimary,
                }}
              >
                <it.Icon size={21} fill={active ? 'currentColor' : 'none'} />
                <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>
                  {t(it.labelKey)}
                </span>
                {it.dot && (
                  <span
                    className="absolute right-2.5 top-0.5 h-[7px] w-[7px] rounded-full"
                    style={{ backgroundColor: PURPLE.unreadDot }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          {...searchBind}
          aria-label={t('tab.search')}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-none bg-white"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.12)', color: NEUTRAL.textPrimary }}
        >
          <IcSearch size={22} />
        </button>
      </div>
    </div>
  );
};

export default TabBar;
