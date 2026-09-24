/**
 * 我tab页(个人中心):头像行+会员横幅+模式四宫格+列表+圈子/服务宫格+2x2功能卡。
 * spec: mine.main;证据 screenshot 113_4 / frame r5@3 r6@18 r8@2;备孕态变体(qa:Q2=A)。
 */
import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, MODE_NOT_OPEN, useToast, Img } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcArrowRight, IcScan, IcGift, IcSettings, IcDrop, IcUser, IcWallet, IcOrder } from '../res/icons';

const SERVICES = [
  { name: '柚子街', emoji: '🛍️', bg: '#FFE3ED' },
  { name: '问医生', emoji: '💬', bg: '#D9F4F0' },
  { name: '桌面小组件', emoji: '📱', bg: '#EDE3FC' },
  { name: '爱爱调养室', emoji: '💞', bg: '#FFE3ED', ad: true },
  { name: '更多服务', emoji: '🍊', bg: '#FFEDD9' },
] as const;

const FEATURE_CARDS = [
  { title: '柚子试用', sub: '新奇好物优先试', emoji: '🧡' },
  { title: '经期活动', sub: '姐妹支招缓不适', emoji: '☕' },
  { title: '暖宫好物', sub: '月经顺畅不焦虑', emoji: '🏪' },
  { title: '经期全书', sub: '月月准时接月经', emoji: '📅' },
] as const;

/** 备孕态圈子行(spec mine.main uiStates mode-prep;后两个不在 store.circles → toast) */
const PREP_CIRCLE_ROW = [
  { circleId: 'love', name: '爱情碎碎念' },
  { circleId: 'prep', name: '备孕交流区' },
  { circleId: null, name: '试纸观察站', emoji: '🧪', bg: '#EDE3FC' },
  { circleId: null, name: '孕前检查站', emoji: '🏥', bg: '#D9F4F0' },
] as const;

