import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcNavBack, IcArrowRight } from '../res/icons';

const STORAGE_TOTAL_GB = 20;

/** 账号与密码 · 节点 settings.account · 证据 IMG_0194/IMG_0195/IMG_0201 */
export default function SettingsAccountPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const user = useFlomoStore((s) => s.user);
  const toast = useFlomoStore((s) => s.toast);

  const usedGb = user.storageUsedMb / 1024;
  const pct = Math.min(100, (usedGb / STORAGE_TOTAL_GB) * 100);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="返回"
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>账号与密码</div>
        <div className="w-10" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 基本信息 */}
        <SectionLabel>基本信息</SectionLabel>
        <Card>
          <InfoRow last={false}>
            <span className="flex items-center gap-2">
              <span style={{ color: C.text, fontSize: 15 }}>{user.name}</span>
              {user.pro && (
                <span className="px-1.5 rounded font-bold" style={{ background: C.green, color: '#fff', fontSize: 10 }}>PRO</span>
              )}
            </span>
            <span style={{ color: C.sub, fontSize: 13 }}>修改昵称</span>
          </InfoRow>
          <InfoRow last={false}>
            <span style={{ color: C.text, fontSize: 15 }}>有效期至 {user.proExpire}</span>
          </InfoRow>
          <InfoRow last>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span style={{ color: C.text, fontSize: 15 }}>图片存储空间</span>
                <span style={{ color: C.sub, fontSize: 13 }}>{user.storageUsedMb.toFixed(1)} MB / {STORAGE_TOTAL_GB}.0 GB</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C.bg }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.green }} />
              </div>
            </div>
          </InfoRow>
        </Card>

        {/* 账号设置 */}
        <SectionLabel>账号设置</SectionLabel>
        <Card>
          <InfoRow last={false}>
            <span style={{ color: C.text, fontSize: 15 }}>账号</span>
            <span style={{ color: C.sub, fontSize: 13 }}>{user.phone}</span>
          </InfoRow>
          <InfoRow last={false}>
            <span style={{ color: C.text, fontSize: 15 }}>微信</span>
            <span style={{ color: C.sub, fontSize: 13 }}>已绑定</span>
          </InfoRow>
          <InfoRow last>
            <span style={{ color: C.text, fontSize: 15 }}>密码</span>
            <span style={{ color: C.sub, fontSize: 13 }}>修改</span>
          </InfoRow>
        </Card>

        {/* 数据同步 */}
        <SectionLabel>数据同步</SectionLabel>
        <Card>
          <NavRow
            label="同步到 Notion"
            badge="PRO"
            right="同步"
            bind={bindTap({ kind: 'action', id: 'settings.account.notion.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            last
          />
        </Card>

        {/* 数据控制 */}
        <SectionLabel>数据控制</SectionLabel>
        <Card>
          <NavRow
            label="标签重建"
            right="重建"
            bind={bindTap({ kind: 'action', id: 'settings.account.rebuild.do' }, { onTrigger: () => toast('该功能暂未开放') })}
            last
          />
        </Card>

        {/* 服务信息 */}
        <SectionLabel>服务信息</SectionLabel>
        <Card>
          <NavRow
            label="用户协议 / 隐私政策"
            arrow
            bind={bindTap({ kind: 'action', id: 'settings.account.legal.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            last
          />
        </Card>

        {/* 注销账号 */}
        <SectionLabel>注销账号</SectionLabel>
        <Card>
          <NavRow
            label="注销账号"
            danger
            bind={bindTap({ kind: 'action', id: 'settings.account.delete.do' }, { onTrigger: () => toast('注销账号为高危操作,需二次确认(mock,不真注销)') })}
            last
          />
        </Card>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 mt-4 mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{children}</div>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl overflow-hidden" style={{ background: C.surface }}>{children}</div>;
}

function InfoRow({ children, last }: { children: React.ReactNode; last: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-4 min-h-12 py-3 ${last ? '' : 'border-b'}`}
      style={{ borderColor: C.border }}
    >
      {children}
    </div>
  );
}

function NavRow({
  label, bind, arrow, right, badge, danger, last,
}: {
  label: string; bind: object; arrow?: boolean; right?: string; badge?: string; danger?: boolean; last?: boolean;
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
      {right && <span style={{ color: C.green, fontSize: 13 }}>{right}</span>}
      {arrow && <IcArrowRight size={18} style={{ color: C.sub }} />}
    </button>
  );
}
