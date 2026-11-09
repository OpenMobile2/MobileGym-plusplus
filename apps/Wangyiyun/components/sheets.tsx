/** 全局弹层(URL searchParams 驱动):抽屉/播放列表/歌曲更多/分享/输出设备/新建歌单/定时关闭 */
import React from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { WY } from '../res/colors';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Sheet, Cover, useToast, NOT_OPEN } from './ui';
import {
  IcClose, IcHeart, IcShare, IcDownload, IcPlus, IcCheck, IcSettings, IcChevronRight,
} from '../res/icons';
import { TIMER_OPTIONS } from '../constants';

function useClose() {
  const { back } = useWangyiyunGestures();
  return () => back();
}

/* ---------------- 侧边抽屉 ---------------- */
function Drawer() {
  const [sp, setSp] = useSearchParams();
  const close = useClose();
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const session = useWangyiyunStore((s) => s.session);
  if (sp.get('drawer') !== 'open') return null;
  const Row = ({ label, badge, onTap }: { label: string; badge?: string; onTap?: () => void }) => (
    <button onClick={() => (onTap ? onTap() : showToast(NOT_OPEN))}
      className="flex items-center w-full py-3 px-4 bg-transparent border-none cursor-pointer text-left">
      <span className="flex-1 text-[15px]" style={{ color: WY.textPrimary }}>{label}</span>
      {badge && <span className="text-[11px] mr-1" style={{ color: WY.textSecondary }}>{badge}</span>}
      <IcChevronRight size={16} style={{ color: WY.textTertiary }} />
    </button>
  );
  return createPortal(
    <div className="fixed inset-0 z-[550] flex"
      {...bindBack({ onTrigger: close })}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[80%] max-w-[320px] h-full bg-white overflow-y-auto animate-[slideright_.2s_ease]" onClick={(e) => e.stopPropagation()}>
        {toast}
        <div className="h-9" />
        <button {...bindTap('drawer.profile-open')} className="flex items-center gap-3 px-4 py-3 w-full bg-transparent border-none cursor-pointer text-left">
          <Cover seed={session.seed} className="w-12 h-12" rounded={24} />
          <div className="text-[16px] font-medium" style={{ color: WY.textPrimary }}>{session.nick}</div>
        </button>
        <div className="mx-4 my-2 rounded-xl p-3 text-white text-[13px]" style={{ background: `linear-gradient(90deg,${WY.vipGold},#C79A54)` }}>
          黑胶VIP·贰 · 你有17成长值待领取
        </div>
        <Row label="我的消息" badge="99+" onTap={() => { close(); go('drawer.msg-open'); }} />
        <Row label="我的云贝" badge="待领取" />
        <Row label="装扮中心" />
        <Row label="创作者中心" />
        <Row label="最近播放" badge="3台设备" onTap={() => { close(); go('drawer.recent-open'); }} />
        <Row label="定时关闭" onTap={() => setSp((p) => { p.set('drawer', ''); p.delete('drawer'); p.set('timer', 'open'); return p; })} />
        <Row label="商城" />
        <Row label="云村有票" />
        <Row label="云推歌" />
        <div className="flex border-t mt-2" style={{ borderColor: WY.divider }}>
          <button onClick={() => { close(); go('drawer.settings-open'); }}
            className="flex-1 py-4 text-[14px] bg-transparent border-none cursor-pointer flex items-center justify-center gap-1" style={{ color: WY.textPrimary }}>
            <IcSettings size={16} /> 设置
          </button>
          <button onClick={() => showToast(NOT_OPEN)} className="flex-1 py-4 text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }}>更多</button>
        </div>
      </div>
    </div>, document.body);
}

