import React, { useRef } from 'react';
import { useSlackGestures } from '../../hooks/useSlackGestures';
import { useI18n } from '../../i18n';
import { useSlackStore } from '../../state';
import { NEUTRAL } from '../../res/colors';
import { IcPlus, IcGear, IcHelp, IcOverflow } from '../../res/icons';
import Avatar from '../Avatar';

/**
 * 工作区切换抽屉（IMG_2369）。约占宽 85%，右侧留遮罩。
 * 阶段④ 订正：点右侧遮罩**或左滑屏幕**都能关闭。
 */
const WorkspaceDrawer: React.FC = () => {
  const { bindTap, bindBack, action, back } = useSlackGestures();
  const { t } = useI18n();
  const workspace = useSlackStore((s) => s.workspace);
  const notImplemented = useSlackStore((s) => s.notImplemented);
  const startX = useRef<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    if (startX.current - e.clientX > 60) {
      startX.current = null;
      back();
    }
  };
  const onPointerUp = () => {
    startX.current = null;
  };

  return (
    <div className="absolute inset-0 z-50 flex">
      <div
        className="flex h-full w-[85%] flex-col bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex-shrink-0 px-4 pt-12 pb-3">
          <h2 className="text-[22px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {t('workspace.title')}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
                  {...action('slack.home.drawer.select.current', () => back())}
              className="flex min-w-0 flex-1 items-center gap-3 border-none bg-transparent p-0 text-left"
            >
              <Avatar text={workspace.name.slice(0, 1).toUpperCase()} color="#4A154B" size={44} />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                  {workspace.name}
                </p>
                <p className="truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                  {workspace.url}
                </p>
              </div>
            </button>
            <button
              {...action('slack.home.drawer.wsmenu.toast', notImplemented)}
              aria-label="workspace-menu"
              className="border-none bg-transparent p-2"
              style={{ color: NEUTRAL.textSecondary }}
            >
              <IcOverflow size={20} />
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-[#EAEAEA] py-1">
          <button
            {...action('slack.home.drawer.addws.toast', notImplemented)}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <IcPlus size={20} style={{ color: NEUTRAL.textSecondary }} />
            <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('workspace.add')}
            </span>
          </button>
          <button
            {...bindTap('slack.drawer.openprefs')}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <IcGear size={20} style={{ color: NEUTRAL.textSecondary }} />
            <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('workspace.prefs')}
            </span>
          </button>
          <button
            {...action('slack.home.drawer.help.toast', notImplemented)}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <IcHelp size={20} style={{ color: NEUTRAL.textSecondary }} />
            <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('workspace.help')}
            </span>
          </button>
        </div>
      </div>

      <div {...bindBack()} className="h-full flex-1 bg-black/40" aria-label="close-drawer" />
    </div>
  );
};

export default WorkspaceDrawer;
