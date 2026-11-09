// 设置子页组。节点 settings.sub —— 一个路由承载 6 个设置分组,靠 ?section= 区分
// (appearance/play/download/notify/storage/privacy,取值由 settings.sub.open.* 各自带入);
// 「推送通知设置」是通知设置的二级 uiState(证据 717),不另开路由,走 store.ui。
// 视觉证据:713 外观 / 719+720 播放 / 718 下载&上传 / 716 通知 / 717 推送 / 714 隐私 / 715 存储。
// 所有开关、单选、档位都真写 store(setSetting/toggleSetting/setDownloadQuality/…),切回来还在。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { useTvQuery } from '../hooks/useTvParams';
import { TV_COLORS as C } from '../constants';
import { Switch, TopBar, type BindProps } from '../components/ui';
import { IcArrowRight, IcCheck, IcNavBack } from '../res/icons';

/** 二级 uiState / 弹层态(离散 UI 键走 store.ui,不进 URL) */
const UI_PUSH_OPEN = 'settings.sub.pushOpen';
const UI_PICKER = 'settings.sub.picker';

const SECTION_TITLES: Record<string, string> = {
  appearance: '外观设置',
  play: '播放设置',
  download: '下载&上传设置',
  notify: '通知设置',
  storage: '存储空间管理',
  privacy: '隐私管理',
};

/** 颜色模式:种子存英文码(light),证据 713 展示中文三选一 */
const COLOR_MODES: { code: string; label: string; sub?: string }[] = [
  { code: 'system', label: '跟随系统', sub: '开启后,腾讯视频将跟随系统切换您偏好的颜色模式。' },
  { code: 'dark', label: '深色模式' },
  { code: 'light', label: '浅色模式' },
];

/** 播放设置行文案照证据 719/720;种子 settings.play 只给布尔键,这里做键→行文案的映射 */
const PLAY_BASIC: { key: string; label: string }[] = [
  { key: 'skipIntroOutro', label: '自动跳过片头片尾' },
  { key: 'seekPreview', label: '快进时显示视频截图' },
  { key: 'longPressRewind', label: '播放器内长按快退手势' },
];
const PLAY_GROUPS: { title: string; rows: { key: string; label: string; sub?: string }[] }[] = [
  {
    title: '自动播放',
    rows: [
      {
        key: 'autoPlayRecommend',
        label: '允许移动网络自动播放视频',
        sub: '开启后,视频在移动网络下不再询问是否流量播放。',
      },
      {
        key: 'autoPlayNext',
        label: '首页卡片自动播放(移动网络)',
        sub: '开启后,首页、频道页的视频卡片将在移动网络下自动播放。',
      },
      {
        key: 'autoPlayWifiOnly',
        label: '首页卡片自动播放(WiFi/免流)',
        sub: '开启后,首页、频道页的视频卡片将在WiFi和免流场景下自动播放。',
      },
    ],
  },
  {
    title: '自动小窗',
    rows: [
      { key: 'miniWindowOnHome', label: '视频播放中切换应用开启自动小窗' },
      { key: 'miniWindowOnBack', label: '视频播放中切换页面开启自动小窗' },
      { key: 'miniWindowOnLock', label: '竖屏播放中切换应用开启自动小窗' },
    ],
  },
  {
    title: '流畅播放',
    rows: [
      { key: 'smoothPreload', label: '流畅播放辅助缓存' },
      { key: 'smoothAutoQuality', label: '智能画质自动切换' },
      { key: 'smoothHardwareDecode', label: '硬件解码加速' },
    ],
  },
];

/** 隐私管理:个性化设置 4 行读种子布尔值展示,其余行是纯跳转文案(证据 714) */
const PRIVACY_PERSONAL: { key: string; label: string }[] = [
  { key: 'personalizedContent', label: '个性化内容管理' },
  { key: 'personalizedAd', label: '个性化广告管理' },
  { key: 'programRecommend', label: '节目推荐管理' },
  { key: 'locationRecommend', label: '基于位置的推荐管理' },
];
const PRIVACY_LINK_GROUPS: { title: string; rows: string[] }[] = [
  { title: '权限设置', rows: ['系统权限管理', '系统权限清单'] },
  { title: '个人信息管理', rows: ['个人信息概览', '个人信息查阅与管理', '个人信息下载'] },
  { title: '隐私文档', rows: ['隐私保护指引', '隐私政策摘要', '第三方SDK清单'] },
];

