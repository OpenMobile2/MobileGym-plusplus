import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, EmptyState, wontfix, formatCount } from '../components/ui';
import {
  IcChevronRight, IcMic, IcGift, IcWifi, IcTicket, IcMenu, IcSettings, IcHeadphones,
  IcSparkles, IcStar, IcPlay, IcTabMember, IcHeart, IcBell, IcRss, IcFeedback,
} from '../res/icons';
import type { MessageThread } from '../types';

type ContentTab = 'messages' | 'history' | 'subscribe' | 'local' | 'purchased';

// 消息类型 → 图标/底色(与 MessagesPage 对齐)
const MSG_ICON: Record<MessageThread['kind'], React.ComponentType<{ size?: number }>> = {
  interactive: IcHeart, system: IcBell, anchor: IcRss, survey: IcFeedback, tingjian: IcTicket,
};
const MSG_BG: Record<MessageThread['kind'], string> = {
  interactive: '#FE4543', system: '#4C8DFF', anchor: '#FF9F43', survey: '#8E7BFF', tingjian: '#22C3A6',
};

export function MinePage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const user = useXimalayaStore((st) => st.user);
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const history = useXimalayaStore((st) => st.history);
  const local = useXimalayaStore((st) => st.local);
  const purchased = useXimalayaStore((st) => st.purchased);
  const messages = useXimalayaStore((st) => st.messages);
  const listenLists = useXimalayaStore((st) => st.listenLists);
  const subscribedAlbumIds = useXimalayaStore((st) => st.subscribedAlbumIds);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  // 内容 Tab(本地态,页内内联切换)
  const [contentTab, setContentTab] = useState<ContentTab>('subscribe');
  // 订阅子 Tab(本地态,无对应声明 id → 纯本地过滤)
  const [subTab, setSubTab] = useState<'全部' | '有声书' | '播客' | '听单'>('全部');

  // —— 顶部头像/昵称右侧图标(均暂未开放) ——
  const headIcons = [
    { key: 'pet', Icon: IcSparkles, label: '萌宠' },
    { key: 'headset', Icon: IcHeadphones, label: '智能设备' },
    { key: 'gear', Icon: IcSettings, label: '设置' },
  ];

  // —— VIP 卡横滑 ——
  const vipCards = [
    { key: 'vip', title: 'VIP会员', sub: '月卡仅4元', bind: bindTap('mine.vip-open') },
    { key: 'child', title: 'VIP儿童', sub: '连续包月仅需1元', bind: bindTap('mine.child-open') },
    { key: 'plat', title: 'VIP白金', sub: '新客首月特惠', bind: bindTap('mine.vip-open') },
  ];

  // —— 全部服务宫格(暂未开放) ——
  const services = [
    { key: 'create', label: '创作中心', Icon: IcMic, record: true },
    { key: 'redpacket', label: '领红包', Icon: IcGift, record: false },
    { key: 'freevip', label: '免流领VIP', Icon: IcWifi, record: false },
    { key: 'subsidy', label: 'VIP+补贴', Icon: IcTicket, record: false },
    { key: 'all', label: '全部服务', Icon: IcMenu, record: false },
  ];

  // —— 内容 Tab 定义 ——
  const contentTabs: { key: ContentTab; label: string }[] = [
    { key: 'messages', label: s.mine_messages },
    { key: 'history', label: s.mine_history },
    { key: 'subscribe', label: s.mine_subscribe },
    { key: 'local', label: s.mine_local },
    { key: 'purchased', label: s.mine_purchased },
  ];

  // 「查看全部」→ 对应整页入口(保留整页路由)
  const moreBind =
    contentTab === 'messages' ? bindTap('mine.messages-open')
      : contentTab === 'history' ? bindTap('mine.history-open')
        : contentTab === 'subscribe' ? bindTap('mine.subscribe-open')
          : contentTab === 'local' ? bindTap('mine.local-open')
            : bindTap('mine.purchased-open');

  // —— 订阅数据 ——
  const subscribed = albums.filter((a) => subscribedAlbumIds.includes(a.id));
  const subByTab = subTab === '播客'
    ? subscribed.filter((a) => a.category === '播客')
    : subTab === '有声书'
      ? subscribed.filter((a) => a.category !== '播客')
      : subscribed;
  const favList = listenLists.find((l) => l.id === 'll_fav');

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* —— 浅粉渐变头部 —— */}
        <div className="bg-gradient-to-b from-[#F0A091] to-[#FBE7E0] px-4 pt-2 pb-10">
          {/* 录音/直播 pill + 图标(均暂未开放) */}
          <div className="flex items-center justify-end gap-3 text-[#8A5548]">
            <button
              {...bindTap({ kind: 'action', id: 'mine.record.wontfix' }, { onTrigger: wontfix })}
              className="flex items-center gap-1 text-[13px] px-2.5 py-1 rounded-full bg-white/25"
            >
              <IcMic size={15} />录音/直播
            </button>
            {headIcons.map((h) => (
              <button
                key={h.key}
                {...bindTap({ kind: 'action', id: 'mine.services.wontfix' }, { onTrigger: wontfix })}
                aria-label={h.label}
                className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center"
              >
                <h.Icon size={17} />
              </button>
            ))}
          </div>

          {/* 头像 + 昵称 + 统计 → 个人主页 */}
          <div {...bindTap('mine.profile-open')} className="mt-3 flex items-center gap-3">
            <Img src={user.avatar} className="w-16 h-16 rounded-full border-2 border-white/80 object-cover" />
            <div className="flex-1 min-w-0 text-[#3A241E]">
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-semibold truncate">{user.name}</span>
                <span className="text-[10px] leading-[15px] px-1.5 rounded bg-[#FE4543] text-white font-medium">LV{user.level}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-[12px] text-[#6E463C]">
                <span><b className="text-[15px] text-[#3A241E]">{formatCount(user.listenHours)}</b> 小时</span>
                <span><b className="text-[15px] text-[#3A241E]">{formatCount(user.fans)}</b> 粉丝</span>
                <span><b className="text-[15px] text-[#3A241E]">{formatCount(user.follows)}</b> 关注</span>
              </div>
            </div>
            <IcChevronRight size={20} className="text-[#8A5548]" />
          </div>

          {/* VIP 卡横滑 */}
          <div className="mt-3 -mx-1 px-1 flex gap-2.5 overflow-x-auto" data-scroll-container data-scroll-direction="horizontal">
            {vipCards.map((c) => (
              <div key={c.key} {...c.bind} className="shrink-0 w-[190px] rounded-xl px-3.5 py-2.5 bg-white/35">
                <div className="flex items-center gap-1 text-[#8A3B2E]">
                  <IcTabMember size={15} className="text-[#D8A24A]" />
                  <span className="text-[15px] font-bold">{c.title}</span>
                </div>
                <div className="mt-1 flex items-center text-[12px] text-[#A6584A]">
                  <span className="truncate">{c.sub}</span>
                  <IcChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* —— 全部服务宫格 —— */}
        <div className="mx-3 -mt-6 bg-white rounded-xl py-3.5 grid grid-cols-5 text-[11px] text-[#333]">
          {services.map((sv) => (
            <button
              key={sv.key}
              {...bindTap(
                sv.record
                  ? { kind: 'action', id: 'mine.record.wontfix' }
                  : { kind: 'action', id: 'mine.services.wontfix' },
                { onTrigger: wontfix },
              )}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-9 h-9 rounded-full bg-[#FFF0EF] flex items-center justify-center text-[#FE4543]"><sv.Icon size={19} /></div>
              {sv.label}
            </button>
          ))}
        </div>

        {/* —— 内容 Tab 条(页内内联切换) —— */}
        <div className="mx-3 mt-3 bg-white rounded-t-xl px-2 pt-3 flex items-center justify-around text-[16px]">
          {contentTabs.map((t) => {
            const active = t.key === contentTab;
            return (
              <button
                key={t.key}
                {...bindTap(
                  { kind: 'action', id: 'mine.contenttab.select.opt' },
                  { params: { tab: t.key }, onTrigger: () => setContentTab(t.key) },
                )}
                className="flex flex-col items-center gap-1.5 pb-1.5"
              >
                <span className={active ? 'text-[#333] font-semibold' : 'text-[#999]'}>{t.label}</span>
                <span className={`h-0.5 w-5 rounded-full ${active ? 'bg-[#FE4543]' : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>

        {/* —— 内联内容区 —— */}
        <div className="mx-3 mb-4 bg-white rounded-b-xl px-3 pt-2 pb-3">
          {/* 顶部:子Tab(仅订阅) + 查看全部 */}
          <div className="flex items-center justify-between mb-2 min-h-[24px]">
            <div className="flex items-center gap-4 text-[13px]">
              {contentTab === 'subscribe' && (['全部', '有声书', '播客', '听单'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  className={subTab === t ? 'text-[#333] font-semibold' : 'text-[#999]'}
                >{t}</button>
              ))}
            </div>
            <button {...moreBind} className="flex items-center text-[12px] text-[#999] shrink-0">
              查看全部<IcChevronRight size={14} />
            </button>
          </div>

          {/* 订阅 */}
          {contentTab === 'subscribe' && (
            subTab === '听单' ? (
              <div className="flex flex-col gap-2">
                {listenLists.map((l) => (
                  <div key={l.id} {...bindTap('subscribe.listenlist-open', { params: { id: l.id } })} className="flex items-center gap-3 py-1.5">
                    <div className="w-12 h-12 rounded-lg bg-[#FFF6E5] flex items-center justify-center text-[#F5A623] shrink-0"><IcStar size={22} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#333] font-medium truncate">{l.name}</div>
                      <div className="text-[12px] text-[#999]">{l.trackIds.length} 个声音{l.isPrivate ? ' · 私密' : ''}</div>
                    </div>
                    <IcChevronRight size={18} className="text-[#CCC]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* 我收藏的声音 */}
                {favList && (
                  <div {...bindTap('subscribe.listenlist-open', { params: { id: 'll_fav' } })} className="flex items-center gap-3 py-1">
                    <div className="w-12 h-12 rounded-lg bg-[#FFF6E5] flex items-center justify-center text-[#F5A623] shrink-0"><IcStar size={22} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#333] font-medium truncate">{favList.name}</div>
                      <div className="text-[12px] text-[#999]">{favList.trackIds.length} 个声音 · 私密</div>
                    </div>
                    <IcChevronRight size={18} className="text-[#CCC]" />
                  </div>
                )}

                {/* 订阅专辑 */}
                {subByTab.length === 0 ? (
                  <EmptyState text={s.empty_subscribe} />
                ) : (
                  subByTab.map((a) => {
                    const resume = tracks.find((t) => t.id === a.trackIds[0]);
                    return (
                      <div key={a.id} className="rounded-xl bg-[#FAFAFA] overflow-hidden">
                        <div {...bindTap('subscribe.album-open', { params: { id: a.id } })} className="p-2 flex items-center gap-3">
                          <Img src={a.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] text-[#333] font-medium truncate">{a.title}</div>
                            <div className="mt-1 flex items-center gap-1">
                              {a.isVip && <VipTag />}
                              <span className="text-[11px] text-[#999]">{a.finished ? `共 ${a.trackCount} 集` : `更新至 ${a.trackCount} 集`}</span>
                            </div>
                          </div>
                        </div>
                        {resume && (
                          <div {...bindTap('subscribe.player-open')} className="mx-2 mb-2 bg-white rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <IcPlay size={13} className="text-[#FE4543]" />
                            <span className="text-[12px] text-[#666] shrink-0">续播</span>
                            <span className="text-[12px] text-[#999] truncate flex-1">{resume.title}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )
          )}

          {/* 历史 */}
          {contentTab === 'history' && (
            history.length === 0 ? (
              <EmptyState text={s.empty_history} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {history.map((h) => {
                  const album = albums.find((a) => a.id === h.albumId);
                  const track = tracks.find((t) => t.id === h.trackId);
                  if (!album || !track) return null;
                  return (
                    <div key={h.trackId} {...bindTap('history.player-open', { beforeTrigger: () => playTrack(h.albumId, h.trackId) })} className="flex items-center gap-3 py-1">
                      <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#333] font-medium truncate">{track.title}</div>
                        <div className="text-[12px] text-[#999] truncate mt-0.5">{album.title}</div>
                        <div className="text-[11px] text-[#FE4543] mt-0.5">{h.remainSec > 0 ? `剩 ${Math.ceil(h.remainSec / 60)} 分钟` : '已听完'}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#FFF0EF] flex items-center justify-center text-[#FE4543] shrink-0"><IcPlay size={16} /></div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* 本地 */}
          {contentTab === 'local' && (
            local.length === 0 ? (
              <EmptyState text={s.empty_local} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {local.map((l) => {
                  const album = albums.find((a) => a.id === l.albumId);
                  if (!album) return null;
                  return (
                    <div key={l.albumId} {...bindTap('local.player-open', { beforeTrigger: () => playTrack(album.id, album.trackIds[0]) })} className="flex items-center gap-3 py-1">
                      <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#333] font-medium truncate">{album.title}</div>
                        <div className="text-[12px] text-[#999] mt-0.5">已下载 {l.downloadedCount}/{l.totalCount} 集 · {l.sizeMB.toFixed(1)} MB</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#FFF0EF] flex items-center justify-center text-[#FE4543] shrink-0"><IcPlay size={16} /></div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* 已购 */}
          {contentTab === 'purchased' && (
            purchased.length === 0 ? (
              <EmptyState text={s.empty_purchased} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {purchased.map((p) => {
                  const album = albums.find((a) => a.id === p.albumId);
                  if (!album) return null;
                  return (
                    <div key={p.albumId} {...bindTap('purchased.album-open', { params: { id: p.albumId } })} className="flex items-center gap-3 py-1">
                      <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#333] font-medium truncate">{album.title}</div>
                        <div className="mt-1 flex items-center gap-1">
                          {album.isVip && <VipTag />}
                          <span className="text-[11px] text-[#999] truncate">{album.anchorName}</span>
                        </div>
                        <div className="text-[11px] text-[#FE4543] mt-0.5">
                          {p.kind === 'anchorVip' ? '主播会员 · 有效期内' : p.kind === 'package' ? '畅听包' : `已购 ${p.purchasedCount} 集`}
                        </div>
                      </div>
                      <IcChevronRight size={18} className="text-[#CCC]" />
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* 消息 */}
          {contentTab === 'messages' && (
            messages.length === 0 ? (
              <EmptyState text={s.empty_messages} />
            ) : (
              <div className="flex flex-col">
                {messages.map((m) => {
                  const Ic = MSG_ICON[m.kind];
                  return (
                    <div key={m.id} {...bindTap('messages.detail-open', { params: { id: m.id } })} className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F5] last:border-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: MSG_BG[m.kind] }}><Ic size={22} /></div>
                        {m.unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FE4543] text-white text-[10px] leading-4 text-center">{m.unread}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-[#333] font-medium">{m.name}</div>
                        <div className="text-[13px] text-[#999] truncate mt-0.5">{m.preview}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
