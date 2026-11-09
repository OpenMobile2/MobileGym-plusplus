import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import {
  IcClose, IcStats, IcMindMap, IcArrowRight,
} from '../res/icons';

/** 设置主页 · 节点 settings.main · 证据 IMG_0193 */
export default function SettingsMainPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const user = useFlomoStore((s) => s.user);
  const toast = useFlomoStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 X */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={20} />
        </button>
        <div className="flex-1 text-center font-bold text-lg lowercase" style={{ color: C.text }}>flomo</div>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 用户卡 */}
        <div className="rounded-2xl px-4 py-4 mt-1" style={{ background: C.surface }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
              style={{ background: C.green, fontSize: 18 }}
            >
              {user.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: C.text, fontSize: 16 }}>{user.name}</span>
                {user.pro && (
                  <span
                    className="px-1.5 rounded font-bold"
                    style={{ background: C.green, color: '#fff', fontSize: 10 }}
                  >
                    PRO
                  </span>
                )}
              </div>
              <div className="mt-0.5" style={{ color: C.sub, fontSize: 12 }}>有效期至 {user.proExpire}</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'settings.main.freevip.open' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="px-3 h-8 rounded-full border-none cursor-pointer"
              style={{ background: C.tagBg, color: C.green, fontSize: 13 }}
            >
              立即续费
            </button>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <QuickBtn
            label="记录统计"
            icon={<IcStats size={20} style={{ color: C.green }} />}
            bind={bindTap('settings.stats.open')}
          />
          <QuickBtn
            label="认知地图"
            icon={<IcMindMap size={20} style={{ color: C.green }} />}
            bind={bindTap('settings.mindmap.open')}
          />
          <QuickBtn
            label="小组件"
            icon={<span style={{ fontSize: 20 }}>🧩</span>}
            bind={bindTap({ kind: 'action', id: 'settings.main.widget.open' }, { onTrigger: () => toast('该功能暂未开放') })}
          />
          <QuickBtn
            label="API & 插件"
            icon={<span style={{ fontSize: 20 }}>🔌</span>}
            bind={bindTap({ kind: 'action', id: 'settings.main.api.open' }, { onTrigger: () => toast('该功能暂未开放') })}
          />
        </div>

        {/* 菜单分组 */}
        <MenuGroup>
          <MenuRow label="账号与密码" bind={bindTap('settings.account.open')} arrow />
          <MenuRow label="偏好设置" bind={bindTap('settings.preferences.open')} arrow />
          <MenuRow label="AI设置" bind={bindTap('settings.ai.open')} arrow />
          <MenuRow label="导出/导入" bind={bindTap('data.importExport.open')} arrow last />
        </MenuGroup>

        <MenuGroup>
          <MenuRow label="免费领会员" bind={bindTap({ kind: 'action', id: 'settings.main.freevip.open' }, { onTrigger: () => toast('该功能暂未开放') })} arrow />
          <MenuRow label="帮助与反馈" bind={bindTap({ kind: 'action', id: 'settings.main.help.open' }, { onTrigger: () => toast('该功能暂未开放') })} arrow />
          <MenuRow
            label="密码锁"
            badge="PRO"
            bind={bindTap({ kind: 'action', id: 'settings.main.lock.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            arrow
            last
          />
        </MenuGroup>

        <MenuGroup>
          <MenuRow
            label="退出登录"
            danger
            bind={bindTap({ kind: 'action', id: 'settings.main.logout.do' }, { onTrigger: () => toast('已退出登录(mock)') })}
            last
          />
        </MenuGroup>

        <div className="text-center mt-4" style={{ color: C.sub, fontSize: 12 }}>flomo 5.4.2</div>
      </div>
    </div>
  );
}

function QuickBtn({ label, icon, bind }: { label: string; icon: React.ReactNode; bind: object }) {
  return (
    <button
      {...bind}
      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-none cursor-pointer"
      style={{ background: C.surface, color: C.text }}
    >
      {icon}
      <span style={{ fontSize: 12 }}>{label}</span>
    </button>
  );
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl mt-3 overflow-hidden" style={{ background: C.surface }}>
      {children}
    </div>
  );
}

function MenuRow({
  label, bind, arrow, danger, badge, last,
}: {
  label: string; bind: object; arrow?: boolean; danger?: boolean; badge?: string; last?: boolean;
}) {
  return (
    <button
      {...bind}
      className={`w-full flex items-center gap-2 px-4 h-12 bg-transparent border-none cursor-pointer text-left ${last ? '' : 'border-b'}`}
      style={{ color: danger ? '#E5484D' : C.text, fontSize: 15, borderColor: C.border }}
    >
      <span className="flex-1 flex items-center gap-2">
        {label}
        {badge && (
          <span className="px-1.5 rounded font-bold" style={{ background: C.green, color: '#fff', fontSize: 10 }}>{badge}</span>
        )}
      </span>
      {arrow && <IcArrowRight size={18} style={{ color: C.sub }} />}
    </button>
  );
}