/** 同时下载个数枚举(qa:Q1) */
const CONCURRENCY_OPTIONS = [1, 2, 3];

/* ---------- 页内积木(浅色设置行,证据 713-721 统一形态) ---------- */

function GroupTitle({ text }: { text: string }) {
  return (
    <div className="text-[13px] px-4 pt-4 pb-1.5" style={{ color: C.textTertiary }}>
      {text}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 rounded-xl overflow-hidden" style={{ background: C.pageBg }}>
      {children}
    </div>
  );
}

function Row({
  label,
  sub,
  value,
  right,
  bind,
}: {
  label: string;
  sub?: string;
  value?: string;
  right?: React.ReactNode;
  bind?: BindProps;
}) {
  const body = (
    <>
      <span className="flex-1 min-w-0 text-left">
        <span className="block text-[15px]" style={{ color: C.text }}>
          {label}
        </span>
        {sub && (
          <span className="block text-[11px] pt-0.5 leading-[15px]" style={{ color: C.textSub }}>
            {sub}
          </span>
        )}
      </span>
      {value && (
        <span className="text-[13px] pr-1" style={{ color: C.textSub }}>
          {value}
        </span>
      )}
      {right ?? (bind ? <IcArrowRight size={16} color={C.textTertiary} /> : null)}
    </>
  );
  const cls = 'flex items-center gap-2 w-full px-4 py-3.5 border-none text-left';
  return bind ? (
    <button {...bind} className={cls} style={{ background: 'transparent' }}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/**
 * 浅色页开关。components/ui.tsx 的 Switch 关态轨道是 rgba(255,255,255,0.28)(为播放器深色面板调的),
 * 白底上会糊成一片 —— 这里在外层垫一层 divider 灰当轨道底,不改共享组件。
 */
function LightSwitch({ on, bind }: { on: boolean; bind: BindProps }) {
  return (
    <span className="inline-flex rounded-full" style={{ background: on ? 'transparent' : C.divider }}>
      <Switch on={on} bind={bind} />
    </span>
  );
}

export default function SettingsSubPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const section = useTvQuery('section') ?? 'appearance';

  const settings = useTencentvideoStore((s) => s.settings);
  const player = useTencentvideoStore((s) => s.player);
  const selectedPushTags = useTencentvideoStore((s) => s.selectedPushTags);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const setSetting = useTencentvideoStore((s) => s.setSetting);
  const toggleSetting = useTencentvideoStore((s) => s.toggleSetting);
  const togglePushTag = useTencentvideoStore((s) => s.togglePushTag);
  const storageClean = useTencentvideoStore((s) => s.storageClean);
  const setDownloadQuality = useTencentvideoStore((s) => s.setDownloadQuality);
  const setDownloadConcurrency = useTencentvideoStore((s) => s.setDownloadConcurrency);

  const pushOpen = Boolean(ui[UI_PUSH_OPEN]);
  const picker = String(ui[UI_PICKER] ?? '');

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  /* ---------- 推送通知设置(通知设置的二级 uiState,证据 717) ---------- */

  if (section === 'notify' && pushOpen) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
        {/* 二级态的返回不是路由级返回(退出去就回不到通知设置了),
            与收银台权益对比页同一写法:用打开它的那条 action 收起(VipCashierPage 先例)。 */}
        <div className="flex items-center h-11 px-2 shrink-0" style={{ background: C.chipGray }}>
          <button
            {...bindTap({ kind: 'action', id: 'settings.notify.push.open' }, {
              onTrigger: () => setUi(UI_PUSH_OPEN, false),
            })}
            className="bg-transparent border-none p-1"
            style={{ color: C.text }}
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center text-[16px] font-semibold" style={{ color: C.text }}>
            推送通知设置
          </div>
          <div className="w-8" />
        </div>

        <div
          className="flex-1 overflow-y-auto pb-6"
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          <div className="flex items-baseline gap-2 px-4 pt-2 pb-2">
            <span className="text-[16px] font-bold" style={{ color: C.text }}>
              我的推送兴趣
            </span>
            <span className="text-[11px]" style={{ color: C.textSub }}>
              未选择的兴趣内容将不会被推送
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 px-3">
            {settings.notifications.interestTags.map((tag) => {
              const on = selectedPushTags.includes(tag);
              return (
                <button
                  key={tag}
                  {...bindTap({ kind: 'action', id: 'settings.push.tag.toggle' }, {
                    params: { tag },
                    onTrigger: () => togglePushTag(tag),
                  })}
                  className="h-9 rounded-md border-none text-[13px] truncate"
                  style={{
                    background: on ? C.primaryBg : C.chipGray,
                    color: on ? C.primary : C.text,
                    border: on ? `1px solid ${C.primary}` : 'none',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <Group>
              <Row
                label="允许推送通知"
                right={
                  <LightSwitch
                    on={settings.notifications.pushMaster}
                    bind={bindTap({ kind: 'action', id: 'settings.push.master.toggle' }, {
                      onTrigger: () => toggleSetting('notifications', 'pushMaster'),
                    })}
                  />
                }
              />
            </Group>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 各分组正文 ---------- */

  const appearanceBody = (
    <>
      <GroupTitle text="颜色模式" />
      <Group>
        {COLOR_MODES.map((m) => {
          const on = settings.appearance.colorMode === m.code;
          return (
            <Row
              key={m.code}
              label={m.label}
              sub={m.sub}
              bind={bindTap({ kind: 'action', id: 'settings.appearance.colormode' }, {
                params: { mode: m.code },
                onTrigger: () => setSetting('appearance', 'colorMode', m.code),
              })}
              right={
                <span
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: on ? C.primary : 'transparent',
                    border: on ? 'none' : `1px solid ${C.divider}`,
                    color: '#FFFFFF',
                  }}
                >
                  {on && <IcCheck size={14} />}
                </span>
              }
            />
          );
        })}
      </Group>

      <GroupTitle text="导航栏装扮" />
      <Group>
        <Row
          label="底部导航栏显示推广皮肤"
          right={
            <LightSwitch
              on={settings.appearance.navSkin}
              bind={bindTap({ kind: 'action', id: 'settings.appearance.skin.toggle' }, {
                params: { key: 'navSkin' },
                onTrigger: () => toggleSetting('appearance', 'navSkin'),
              })}
            />
          }
        />
      </Group>

      <GroupTitle text="App图标装扮" />
      <Group>
        <Row
          label="App图标展示推广装扮"
          right={
            <LightSwitch
              on={settings.appearance.iconSkin}
              bind={bindTap({ kind: 'action', id: 'settings.appearance.skin.toggle' }, {
                params: { key: 'iconSkin' },
                onTrigger: () => toggleSetting('appearance', 'iconSkin'),
              })}
            />
          }
        />
      </Group>
    </>
  );

  const playBody = (
    <>
      <GroupTitle text="基础设置" />
      <Group>
        {PLAY_BASIC.map((r) => (
          <Row
            key={r.key}
            label={r.label}
            right={
              <LightSwitch
                on={Boolean(settings.play[r.key])}
                bind={bindTap({ kind: 'action', id: 'settings.play.switch.toggle' }, {
                  params: { key: r.key },
                  onTrigger: () => toggleSetting('play', r.key),
                })}
              />
            }
          />
        ))}
      </Group>

      {PLAY_GROUPS.map((g) => (
        <React.Fragment key={g.title}>
          <GroupTitle text={g.title} />
          <Group>
            {g.rows.map((r) => (
              <Row
                key={r.key}
                label={r.label}
                sub={r.sub}
                right={
                  <LightSwitch
                    on={Boolean(settings.play[r.key])}
                    bind={bindTap({ kind: 'action', id: 'settings.play.option.select' }, {
                      params: { key: r.key },
                      onTrigger: () => toggleSetting('play', r.key),
                    })}
                  />
                }
              />
            ))}
          </Group>
        </React.Fragment>
      ))}
    </>
  );

  const downloadBody = (
    <>
      <GroupTitle text="下载设置" />
      <Group>
        <Row
          label="下载视频时禁止自动锁屏"
          right={
            <LightSwitch
              on={settings.download.forbidAutoLock}
              bind={bindTap({ kind: 'action', id: 'settings.download.lockscreen.toggle' }, {
                onTrigger: () => toggleSetting('download', 'forbidAutoLock'),
              })}
            />
          }
        />
        <Row
          label="下载音画设置"
          value={settings.download.quality}
          bind={bindTap({ kind: 'action', id: 'settings.download.quality.pick' }, {
            onTrigger: () => setUi(UI_PICKER, picker === 'quality' ? '' : 'quality'),
          })}
        />
        <Row
          label="同时下载个数"
          value={`${settings.download.concurrent}个`}
          bind={bindTap({ kind: 'action', id: 'settings.download.parallel.pick' }, {
            onTrigger: () => setUi(UI_PICKER, picker === 'concurrent' ? '' : 'concurrent'),
          })}
        />
        <Row
          label="允许移动网络下载"
          right={
            <LightSwitch
              on={settings.download.mobileNetworkDownload}
              bind={bindTap({ kind: 'action', id: 'settings.download.network.toggle' }, {
                params: { key: 'mobileNetworkDownload' },
                onTrigger: () => toggleSetting('download', 'mobileNetworkDownload'),
              })}
            />
          }
        />
        <Row
          label="允许移动网络后台下载"
          right={
            <LightSwitch
              on={settings.download.mobileNetworkAutoDownload}
              bind={bindTap({ kind: 'action', id: 'settings.download.network.toggle' }, {
                params: { key: 'mobileNetworkAutoDownload' },
                onTrigger: () => toggleSetting('download', 'mobileNetworkAutoDownload'),
              })}
            />
          }
        />
      </Group>

      <GroupTitle text="上传设置" />
      <Group>
        <Row
          label="允许运营商网络上传"
          right={
            <LightSwitch
              on={settings.download.carrierUpload}
              bind={bindTap({ kind: 'action', id: 'settings.download.network.toggle' }, {
                params: { key: 'carrierUpload' },
                onTrigger: () => toggleSetting('download', 'carrierUpload'),
              })}
            />
          }
        />
      </Group>
    </>
  );

  const notifyBody = (
    <div className="pt-3">
      <Group>
        <Row
          label="推送通知设置"
          bind={bindTap({ kind: 'action', id: 'settings.notify.push.open' }, {
            onTrigger: () => setUi(UI_PUSH_OPEN, true),
          })}
        />
        <Row label="消息设置" bind={wontfix('settings.notify.msg.wontfix')} />
        <Row
          label="表态支持播放声音"
          right={
            <LightSwitch
              on={settings.notifications.reactionSound}
              bind={bindTap({ kind: 'action', id: 'settings.notify.switch.toggle' }, {
                params: { key: 'reactionSound' },
                onTrigger: () => toggleSetting('notifications', 'reactionSound'),
              })}
            />
          }
        />
        <Row
          label="日历提醒"
          right={
            <LightSwitch
              on={settings.notifications.calendarRemind}
              bind={bindTap({ kind: 'action', id: 'settings.notify.switch.toggle' }, {
                params: { key: 'calendarRemind' },
                onTrigger: () => toggleSetting('notifications', 'calendarRemind'),
              })}
            />
          }
        />
      </Group>
    </div>
  );

  const privacyBody = (
    <>
      <GroupTitle text="个性化设置" />
      <Group>
        {PRIVACY_PERSONAL.map((r) => (
          <Row
            key={r.key}
            label={r.label}
            value={settings.privacy[r.key] ? '已开启' : '已关闭'}
            bind={wontfix('settings.privacy.rows.wontfix')}
          />
        ))}
      </Group>
      {PRIVACY_LINK_GROUPS.map((g) => (
        <React.Fragment key={g.title}>
          <GroupTitle text={g.title} />
          <Group>
            {g.rows.map((label) => (
              <Row key={label} label={label} bind={wontfix('settings.privacy.rows.wontfix')} />
            ))}
          </Group>
        </React.Fragment>
      ))}
    </>
  );

  const storageBody = (
    <>
      <GroupTitle text="缓存管理" />
      <Group>
        <Row
          label={`当前缓存 ${settings.storage.cacheSize}`}
          sub="临时数据,清理后不影响正常使用"
          right={
            <button
              {...bindTap({ kind: 'action', id: 'settings.storage.clean' }, {
                onTrigger: () => storageClean(),
              })}
              className="shrink-0 h-8 px-3 rounded-full border-none text-[13px]"
              style={{ background: C.primary, color: '#FFFFFF' }}
            >
              立即清理
            </button>
          }
        />
      </Group>

      <GroupTitle text="下载管理" />
      <Group>
        <Row
          label="视频"
          value={settings.storage.videoDownload}
          bind={bindTap('download.mine.open.fromStorage')}
        />
        <Row
          label="小说"
          value={settings.storage.novelDownload}
          bind={bindTap('download.mine.open.fromStorage')}
        />
      </Group>
    </>
  );

  const BODY: Record<string, React.ReactNode> = {
    appearance: appearanceBody,
    play: playBody,
    download: downloadBody,
    notify: notifyBody,
    privacy: privacyBody,
    storage: storageBody,
  };

  /* ---------- 档位选择弹层(证据 718 行尾「720P ›」「1个 ›」) ---------- */

  const qualityOptions = player.qualities.filter((q) => q.id !== 'auto');
  const pickerPanel = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* 关闭复用打开它的那条 action(页内弹层没有独立路由,bindBack 会把整页弹掉) */}
      <div
        {...bindTap(
          {
            kind: 'action',
            id: picker === 'quality' ? 'settings.download.quality.pick' : 'settings.download.parallel.pick',
          },
          { onTrigger: () => setUi(UI_PICKER, '') },
        )}
        className="absolute inset-0 bg-black/45"
      />
      <div className="relative rounded-t-2xl pb-4" style={{ background: C.pageBg }}>
        <div className="text-center text-[16px] font-semibold py-3" style={{ color: C.text }}>
          {picker === 'quality' ? '下载音画设置' : '同时下载个数'}
        </div>
        {picker === 'quality'
          ? qualityOptions.map((q) => {
            const on = q.label === settings.download.quality;
            return (
              <button
                key={q.id}
                {...bindTap({ kind: 'action', id: 'settings.download.quality.pick' }, {
                  params: { quality: q.label },
                  onTrigger: () => {
                    setDownloadQuality(q.label);
                    setUi(UI_PICKER, '');
                  },
                })}
                className="flex items-center w-full px-4 py-3 bg-transparent border-none text-left"
              >
                <span className="flex-1">
                  <span className="text-[15px]" style={{ color: on ? C.primary : C.text }}>
                    {q.label}
                  </span>
                  <span className="text-[11px] pl-2" style={{ color: C.textSub }}>
                    {q.desc}
                  </span>
                </span>
                {q.tier !== 'free' && (
                  <span
                    className="px-1 mr-2 rounded text-[10px] leading-[15px] font-semibold"
                    style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
                  >
                    {q.tier === 'svip' ? 'SVIP' : 'VIP'}
                  </span>
                )}
                {on && <IcCheck size={16} color={C.primary} />}
              </button>
            );
          })
          : CONCURRENCY_OPTIONS.map((n) => {
            const on = n === settings.download.concurrent;
            return (
              <button
                key={n}
                {...bindTap({ kind: 'action', id: 'settings.download.parallel.pick' }, {
                  params: { count: n },
                  onTrigger: () => {
                    setDownloadConcurrency(n);
                    setUi(UI_PICKER, '');
                  },
                })}
                className="flex items-center w-full px-4 py-3 bg-transparent border-none text-left"
              >
                <span className="flex-1 text-[15px]" style={{ color: on ? C.primary : C.text }}>
                  {n}个
                </span>
                {on && <IcCheck size={16} color={C.primary} />}
              </button>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
      <TopBar title={SECTION_TITLES[section] ?? SECTION_TITLES.appearance} transparent />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {BODY[section] ?? BODY.appearance}
      </div>

      {section === 'download' && picker !== '' && pickerPanel}
    </div>
  );
}