export default function MePage() {
  const { bindTap } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();

  const user = useMeiyouStore((st) => st.user);
  const mode = useMeiyouStore((st) => st.mode);
  const cycle = useMeiyouStore((st) => st.cycle);
  const circles = useMeiyouStore((st) => st.circles);
  const joinedCircles = useMeiyouStore((st) => st.joinedCircles);
  const switchMode = useMeiyouStore((st) => st.switchMode);

  const isPrep = mode === 'prep';
  const joined = joinedCircles
    .map((id) => circles.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);

  /** 同组统一 toast(铁律②) */
  const bindMisc = () =>
    bindTap({ kind: 'action', id: 'me.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) });

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      <div className="flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="me-body" data-scroll-direction="vertical">
        {/* 顶部:头像+昵称> + 扫码/礼盒/签到/设置 */}
        <div className="flex items-center pt-2 pb-3">
          <button
            {...bindTap('meiyou.profile-open')}
            className="flex items-center flex-1 min-w-0 bg-transparent border-none cursor-pointer p-0 text-left"
          >
            <Img src={user.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
            <span className="ml-2.5 text-[18px] font-semibold text-[#1A1A1A] truncate">{user.nick}</span>
            <IcArrowRight size={18} className="text-[#999] shrink-0" />
          </button>
          {isPrep && (
            <button
              {...bindMisc()}
              className="shrink-0 mr-1.5 px-2 h-6 rounded-full text-[11px] border-none cursor-pointer flex items-center gap-0.5"
              style={{ background: '#FFE3ED', color: MY.primary }}
            >
              💑 邀请老公
            </button>
          )}
          <button {...bindMisc()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" aria-label="扫码">
            <IcScan size={21} className="text-[#1A1A1A]" />
          </button>
          <button {...bindMisc()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" aria-label="礼盒">
            <IcGift size={21} className="text-[#1A1A1A]" />
          </button>
          <button {...bindMisc()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" aria-label="签到">
            <span className="w-5 h-5 rounded border-2 border-[#1A1A1A] text-[11px] font-bold text-[#1A1A1A] flex items-center justify-center">签</span>
          </button>
          <button {...bindTap('meiyou.settings-open')} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" aria-label={s.settings}>
            <IcSettings size={21} className="text-[#1A1A1A]" />
          </button>
        </div>

        {/* 会员横幅(紫粉渐变) */}
        <div className="relative rounded-2xl overflow-visible" style={{ background: `linear-gradient(105deg, ${MY.memberFrom}, ${MY.memberTo})` }}>
          <span className="absolute -top-2 right-2 px-2 h-5 rounded-full rounded-bl-none text-[10px] text-white flex items-center" style={{ background: '#FF2D2D' }}>
            限时首月9元
          </span>
          <button {...bindMisc()} className="w-full flex items-center px-3 pt-3 pb-2.5 bg-transparent border-none cursor-pointer text-left">
            <span className="text-[16px] font-bold text-white">♥美柚会员</span>
            <span className="ml-2 text-[12px] text-white/85 flex-1 truncate">开通立享12项权益</span>
            <span className="shrink-0 px-3 h-7 rounded-full bg-white text-[13px] font-semibold flex items-center" style={{ color: '#B0289A' }}>
              立即开通
            </span>
          </button>
          <div className="flex px-3 pb-3">
            <button {...bindMisc()} className="flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0">
              <div className="text-[14px] font-bold text-white truncate">
                {isPrep ? '黄金受孕期 ›' : '经期健康度 ›'}
              </div>
              <div className="text-[11px] text-white/80 truncate">
                {isPrep ? '本月排卵日预测已更新' : '本月分析已更新 立即查看'}
              </div>
            </button>
            <div className="w-px bg-white/25 mx-2" />
            <button {...bindMisc()} className="flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0">
              <div className="text-[14px] font-bold text-white truncate">2人拼团低至3.4折 ›</div>
              <div className="text-[11px] text-white/80 truncate">限时加赠30天会员,超划算!</div>
            </button>
          </div>
        </div>

        {/* 学生特惠条 */}
        <button
          {...bindMisc()}
          className="w-full mt-2 h-10 rounded-xl px-3 flex items-center border-none cursor-pointer"
          style={{ background: '#FFEAF2' }}
        >
          <span className="text-[13px]">🎀</span>
          <span className="ml-1.5 text-[13px] font-medium text-[#B0289A] flex-1 text-left truncate">【学生特惠】前6个月6.8元/月</span>
          <span className="text-[12px] text-[#B0289A]/80">去看看 ›</span>
        </button>

        {/* 模式四宫格 */}
        <div className="bg-white rounded-2xl mt-2.5 p-2 grid grid-cols-4 gap-1">
          {/* 经期模式 */}
          {mode === 'period' ? (
            <div className="flex flex-col items-center py-2 rounded-xl" style={{ background: '#FFE9F1' }}>
              <span className="text-[22px]">🩸</span>
              <span className="mt-1 text-[12px] font-bold" style={{ color: MY.primary }}>{s.modePeriod}</span>
              <span className="text-[10px]" style={{ color: MY.primary }}>当前</span>
            </div>
          ) : (
            <button
              {...bindTap({ kind: 'action', id: 'me.mode.period.switch' }, {
                onTrigger: () => { switchMode('period'); showToast('已切换至经期模式'); },
              })}
              className="flex flex-col items-center py-2 rounded-xl bg-transparent border-none cursor-pointer"
            >
              <span className="text-[22px]">🩸</span>
              <span className="mt-1 text-[12px] text-[#666]">{s.modePeriod}</span>
              <span className="text-[10px] text-transparent">·</span>
            </button>
          )}
          {/* 备孕模式(未开启→介绍页;已开启在备孕态即当前) */}
          {mode === 'prep' ? (
            <div className="flex flex-col items-center py-2 rounded-xl" style={{ background: '#F3ECFE' }}>
              <span className="text-[22px]">🧪</span>
              <span className="mt-1 text-[12px] font-bold" style={{ color: MY.ovulation }}>{s.modePrep}</span>
              <span className="text-[10px]" style={{ color: MY.ovulation }}>当前</span>
            </div>
          ) : (
            <button
              {...bindTap('meiyou.prepintro-open')}
              className="flex flex-col items-center py-2 rounded-xl bg-transparent border-none cursor-pointer"
            >
              <span className="text-[22px]">🧪</span>
              <span className="mt-1 text-[12px] text-[#666]">{s.modePrep}</span>
              <span className="text-[10px] text-transparent">·</span>
            </button>
          )}
          {/* 怀孕/育儿(暂未开放) */}
          {([[s.modePregnant, '🤰'], [s.modeParenting, '👶']] as const).map(([label, emoji]) => (
            <button
              key={label}
              {...bindTap({ kind: 'action', id: 'me.mode.disabled' }, { onTrigger: () => showToast(MODE_NOT_OPEN) })}
              className="flex flex-col items-center py-2 rounded-xl bg-transparent border-none cursor-pointer"
            >
              <span className="text-[22px]">{emoji}</span>
              <span className="mt-1 text-[12px] text-[#666]">{label}</span>
              <span className="text-[10px] text-transparent">·</span>
            </button>
          ))}
        </div>

        {/* 经期设置(独立卡) */}
        <button
          {...bindTap('meiyou.cyclesettings-open')}
          className="w-full bg-white rounded-2xl mt-2.5 px-3 py-3 flex items-center border-none cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FFE3ED' }}>
            <IcDrop size={19} style={{ color: MY.primary }} fill={MY.primary} />
          </div>
          <div className="flex-1 min-w-0 ml-2.5">
            <div className="text-[15px] font-semibold text-[#1A1A1A]">{s.cycleSettings}</div>
            <div className="text-[12px] text-[#999] truncate">周期{cycle.cycleLen}天,经期{cycle.periodLen}天</div>
          </div>
          <IcArrowRight size={18} className="text-[#CCC] shrink-0" />
        </button>

        {/* 列表:个人主页/钱包/订单(+宝宝管理 备孕态) */}
        <div className="bg-white rounded-2xl mt-2.5 px-3">
          <button {...bindTap('meiyou.profile-open')} className="w-full h-13 flex items-center border-none bg-transparent cursor-pointer text-left" style={{ height: 52 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FFE3ED' }}>
              <IcUser size={17} style={{ color: MY.primary }} />
            </div>
            <span className="flex-1 ml-2.5 text-[15px] text-[#1A1A1A]">个人主页</span>
            <IcArrowRight size={18} className="text-[#CCC]" />
          </button>
          <button {...bindMisc()} className="w-full flex items-center border-none bg-transparent cursor-pointer text-left border-t border-[#F5F5F7]" style={{ height: 52 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FFF3D9' }}>
              <IcWallet size={17} style={{ color: '#F0B000' }} />
            </div>
            <span className="flex-1 ml-2.5 text-[15px] text-[#1A1A1A]">钱包</span>
            <IcArrowRight size={18} className="text-[#CCC]" />
          </button>
          <button {...bindMisc()} className="w-full flex items-center border-none bg-transparent cursor-pointer text-left border-t border-[#F5F5F7]" style={{ height: 52 }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EDE3FC' }}>
              <IcOrder size={17} style={{ color: MY.ovulation }} />
            </div>
            <span className="flex-1 ml-2.5 text-[15px] text-[#1A1A1A]">订单</span>
            <IcArrowRight size={18} className="text-[#CCC]" />
          </button>
          {isPrep && (
            <button {...bindMisc()} className="w-full flex items-center border-none bg-transparent cursor-pointer text-left border-t border-[#F5F5F7]" style={{ height: 52 }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[16px]" style={{ background: '#D9F4F0' }}>👶</div>
              <span className="flex-1 ml-2.5 text-[15px] text-[#1A1A1A]">宝宝管理</span>
              <IcArrowRight size={18} className="text-[#CCC]" />
            </button>
          )}
        </div>

        {/* 圈子宫格行 */}
        <div className="bg-white rounded-2xl mt-2.5 p-3 grid grid-cols-5 gap-2">
          {isPrep
            ? PREP_CIRCLE_ROW.map((item) => {
                const circle = item.circleId ? circles.find((c) => c.id === item.circleId) : undefined;
                return circle ? (
                  <button
                    key={item.name}
                    {...bindTap('meiyou.circle-open', { params: { id: circle.id } })}
                    className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <Img src={circle.icon} className="w-11 h-11 rounded-full object-cover" alt="" />
                    <span className="text-[11px] text-[#333] leading-tight text-center">{circle.name}</span>
                  </button>
                ) : (
                  <button key={item.name} {...bindMisc()} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-[18px]" style={{ background: 'bg' in item ? item.bg : '#F5F5F7' }}>
                      {'emoji' in item ? item.emoji : '🌸'}
                    </div>
                    <span className="text-[11px] text-[#333] leading-tight text-center">{item.name}</span>
                  </button>
                );
              })
            : joined.map((c) => (
                <button
                  key={c.id}
                  {...bindTap('meiyou.circle-open', { params: { id: c.id } })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <Img src={c.icon} className="w-11 h-11 rounded-full object-cover" alt="" />
                  <span className="text-[11px] text-[#333] leading-tight text-center">{c.name}</span>
                </button>
              ))}
          <button {...bindMisc()} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <div className="w-11 h-11 rounded-full flex items-center justify-center border-2" style={{ borderColor: MY.primary }}>
              <span className="text-[18px]">🌸</span>
            </div>
            <span className="text-[11px] text-[#333] leading-tight text-center">更多圈子</span>
          </button>
        </div>

        {/* 服务宫格行(铁律②:同组全部统一 toast) */}
        <div className="bg-white rounded-2xl mt-2.5 p-3 grid grid-cols-5 gap-2">
          {SERVICES.map((sv) => (
            <button key={sv.name} {...bindMisc()} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer relative">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[18px]" style={{ background: sv.bg }}>
                {sv.emoji}
              </div>
              {'ad' in sv && sv.ad && (
                <span className="absolute top-8 left-1/2 -translate-x-1/2 px-0.5 text-[8px] leading-3 rounded-sm bg-black/30 text-white">广告</span>
              )}
              <span className="text-[11px] text-[#333] leading-tight text-center">{sv.name}</span>
            </button>
          ))}
        </div>

        {/* 2x2 功能卡 */}
        <div className="bg-white rounded-2xl mt-2.5 p-1.5 grid grid-cols-2">
          {FEATURE_CARDS.map((f, i) => (
            <button
              key={f.title}
              {...bindMisc()}
              className={`flex items-center px-2.5 py-3 bg-transparent border-none cursor-pointer text-left ${i % 2 === 1 ? 'border-l border-[#F5F5F7]' : ''} ${i >= 2 ? 'border-t border-[#F5F5F7]' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-[#1A1A1A]">{f.title}</div>
                <div className="text-[11px] text-[#999] truncate">{f.sub}</div>
              </div>
              <span className="text-[24px] shrink-0">{f.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {toast}
    </div>
  );
}
