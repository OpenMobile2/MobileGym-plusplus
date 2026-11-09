import React from 'react';
import { DisplayManager } from '../../../os/managers/DisplayManager';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { IcChevronRight } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

type Row =
  | { kind: 'wontfix'; label: string; value?: string; dot?: boolean }
  | { kind: 'dark'; label: string };

const GROUPS: Array<{ title: string; items: Row[] }> = [
  { title: '账号', items: [{ kind: 'wontfix', label: '账号与安全' }] },
  {
    title: '通用',
    items: [
      { kind: 'wontfix', label: '版本切换', value: '校园版' },
      { kind: 'wontfix', label: '长辈模式', value: '未开启' },
      { kind: 'dark', label: '深色模式' },
    ],
  },
  {
    title: '包裹',
    items: [
      { kind: 'wontfix', label: '非本人包裹屏蔽' },
      { kind: 'wontfix', label: '包裹图片智能备注' },
      { kind: 'wontfix', label: '包裹导入' },
      { kind: 'wontfix', label: '取件授权设置' },
      { kind: 'wontfix', label: '图片识别商品信息设置' },
      { kind: 'wontfix', label: '安全码设置' },
      { kind: 'wontfix', label: '图片自动识别设置', dot: true },
    ],
  },
  { title: '消息', items: [{ kind: 'wontfix', label: '消息通知' }, { kind: 'wontfix', label: '变更取件实名认证' }] },
  {
    title: '隐私',
    items: [
      { kind: 'wontfix', label: '隐私设置' },
      { kind: 'wontfix', label: '系统权限管理' },
      { kind: 'wontfix', label: '个人信息收集清单' },
      { kind: 'wontfix', label: '个人信息共享清单' },
    ],
  },
  { title: '关于', items: [{ kind: 'wontfix', label: '关于菜鸟', value: '版本8.11.508' }] },
];

/** 设置:深色模式切换 OS darkMode;其余条目暂未开放 */
export default function SettingsPage() {
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const showToast = useCainiaoStore((s) => s.showToast);
  const { isDark } = useDarkMode();
  const wontfix = () => showToast(t('common.notOpen'));

  return (
    <div
      className="flex h-full flex-col bg-(--app-c-page-bg)"
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
    >
      <TopBar title={t('me.settings')} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-4 pb-1 pt-3 text-[13px] text-(--app-c-text-muted)">{g.title}</div>
            <div className="bg-(--app-c-card-bg) px-4">
              {g.items.map((it) => {
                if (it.kind === 'dark') {
                  return (
                    <button
                      key={it.label}
                      {...action('me.settings.dark.toggle', () => DisplayManager.setDarkModeEnabled(!isDark))}
                      className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3.5 text-left last:border-b-0"
                    >
                      <span className="text-[15px] text-(--app-c-text-primary)">{it.label}</span>
                      <span className="ml-auto flex items-center gap-1 text-[13px] text-(--app-c-text-muted)">
                        {isDark ? '已开启' : '未开启'}
                        <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
                      </span>
                    </button>
                  );
                }
                return (
                  <button
                    key={it.label}
                    {...action('me.settings.item.wontfixToast', wontfix)}
                    className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3.5 text-left last:border-b-0"
                  >
                    <span className="text-[15px] text-(--app-c-text-primary)">{it.label}</span>
                    <span className="ml-auto flex items-center gap-1 text-[13px] text-(--app-c-text-muted)">
                      {it.dot && <span className="h-1.5 w-1.5 rounded-full bg-(--app-c-danger)" />}
                      {it.value}
                      <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-4 bg-(--app-c-card-bg)">
          <button
            {...action('me.settings.logout.wontfixToast', wontfix)}
            className="w-full cursor-pointer border-none bg-transparent py-3.5 text-center text-[15px] text-(--app-c-text-primary)"
          >
            {t('me.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