/* ---------------- 播放列表 ---------------- */
function QueueSheet() {
  const [sp] = useSearchParams();
  const close = useClose();
  const [tab, setTab] = React.useState<'cur' | 'his'>('cur');
  const songs = useWangyiyunStore((s) => s.songs);
  const queue = useWangyiyunStore((s) => s.queue);
  const history = useWangyiyunStore((s) => s.historyQueue);
  const currentId = useWangyiyunStore((s) => s.currentSongId);
  const playMode = useWangyiyunStore((s) => s.playMode);
  const playSong = useWangyiyunStore((s) => s.playSong);
  const removeFromQueue = useWangyiyunStore((s) => s.removeFromQueue);
  const [toast, showToast] = useToast();
  const { bindTap, bindBack } = useWangyiyunGestures();
  if (sp.get('queue') !== 'open') return null;
  const ids = tab === 'cur' ? queue : history;
  const modeLabel = playMode === 'shuffle' ? '随机' : playMode === 'loop' ? '单曲循环' : '顺序';
  return (
    <Sheet open onClose={close} height="66%"
      closeBinding={bindBack({ onTrigger: close })}>
      {toast}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-4 text-[15px] font-medium">
          <button className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'cur' ? WY.textPrimary : WY.textTertiary }} onClick={() => setTab('cur')}>当前播放{queue.length}</button>
          <button className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'his' ? WY.textPrimary : WY.textTertiary }}
            {...bindTap({ kind: 'action', id: 'queue.tab.history' }, { onTrigger: () => setTab('his') })}>历史播放</button>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[12px]" style={{ color: WY.textSecondary }}>
          <button className="bg-transparent border-none cursor-pointer p-0" style={{ color: WY.textSecondary }} onClick={() => showToast(NOT_OPEN)}>⇄ {modeLabel}</button>
          <button className="bg-transparent border-none cursor-pointer p-0" style={{ color: WY.textSecondary }} onClick={() => showToast(NOT_OPEN)}>◐ 智能过渡</button>
        </div>
      </div>
      <div className="border-t" style={{ borderColor: WY.divider }}>
        {ids.map((id) => {
          const song = songs.find((x) => x.id === id);
          if (!song) return null;
          const playing = id === currentId;
          return (
            <div key={id} className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: WY.divider }}
              {...bindTap({ kind: 'action', id: 'queue.play.select.target' }, {
                params: { songId: id },
                onTrigger: () => { playSong(id, tab === 'cur' ? queue : undefined); close(); },
              })} role="button">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: playing ? WY.primary : WY.textPrimary }}>{song.title}</div>
                <div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{song.artist}</div>
              </div>
              {tab === 'cur' && (
                <button {...bindTap({ kind: 'action', id: 'queue.song.remove' }, {
                  stopPropagation: true,
                  params: { songId: id },
                  onTrigger: () => removeFromQueue(id),
                })} className="w-7 h-7 bg-transparent border-none cursor-pointer" style={{ color: WY.textTertiary }} aria-label="移除"><IcClose size={16} /></button>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ---------------- 分享渠道图标(可识别品牌色) ---------------- */
function ShareIcon({ kind }: { kind: string }) {
  const base = 'w-12 h-12 rounded-full flex items-center justify-center shrink-0';
  if (kind === '微信好友') {
    return (
      <span className={base} style={{ background: '#07C160' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M9.5 4C6.5 4 4 6.2 4 9c0 1.6.8 3 2.1 4l-.5 1.8 2-.9c.6.2 1.2.3 1.9.3.2 0 .4 0 .6-.1C10 12.6 11.4 12 12.5 11c-.2-3.5-2.7-7-3-7zm7.6 5.2c-2.7 0-4.9 1.9-4.9 4.3 0 1.4.7 2.6 1.8 3.4l-.4 1.5 1.7-.8c.5.1 1 .2 1.5.2 2.7 0 4.9-1.9 4.9-4.3s-2.2-4.3-4.6-4.3z" /></svg>
      </span>
    );
  }
  if (kind === '朋友圈') {
    return (
      <span className={base} style={{ background: 'conic-gradient(#F7B500 0 25%, #5AC84A 25% 50%, #2A9DF4 50% 75%, #E54D42 75% 100%)' }}>
        <span className="w-5 h-5 rounded-full bg-white" />
      </span>
    );
  }
  if (kind === 'QQ好友' || kind === 'QQ空间') {
    return (
      <span className={base} style={{ background: kind === 'QQ空间' ? '#FFCE00' : '#12B7F5' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={kind === 'QQ空间' ? '#12B7F5' : '#fff'}><ellipse cx="12" cy="9" rx="5" ry="5.5" /><path d="M6 14c0 2 2.5 4 6 4s6-2 6-4l-1.2 3.2C15.5 19 13.8 20 12 20s-3.5-1-4.8-2.8L6 14z" /></svg>
      </span>
    );
  }
  if (kind === '微博') {
    return (
      <span className={base} style={{ background: '#E6162D' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M15.5 11.2c2.8.4 4.7 2 4.7 4.2 0 2.6-3.3 4.6-7.6 4.6S5 18 5 15.4c0-2.4 2.2-4.4 5.3-5.1C8.8 8.8 10 7 12.2 7c1.8 0 3 1.2 3.3 4.2zM10.2 14.8c-.8.4-1.1 1-.7 1.5.4.5 1.3.6 2.1.2.8-.4 1.1-1 .7-1.5-.4-.5-1.3-.6-2.1-.2zm3.4-1.1c-.3.1-.4.4-.2.6.2.2.5.2.8 0 .2-.1.4-.4.2-.6-.2-.2-.5-.2-.8 0z" /></svg>
      </span>
    );
  }
  // 云音乐笔记
  return (
    <span className={base} style={{ background: WY.primary }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 3a9 9 0 100 18 9 9 0 000-18zm-1 5h2v5.2l3.2 1.9-.9 1.5L11 14V8z" /></svg>
    </span>
  );
}

/* ---------------- 歌曲「更多」:只保留可点功能 ---------------- */
function SongMenuSheet() {
  const [sp, setSp] = useSearchParams();
  const close = useClose();
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const sid = sp.get('songmenu');
  const songs = useWangyiyunStore((s) => s.songs);
  const insertNext = useWangyiyunStore((s) => s.insertNext);
  const enterRoam = useWangyiyunStore((s) => s.enterRoam);
  const quality = useWangyiyunStore((s) => s.quality);
  const playSpeed = useWangyiyunStore((s) => s.playSpeed);
  const sleepTimer = useWangyiyunStore((s) => s.sleepTimer);
  const cycleQuality = useWangyiyunStore((s) => s.cycleQuality);
  const cyclePlaySpeed = useWangyiyunStore((s) => s.cyclePlaySpeed);
  const song = songs.find((x) => x.id === sid);
  if (!sid || !song) return null;
  const dismiss = () => setSp((p) => { p.delete('songmenu'); return p; }, { replace: true });
  const openShare = () => { setSp((p) => { p.delete('songmenu'); p.set('share', `song:${sid}`); return p; }, { replace: true }); };
  const similarId = songs[(songs.indexOf(song) + 1) % songs.length]?.id;
  const rows: { label: string; onTap: () => void }[] = [
    {
      label: '查看歌曲百科',
      onTap: () => { dismiss(); go('songmenu.wiki-open', { id: sid }); },
    },
    {
      label: '开始相似歌曲漫游',
      onTap: () => { enterRoam(); dismiss(); showToast('已切换到相似歌曲'); },
    },
    {
      label: '插播相似歌曲',
      onTap: () => {
        if (similarId) insertNext([similarId]);
        showToast('已添加到播放列表,将于下一首播放');
      },
    },
    {
      label: `音质:${quality || '极高'}`,
      onTap: () => showToast(`已切换为${cycleQuality()}音质`),
    },
    {
      label: `定时关闭${sleepTimer && sleepTimer !== '不开启' ? ` · ${sleepTimer}` : ''}`,
      onTap: () => { setSp((p) => { p.delete('songmenu'); p.set('timer', 'open'); return p; }, { replace: true }); },
    },
    {
      label: `倍速播放 · ${playSpeed || 1}x`,
      onTap: () => showToast(`已切换为 ${cyclePlaySpeed()}x`),
    },
  ];
  return (
    <Sheet open onClose={dismiss} height="62%"
      closeBinding={bindBack({ onTrigger: dismiss })}>
      {toast}
      <div className="flex items-center gap-3 px-4 pb-3 border-b" style={{ borderColor: WY.divider }}>
        <Cover seed={song.seed} className="w-12 h-12" />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] truncate" style={{ color: WY.textPrimary }}>{song.title}</div>
          <div className="text-[12px] truncate" style={{ color: WY.textSecondary }}>{song.artist}</div>
        </div>
      </div>
      <div className="flex justify-around py-4 border-b" style={{ borderColor: WY.divider }}>
        <button {...bindTap('songmenu.collect-open', { params: { id: 'pl_liked' }, beforeTrigger: dismiss })}
          className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }}>
          <IcHeart size={22} /><span className="text-[11px]">收藏</span>
        </button>
        <button onClick={() => showToast('已加入下载队列')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }}>
          <IcDownload size={22} /><span className="text-[11px]">下载</span>
        </button>
        <button onClick={openShare} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }}>
          <IcShare size={22} /><span className="text-[11px]">分享</span>
        </button>
        <button onClick={() => showToast('已发起一起听邀请')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }}>
          <IcPlus size={22} /><span className="text-[11px]">一起听</span>
        </button>
      </div>
      <div>
        <button {...bindTap('songmenu.album-open', { params: { id: song.albumId }, beforeTrigger: dismiss })}
          className="flex w-full items-center py-3 px-4 bg-transparent border-none border-b cursor-pointer text-[14px] text-left" style={{ color: WY.textPrimary, borderColor: WY.divider }}>专辑:{song.album}</button>
        <button {...bindTap('songmenu.artist-open', { params: { id: song.artistId }, beforeTrigger: dismiss })}
          className="flex w-full items-center py-3 px-4 bg-transparent border-none border-b cursor-pointer text-[14px] text-left" style={{ color: WY.textPrimary, borderColor: WY.divider }}>歌手:{song.artist}</button>
        {rows.map((m) => (
          <button key={m.label} onClick={m.onTap}
            className="flex w-full items-center py-3 px-4 bg-transparent border-none border-b cursor-pointer text-[14px] text-left" style={{ color: WY.textPrimary, borderColor: WY.divider }}>{m.label}</button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- 分享面板 ---------------- */
function ShareSheet() {
  const [sp, setSp] = useSearchParams();
  const { bindTap, bindBack } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const val = sp.get('share');
  if (!val) return null;
  const dismiss = () => setSp((p) => { p.delete('share'); return p; }, { replace: true });
  const channels = ['微信好友', '朋友圈', 'QQ好友', 'QQ空间', '微博', '云音乐笔记'] as const;
  return (
    <Sheet open onClose={dismiss} height="38%"
      closeBinding={bindBack({ onTrigger: dismiss })}>
      {toast}
      <div className="px-4 py-2 text-[16px] font-medium" style={{ color: WY.textPrimary }}>分享至</div>
      <div className="flex gap-4 px-4 pb-6 overflow-x-auto">
        {channels.map((c) => (
          <button key={c}
            {...(c === '云音乐笔记'
              ? bindTap('share.tonote', { beforeTrigger: dismiss })
              : { onClick: () => showToast(`已分享到${c}`) })}
            className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer shrink-0">
            <ShareIcon kind={c} />
            <span className="text-[11px] whitespace-nowrap" style={{ color: WY.textSecondary }}>{c}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- 输出设备 ---------------- */
function DevicesSheet() {
  const [sp] = useSearchParams();
  const close = useClose();
  const [vol, setVol] = React.useState(60);
  const [connected, setConnected] = React.useState<string | null>(null);
  const [toast, showToast] = useToast();
  const { bindTap, bindBack } = useWangyiyunGestures();
  if (sp.get('devices') !== 'open') return null;
  const devices = ['连接蓝牙设备', 'HUAWEI FreeBuds 6i', 'OPPO Enco X3', 'Lenovo EA230'];
  return (
    <Sheet open onClose={close} height="60%"
      closeBinding={bindBack({ onTrigger: close })}>
      {toast}
      <div className="px-4 py-3">
        <div className="text-[15px] font-medium mb-2" style={{ color: WY.textPrimary }}>本机 · 当前播放设备</div>
        <input type="range" min={0} max={100} value={vol}
          {...bindTap({ kind: 'action', id: 'devices.volume.input' }, {
            params: { value: vol },
            onTrigger: () => setVol(vol),
          })}
          onChange={(e) => setVol(Number(e.target.value))}
          className="w-full" style={{ accentColor: WY.primary }} />
      </div>
      <div className="px-4 py-2 text-[13px] border-t" style={{ color: WY.textSecondary, borderColor: WY.divider }}>正在寻找设备…</div>
      <div className="px-4 py-2 text-[13px]" style={{ color: WY.textSecondary }}>历史设备管理</div>
      {devices.map((d) => (
        <button key={d} {...bindTap({ kind: 'action', id: 'devices.device.connect' }, {
          params: { device: d },
          onTrigger: () => { setConnected(d); showToast('连接中…'); setTimeout(() => showToast('已连接'), 600); },
        })}
          className="flex w-full items-center py-3 px-4 bg-transparent border-none border-b cursor-pointer text-[14px] text-left" style={{ color: connected === d ? WY.primary : WY.textPrimary, borderColor: WY.divider }}>
          {d}{connected === d ? ' · 已连接' : ''}
        </button>
      ))}
    </Sheet>
  );
}

/* ---------------- 新建歌单 ---------------- */
function CreateSheet() {
  const [sp, setSp] = useSearchParams();
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [title, setTitle] = React.useState('');
  const [priv, setPriv] = React.useState(false);
  const createPlaylist = useWangyiyunStore((s) => s.createPlaylist);
  if (sp.get('create') !== 'open') return null;
  const dismiss = () => setSp((p) => { p.delete('create'); return p; }, { replace: true });
  const submit = () => {
    if (!title.trim()) return;
    const id = createPlaylist(title.trim(), priv);
    dismiss();
    queueMicrotask(() => go('create.done', { id }));
  };
  return (
    <Sheet open onClose={dismiss} height="46%">
      <div className="flex items-center justify-between px-4 py-2">
        <button {...bindBack({ onTrigger: dismiss })}
          className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.textSecondary }}>取消</button>
        <span className="text-[15px] font-medium" style={{ color: WY.textPrimary }}>新建歌单</span>
        <button onClick={submit} className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: title.trim() ? WY.primary : WY.textTertiary }}>完成</button>
      </div>
      <div className="px-4 py-3">
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 20))} placeholder="输入新建歌单标题"
          className="w-full text-[16px] border-none outline-none bg-transparent py-2" style={{ color: WY.textPrimary }} autoFocus />
        <div className="text-right text-[12px]" style={{ color: WY.textTertiary }}>{20 - title.length}</div>
      </div>
      <button {...bindTap({ kind: 'action', id: 'create.private.toggle' }, { onTrigger: () => setPriv((p) => !p) })}
        className="flex items-center w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left">
        <span className="flex-1 text-[14px]" style={{ color: WY.textPrimary }}>设置为隐私歌单</span>
        <span className="w-5 h-5 rounded-full border flex items-center justify-center" style={{ borderColor: priv ? WY.primary : WY.textTertiary, background: priv ? WY.primary : 'transparent' }}>
          {priv && <IcCheck size={14} className="text-white" />}
        </span>
      </button>
    </Sheet>
  );
}

/* ---------------- 定时关闭 ---------------- */
function TimerSheet() {
  const [sp, setSp] = useSearchParams();
  const [toast, showToast] = useToast();
  const sleepTimer = useWangyiyunStore((s) => s.sleepTimer);
  const setSleepTimer = useWangyiyunStore((s) => s.setSleepTimer);
  if (sp.get('timer') !== 'open') return null;
  const dismiss = () => setSp((p) => { p.delete('timer'); return p; }, { replace: true });
  return (
    <Sheet open onClose={dismiss} height="50%">
      {toast}
      <div className="px-4 py-2 text-[15px] font-medium" style={{ color: WY.textPrimary }}>定时关闭</div>
      {TIMER_OPTIONS.map((t) => (
        <button key={t} onClick={() => { setSleepTimer(t); showToast(t === '不开启' ? '已关闭定时' : `将在${t}后停止播放`); dismiss(); }}
          className="flex w-full items-center py-3.5 px-4 bg-transparent border-none border-b cursor-pointer text-[15px] text-left" style={{ color: (sleepTimer || '不开启') === t ? WY.primary : WY.textPrimary, borderColor: WY.divider }}>
          {t}{(sleepTimer || '不开启') === t && <IcCheck size={16} className="ml-auto" />}
        </button>
      ))}
    </Sheet>
  );
}

export function GlobalSheets() {
  return (
    <>
      <Drawer />
      <QueueSheet />
      <SongMenuSheet />
      <ShareSheet />
      <DevicesSheet />
      <CreateSheet />
      <TimerSheet />
    </>
  );
}
