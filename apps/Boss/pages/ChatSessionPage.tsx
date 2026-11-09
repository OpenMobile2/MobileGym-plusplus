import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar, Chip, MissingContent } from '../components/common';
import { COLORS } from '../res/colors';
import {
  IcBack, IcMore, IcPhone, IcChat, IcResume, IcClose, IcBell, IcSmile, IcPlus,
  IcImage, IcMic, IcKeyboard, IcChevronRight, IcStar,
} from '../res/icons';
import { pickImages } from '@/os/albumBridge';
import AsyncFsImage from '@/os/components/AsyncFsImage';

const C = BOSS_CONFIG;
const EMOJIS = ['😊', '😂', '😳', '😁', '🙂', '😌', '😆', '🙄', '😏', '🤪', '🤗', '🥺', '😓', '😤', '😡', '🥹', '🙏', '😭', '😢', '💰', '🎁', '💪', '😷', '🤔', '👀', '🫡', '😎', '🤑'];

type Panel = 'none' | 'emoji' | 'attach' | 'quickreply';

/** 聊天会话页(IMG_8408/8409/8410/8492/8505):四件套 + PK卡 + 面板族 + Boss 自动回复 */
const ChatSessionPage: React.FC = () => {
  const { bindTap, action, bindBack } = useBossGestures();
  const t = useStrings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useBossStore();
  const requestedSessionId = searchParams.get('sessionId') ?? '';
  const requestedBossId = searchParams.get('bossId') ?? '';
  const requestedJobId = searchParams.get('jobId') ?? '';
  const session = useBossStore((s) => (
    s.sessions.find((x) => x.id === requestedSessionId)
    ?? s.sessions.find((x) => x.bossId === requestedBossId && x.jobId === requestedJobId)
  ));
  const markSessionRead = useBossStore((s) => s.markSessionRead);
  const sessionId = session?.id;
  const messageCount = session?.messages.length;
  const boss = C.bosses.find((b) => b.id === session?.bossId);
  const job = C.jobs.find((j) => j.id === session?.jobId);
  const company = C.companies.find((c) => c.id === boss?.companyId);

  const [input, setInput] = useState('');
  const [noticeBar, setNoticeBar] = useState(true);
  // 表情/附件/常用语 = 键盘型附件面板(本地 state,与键盘同语义);
  // ⋯菜单 与 确认弹窗 = URL 驱动(平台合同:返回键必须能关掉它们)。
  const [panel, setPanel] = useState<Panel>('none');
  const menuOpen = searchParams.get('menu') === 'open';
  const confirmKind = searchParams.get('confirm') as 'phone' | 'wechat' | 'dislike' | null;
  const [remarkDraft, setRemarkDraft] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeOverlay = () => navigate(-1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    if (sessionId) markSessionRead(sessionId);
  }, [markSessionRead, messageCount, sessionId]);

  if (!session) {
    return (
      <div className="flex h-full flex-col bg-white">
        <div className="px-4 pt-12">
          <button {...bindBack()} className="py-3 text-[15px] text-gray-700">‹ 返回</button>
        </div>
        <div className="flex flex-1 items-center justify-center px-8 text-center text-[14px] text-gray-500">会话不存在或已被移除，请返回职位页重新发起沟通。</div>
      </div>
    );
  }
  if (!boss || !job || !company) return <MissingContent text="会话关联的职位或招聘者不存在" />;

  const sendText = () => {
    const text = input.trim();
    if (!text) return;
    store.sendMessage(session.id, text);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      {/* 顶栏 */}
      <div className="grid grid-cols-[44px_1fr_44px] items-center bg-white px-1 pb-1.5 pt-12">
        <button {...bindBack()} className="flex h-10 w-10 items-center justify-center text-gray-800" aria-label="返回"><IcBack size={22} /></button>
        <div className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="truncate text-[17px] font-semibold text-gray-900">{session.remark || boss.name}</span>
            {boss.online && <span className="flex items-center gap-0.5 rounded bg-[#EAF8EE] px-1 text-[11px] text-[#3DBE5B]"><span className="h-1.5 w-1.5 rounded-full bg-[#3DBE5B]" />{t.online}</span>}
          </div>
          <div className="truncate text-[12px] text-gray-500">{company.name} · {boss.title}</div>
        </div>
        <button {...action('chat.overflow.open', () => setSearchParams((p) => { p.set('menu', 'open'); return p; }), { params: {} })} className="flex h-10 w-10 items-center justify-center text-gray-800" aria-label="更多">
          <IcMore size={22} />
        </button>
      </div>

      {/* 四件套 */}
      <div className="grid grid-cols-4 border-t border-gray-50 bg-white pb-3 pt-2.5">
        {[
          { icon: IcPhone, label: t.exchangePhone, id: 'chat.phone.request', color: '#FF8A3C', act: () => setSearchParams((p) => { p.set('confirm', 'phone'); return p; }) },
          { icon: IcChat, label: t.exchangeWechat, id: 'chat.wechat.request', color: '#3DBE5B', act: () => setSearchParams((p) => { p.set('confirm', 'wechat'); return p; }) },
          { icon: IcResume, label: t.sendResume, id: 'chat.resume.send', color: '#5B8DEF', act: () => { store.sendResumeCard(session.id); store.showToast('简历已发送'); } },
          { icon: IcClose, label: t.notInterested, id: 'chat.dislike.confirm', color: '#EB5757', act: () => setSearchParams((p) => { p.set('confirm', 'dislike'); return p; }) },
        ].map(({ icon: Icon, label, id, color, act }) => (
          <button key={id} {...action(id, act, { params: {} })} className="flex flex-col items-center gap-1">
            <Icon size={22} color={color} />
            <span className="text-[12px] text-gray-700">{label}</span>
          </button>
        ))}
      </div>

      {/* 开启提醒横幅 */}
      {!store.settings.notifyMsg && noticeBar && (
        <div className="relative flex items-center justify-between bg-[#EAF6F5] px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <IcBell size={20} color={COLORS.primary} />
            <span>
              <span className="block text-[14px] font-semibold text-gray-900">开启消息提醒</span>
              <span className="block text-[12px] text-gray-500">BOSS回复的消息马上通知你</span>
            </span>
          </div>
          <button onClick={() => { store.setSetting('notifyMsg', true); setNoticeBar(false); store.showToast('已开启消息提醒'); }} className="rounded-full px-3.5 py-1.5 text-[13px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}>开启提醒</button>
          <button onClick={() => setNoticeBar(false)} className="absolute -top-1 right-1 p-1 text-gray-400" aria-label="关闭"><IcClose size={13} /></button>
        </div>
      )}

      {/* 消息流 */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="py-1 text-center text-[12px] text-gray-400">{session.messages[0]?.timeLabel}</div>

        {/* 职位卡片 */}
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-start justify-between">
            <span className="text-[17px] font-bold text-gray-900">{job.title}</span>
            <span className="shrink-0 text-[16px] font-bold" style={{ color: COLORS.accent }}>{job.salary}</span>
          </div>
          <div className="mt-1 text-[13px] text-gray-600">{company.name} {company.stage}</div>
          <div className="mt-2 flex gap-1.5">
            <Chip>{job.city} {job.district}</Chip><Chip>{job.expReq}</Chip><Chip>{job.eduReq}</Chip>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[13px] text-gray-700">
            <Avatar imgKey={boss.avatar} name={boss.name} size={24} />{boss.name} · {boss.title}
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2.5 text-[12px] text-gray-400">
            <span>7月12日 {session.messages[0]?.timeLabel} {session.initiatedByMe ? '由你发起的沟通' : '向你发起的沟通'}</span>
            <button
              {...action('jobdetail.favorite.toggle', () => store.toggleFavoriteJob(job.id), { params: { jobId: job.id } })}
              className="flex items-center gap-1"
              style={store.favoriteJobIds.includes(job.id) ? { color: '#F7B733' } : undefined}
            >
              <IcStar size={14} fill={store.favoriteJobIds.includes(job.id) ? '#F7B733' : 'none'} />
              {store.favoriteJobIds.includes(job.id) ? '已收藏' : '收藏职位'}
            </button>
          </div>
        </div>

        {/* 消息气泡 */}
        {session.messages.map((m) => {
          if (m.from === 'system') {
            return <div key={m.id} className="py-2 text-center text-[12px] text-gray-400">{m.text}</div>;
          }
          const mine = m.from === 'me';
          return (
            <div key={m.id} className={`mt-3 flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <Avatar imgKey={mine ? 'u_me' : boss.avatar} name={mine ? store.user.nickname : boss.name} size={36} />
              {mine && <span className="text-[11px] text-gray-400">{t.delivered}</span>}
              {m.kind === 'resume' ? (
                <div className="max-w-[70%] rounded-xl bg-white p-3">
                  <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-900"><IcResume size={18} color="#5B8DEF" />我的在线简历</div>
                  <div className="mt-1 text-[12px] text-gray-500">{store.user.nickname} · {store.user.gradLabel} · {store.user.degree}</div>
                </div>
              ) : m.kind === 'image' && m.imageUri ? (
                <div className="max-w-[70%] overflow-hidden rounded-xl bg-white p-1.5">
                  {m.imageUri.startsWith('/sdcard/')
                    ? <AsyncFsImage path={m.imageUri} alt="聊天图片" className="max-h-52 rounded-lg object-cover" />
                    : <img src={m.imageUri} alt="聊天图片" className="max-h-52 rounded-lg object-cover" />}
                </div>
              ) : (
                <div
                  className={`max-w-[70%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[15px] leading-relaxed ${mine ? 'text-white' : 'bg-white text-gray-900'}`}
                  style={mine ? { backgroundColor: COLORS.bubble } : undefined}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}

        {/* PK 卡片 */}
        <div className="mt-3 rounded-2xl border border-[#DCEBFA] bg-gradient-to-b from-[#EAF3FE] to-white p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4A9BEB]">
              <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="white" /><path d="M10 2a8 8 0 0 1 8 8h-8V2z" fill="#BBDDF8" /></svg>
            </span>
            <span className="text-[16px] font-semibold text-gray-900">你与该职位竞争者PK情况</span>
          </div>
          <div className="mt-2 text-[13px] text-gray-600">共 <span className="blur-[3px]">97</span> 人投递,你超过 <span className="blur-[3px]">67</span> 竞争者</div>
          <div className="mt-1 text-[13px] text-gray-600">优秀竞争者会 <span className="blur-[3px]">**</span> ,建议你 <span className="blur-[3px]">**</span></div>
          <button {...bindTap('chat.competitiveness-open', { params: { jobId: job.id } })} className="mt-3 w-full rounded-xl bg-[#E3F0FD] py-2.5 text-center text-[14px] text-gray-800">
            查看详细分析
          </button>
        </div>

        {session.initiatedByMe && (
          <div className="mt-3 pb-1 text-center text-[13px] text-gray-500">
            点击修改打招呼语 <button {...bindTap('chat.greeting-open')} className="font-medium" style={{ color: COLORS.accent }}>去修改</button>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="shrink-0 bg-[#F5F6F7] px-3 pb-4 pt-1" data-keep-keyboard="true">
        <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1.5">
          <button
            {...action('chat.quickreply.open', () => setPanel(panel === 'quickreply' ? 'none' : 'quickreply'), { params: {} })}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
            style={{ backgroundColor: COLORS.primaryBtn }}
          >
            常
          </button>
          <input
            {...({ 'data-action': 'chat.message.input', 'data-action-type': 'input' } as object)}
            data-keep-keyboard="true"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendText(); }}
            placeholder={t.inputPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-300"
          />
          {input ? (
            <button
              {...action('chat.message.send', sendText, { params: { value: input } })}
              data-keep-keyboard="true"
              className="shrink-0 rounded-full px-4 py-1.5 text-[14px] font-medium text-white"
              style={{ backgroundColor: COLORS.primaryBtn }}
            >
              {t.send}
            </button>
          ) : (
            <>
              <button {...action('chat.emoji.toggle', () => setPanel(panel === 'emoji' ? 'none' : 'emoji'), { params: {} })} className="shrink-0 p-1 text-gray-600" aria-label="表情">
                {panel === 'emoji' ? <IcKeyboard size={24} /> : <IcSmile size={24} />}
              </button>
              <button {...action('chat.attach.toggle', () => setPanel(panel === 'attach' ? 'none' : 'attach'), { params: {} })} className="shrink-0 p-1 text-gray-600" aria-label="更多">
                {panel === 'attach' ? <IcClose size={24} /> : <IcPlus size={24} />}
              </button>
            </>
          )}
        </div>

        {/* 表情面板(IMG_8409) */}
        {panel === 'emoji' && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl bg-white p-3" data-scroll-container="emoji" data-scroll-direction="vertical">
            <div className="text-[13px] text-gray-500">全部表情</div>
            <div className="mt-2 grid grid-cols-7 gap-3">
              {EMOJIS.map((e) => (
                <button key={e} {...action('chat.emoji.pick', () => setInput((v) => v + e), { params: { emoji: e } })} className="text-[26px]">{e}</button>
              ))}
            </div>
          </div>
        )}

        {/* 附件面板(IMG_8410) */}
        {panel === 'attach' && (
          <div className="mt-2 grid grid-cols-4 gap-4 rounded-2xl bg-white p-4">
            {[
              { icon: IcImage, label: '图片', id: 'chat.attach.image', act: () => {
                void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  const selected = r.selected[0];
                  if (!selected) return;
                  store.sendImage(session.id, selected.path || selected.uri);
                  setPanel('none');
                });
              } },
              { icon: IcMic, label: '语音', id: 'chat.attach.voice', act: () => store.showNotice('语音消息暂未开放，请点击“我知道了”返回。') },
              { icon: IcPhone, label: '语音通话', id: 'chat.attach.call', act: () => store.showNotice('语音通话暂未开放，请点击“我知道了”返回。') },
            ].map(({ icon: Icon, label, id, act }) => (
              <button key={id} {...action(id, act, { params: {} })} className="flex flex-col items-center gap-1.5">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F6F7]"><Icon size={24} className="text-gray-700" /></span>
                <span className="text-[12px] text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* 常用语面板(IMG_8505:每条带发送,底部添加/修改) */}
        {panel === 'quickreply' && (
          <div className="mt-2 rounded-2xl bg-white p-4">
            <div className="text-[16px] font-semibold text-gray-900">常用语</div>
            {store.quickReplies.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 border-b border-gray-50 py-3">
                <span className="min-w-0 text-[14px] leading-relaxed text-gray-800">{q.text}</span>
                <button
                  {...action('chat.quickreply.send', () => { store.sendMessage(session.id, q.text, 'quickreply'); setPanel('none'); }, { params: { id: q.id } })}
                  className="shrink-0 rounded-full border px-4 py-1 text-[13px]"
                  style={{ borderColor: COLORS.primary, color: COLORS.primary }}
                >
                  {t.send}
                </button>
              </div>
            ))}
            <div className="mt-3 grid grid-cols-2 text-center text-[14px] text-gray-700">
              <button {...bindTap('chat.quickreplyadd-open')} className="border-r border-gray-100">✎ {t.add}</button>
              <button {...bindTap('chat.quickreplymanage-open')}>🗂 修改</button>
            </div>
          </div>
        )}
      </div>

      {/* ⋯ 更多菜单(IMG_8492,整页) */}
      {menuOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-[#F5F6F7]">
          <div className="grid grid-cols-[44px_1fr_44px] items-center bg-white px-1 pb-1.5 pt-12">
            <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center text-gray-800" aria-label="返回"><IcBack size={22} /></button>
            <span /><span />
          </div>
          <button {...bindTap('chatmenu.boss-open', { params: { bossId: boss.id } })} className="flex w-full items-center gap-3 bg-white px-4 pb-4 text-left">
            <Avatar imgKey={boss.avatar} name={boss.name} size={52} />
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-semibold text-gray-900">{session.remark || boss.name}</div>
              <div className="text-[13px] text-gray-500">{company.name} · {boss.title}</div>
            </div>
            <IcChevronRight size={18} className="text-gray-300" />
          </button>
          <button
            {...action('chat.remark.edit', () => setRemarkDraft(session.remark), { params: { value: session.remark } })}
            className="mt-3 flex items-center justify-between bg-white px-4 py-4"
          >
            <span className="text-[16px] text-gray-900">设置备注</span><IcChevronRight size={18} className="text-gray-300" />
          </button>
          <div className="mt-3 bg-white px-4">
            {[
              { label: '置顶联系人', on: session.pinned, id: 'chat.pin.toggle', act: () => store.setSessionPinned(session.id, !session.pinned) },
              { label: '加入黑名单', on: session.blocked, id: 'chat.block.toggle', act: () => store.setSessionBlocked(session.id, !session.blocked), hint: '加入黑名单后,将不再收到对方发来的消息' },
              { label: '不感兴趣', on: session.disliked, id: 'chat.overflowdislike.toggle', act: () => setSearchParams((p) => { p.set('confirm', 'dislike'); return p; }) },
            ].map(({ label, on, id, act, hint }) => (
              <div key={id} className="border-b border-gray-50 py-4 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] text-gray-900">{label}</span>
                  <button {...action(id, act, { params: {} })} className="h-7 w-12 rounded-full p-0.5 transition-colors" style={{ backgroundColor: on ? COLORS.primaryBtn : '#E5E7EB' }} aria-label={label}>
                    <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {hint && <div className="mt-1 text-[12px] text-gray-400">{hint}</div>}
              </div>
            ))}
          </div>
          <button
            {...action('chat.report.toast', () => store.showNotice('举报入口暂未开放，请点击“我知道了”返回。'), { params: {} })}
            className="mt-3 flex items-center justify-between bg-white px-4 py-4"
          >
            <span className="text-[16px] text-gray-900">举报对方</span><IcChevronRight size={18} className="text-gray-300" />
          </button>
        </div>
      )}

      {/* 设置备注编辑弹层(本地输入,保存后关闭) */}
      {remarkDraft !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-white p-5" data-keep-keyboard="true">
            <div className="text-center text-[16px] font-semibold text-gray-900">设置备注</div>
            <input
              autoFocus
              data-keep-keyboard="true"
              value={remarkDraft}
              onChange={(e) => setRemarkDraft(e.target.value)}
              placeholder="输入备注名"
              className="mt-3 w-full rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-[14px] outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setRemarkDraft(null)} className="flex-1 rounded-full bg-[#F0F1F3] py-2.5 text-[15px] text-gray-700">取消</button>
              <button
                data-keep-keyboard="true"
                onClick={() => { store.setSessionRemark(session.id, remarkDraft.trim()); store.showToast('备注已保存'); setRemarkDraft(null); }}
                className="flex-1 rounded-full py-2.5 text-[15px] font-medium text-white"
                style={{ backgroundColor: COLORS.primaryBtn }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 换电话/换微信/不感兴趣 确认弹窗(Q6,URL 驱动) */}
      {confirmKind && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-white p-5">
            <div className="text-center text-[16px] font-semibold text-gray-900">
              {confirmKind === 'dislike' ? '确认不再关注该职位?' : `向对方发送交换${confirmKind === 'phone' ? '电话' : '微信'}请求?`}
            </div>
            {confirmKind !== 'dislike' && <div className="mt-1.5 text-center text-[13px] text-gray-500">对方同意后,你们可以看到彼此的联系方式</div>}
            <div className="mt-4 flex gap-3">
              <button onClick={closeOverlay} className="flex-1 rounded-full bg-[#F0F1F3] py-2.5 text-[15px] text-gray-700">取消</button>
              <button
                onClick={() => {
                  if (confirmKind === 'dislike') {
                    store.dislikeSession(session.id); store.showToast('已移除该会话');
                    navigate(-2); // 关弹窗 + 退出会话
                    return;
                  }
                  store.requestExchange(session.id, confirmKind); store.showToast('请求已发送');
                  closeOverlay();
                }}
                className="flex-1 rounded-full py-2.5 text-[15px] font-medium text-white"
                style={{ backgroundColor: COLORS.primaryBtn }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSessionPage;
