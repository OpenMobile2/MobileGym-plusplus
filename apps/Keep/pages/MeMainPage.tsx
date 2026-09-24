import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import {
  IcMenu, IcWatch, IcScan, IcBell, IcArrowRight, IcZap, IcMedal, IcCheck,
  IcFlame, IcTimer, IcPlay, IcTrophy, IcWallet, IcCoins, IcFootprints,
  IcDumbbell, IcScale, IcRuler, IcCircle, IcUtensils, IcMoon, IcRefresh,
  IcActivity, IcBike, IcPerson, IcTabSport,
} from '../res/icons';

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(ss)}`;
}

/** 我的 tab（全部数据/运动记录）—— 节点 me.main（证据 s083-s089/recF/recG） */
export default function MeMainPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const user = useKeepStore((st) => st.user);
  const plans = useKeepStore((st) => st.plans);
  const quiz = useKeepStore((st) => st.quiz);
  const steps = useKeepStore((st) => st.steps);
  const wallet = useKeepStore((st) => st.wallet);
  const runRecords = useKeepStore((st) => st.runRecords);
  const messages = useKeepStore((st) => st.messages);
  const uploadRunRecord = useKeepStore((st) => st.uploadRunRecord);

  const tab = searchParams.get('tab') === 'records' ? 'records' : 'all';
  useEffect(() => {
    if (searchParams.has('tab')) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('tab', 'all');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);
  const pending = runRecords.find((r) => !r.uploaded) ?? null;
  const uploadedRecords = runRecords.filter((r) => r.uploaded);
  const indoorRunKm = runRecords
    .filter((record) => record.type.includes('室内') && record.km != null)
    .reduce((sum, record) => sum + (record.km ?? 0), 0);
  const outdoorRunKm = Math.max(0, user.totalRunKm - indoorRunKm);
  const hasUnread = messages.threads.some((t) => t.unread > 0);
  const bannerPlan = plans.find((p) => p.id === (quiz.generatedPlanId ?? 'p_bigweight')) ?? plans[0];

  // 上传三态:待上传 → 正在上传… → ✓上传完成(store 写回,总运动实时累加)
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const uploadTimer = useRef<number | null>(null);
  useEffect(() => () => {
    if (uploadTimer.current) window.clearTimeout(uploadTimer.current);
  }, []);
  const startUpload = () => {
    if (uploading || !pending) return;
    setUploading(true);
    uploadTimer.current = window.setTimeout(() => {
      uploadRunRecord(pending.id);
      setUploading(false);
      setUploadDone(true);
    }, 1200);
  };

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const RecordTypeIcon = ({ type }: { type: string }) => {
    const cls = 'text-app-text';
    if (type.includes('跑')) return <IcFootprints size={18} className={cls} />;
    if (type.includes('行走')) return <IcPerson size={18} className={cls} />;
    if (type.includes('骑')) return <IcBike size={18} className={cls} />;
    return <IcTabSport size={18} className={cls} />;
  };

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      {/* 顶栏:抽屉 / 手表 / 扫码 / 消息 */}
      <div className="flex items-center px-4 h-12 shrink-0">
        <button {...bindTap('me.drawer.open')} className="p-1.5 bg-transparent border-none text-app-text -ml-1.5">
          <IcMenu size={22} />
        </button>
        <div className="flex-1" />
        <button {...wontfix('me.main.watch.wontfix')} className="p-1.5 bg-transparent border-none text-app-text">
          <IcWatch size={20} />
        </button>
        <button {...wontfix('me.main.scan.wontfix')} className="p-1.5 bg-transparent border-none text-app-text">
          <IcScan size={20} />
        </button>
        <button {...bindTap('messages.center.open')} className="p-1.5 bg-transparent border-none text-app-text relative">
          <IcBell size={20} />
          {hasUnread && (
            <span
              className="absolute -top-0.5 -right-1 px-1 rounded-full text-[9px] text-white leading-4"
              style={{ background: C.red }}
            >
              99+
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 用户资料行 */}
        <div className="px-4">
          <button
            {...bindTap('me.profile.open')}
            className="flex items-center gap-3 w-full bg-transparent border-none p-0 text-left"
          >
            <Img id={user.avatar} className="w-16 h-16 rounded-full object-cover shrink-0" alt={user.nickname} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[20px] font-bold text-app-text truncate">{user.nickname}</span>
                <IcArrowRight size={16} className="text-app-text-muted shrink-0" />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2 mt-2 text-[13px] text-app-text">
            <button
              {...bindTap('me.following.open.fromMain')}
              className="bg-transparent border-none p-0 text-[13px] text-app-text"
            >
              关注 {user.following}
            </button>
            <span className="text-app-text-muted">|</span>
            <button {...wontfix('me.main.social.wontfix')} className="bg-transparent border-none p-0 text-[13px] text-app-text">粉丝 {user.followers}</button>
            <span className="text-app-text-muted">|</span>
            <button {...wontfix('me.main.social.wontfix')} className="bg-transparent border-none p-0 text-[13px] text-app-text">加油 {user.cheers}</button>
          </div>
          {/* 胶囊行 */}
          <div className="flex gap-2 mt-3 overflow-x-auto" data-scroll-container="capsules" data-scroll-direction="horizontal">
            <button
              {...wontfix('me.main.streak.wontfix')}
              className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full bg-app-surface border border-app-border text-[12px] text-app-text"
            >
              <IcZap size={13} /> 激励连动1天
            </button>
            <button
              {...wontfix('me.main.kg.wontfix')}
              className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full bg-app-surface border border-app-border text-[12px] text-app-text"
            >
              KG {user.kgLevel} <span className="w-8 h-0.5 rounded-full bg-gray-200 inline-block" />
            </button>
            <button
              {...wontfix('me.main.badge.wontfix')}
              className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full bg-app-surface border border-app-border text-[12px] text-app-text"
            >
              <IcMedal size={13} /> 24 <span style={{ color: C.purple }}>新挑战</span>
            </button>
          </div>
        </div>

        {/* 会员banner */}
        <button
          {...bindTap('member.center.open.fromMeBanner')}
          className="mx-4 mt-3 rounded-2xl border-none text-left overflow-hidden p-0 w-[calc(100%-32px)]"
          style={{ background: 'linear-gradient(100deg, #241F30 0%, #3A2E4E 70%, #52407038 100%), #241F30' }}
        >
          <div className="flex items-center px-4 pt-3">
            <span className="text-[14px] font-semibold" style={{ color: '#E8D2A8' }}>keep · 会员</span>
            <div className="flex-1" />
            <span
              className="px-3 py-1 rounded-full text-[12px] font-medium"
              style={{ background: 'linear-gradient(90deg,#F0D9AC,#D8B173)', color: '#3A2E15' }}
            >
              立即续费 ▸
            </span>
          </div>
          <div className="flex px-4 pt-2 pb-3">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white truncate">{bannerPlan.title} ›</div>
              <div className="text-[11px] text-white/50 mt-0.5">畅快流汗 从容瘦全身</div>
            </div>
            <div className="flex-1 min-w-0 border-l border-white/10 pl-3">
              <div className="text-[13px] text-white truncate">送 24 个月会员 ›</div>
              <div className="text-[11px] text-white/50 mt-0.5">额外享每月50GB流量</div>
            </div>
          </div>
        </button>

        {/* 四入口 */}
        <div className="mx-4 mt-3 rounded-2xl bg-app-surface flex py-4">
          {[
            { label: '我的课程', icon: <IcPlay size={20} /> },
            { label: '我的活动', icon: <IcTrophy size={20} /> },
            { label: '我的饮食', icon: <IcFlame size={20} /> },
            { label: '订单与钱包', icon: <IcWallet size={20} /> },
          ].map((e) => (
            <button
              key={e.label}
              {...(e.label === '我的课程'
                ? bindTap('schedule.mycourses.open.fromMe')
                : e.label === '订单与钱包'
                  ? bindTap('wallet.home.open')
                  : e.label === '我的活动'
                    ? wontfix('me.main.activity.wontfix')
                    : wontfix('me.main.diet.wontfix'))}
              className="flex-1 flex flex-col items-center gap-1.5 bg-transparent border-none text-app-text"
            >
              {e.icon}
              <span className="text-[12px]">{e.label}</span>
            </button>
          ))}
        </div>

        {/* 数据区 tab */}
        <div className="flex items-center px-4 mt-5 gap-6">
          <button {...wontfix('me.main.aitab.wontfix')} className="bg-transparent border-none p-0 text-[15px] text-app-text-muted">
            {s.dataOverview} <span className="text-[10px]" style={{ color: C.purple }}>AI Beta</span>
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'me.main.datatab.switch' },
              {
                params: { tab: 'all' },
                onTrigger: () => setSearchParams((p) => { p.set('tab', 'all'); return p; }, { replace: true }),
              },
            )}
            className="bg-transparent border-none p-0 relative pb-1.5"
          >
            <span className="text-[16px]" style={{ color: tab === 'all' ? '#1A1A1A' : '#9AA0A8', fontWeight: tab === 'all' ? 700 : 400 }}>
              {s.allData}
            </span>
            {tab === 'all' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full" style={{ background: C.dark }} />}
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'me.main.datatab.switch' },
              {
                params: { tab: 'records' },
                onTrigger: () => setSearchParams((p) => { p.set('tab', 'records'); return p; }, { replace: true }),
              },
            )}
            className="bg-transparent border-none p-0 relative pb-1.5"
          >
            <span className="text-[16px]" style={{ color: tab === 'records' ? '#1A1A1A' : '#9AA0A8', fontWeight: tab === 'records' ? 700 : 400 }}>
              {s.sportRecords}
            </span>
            {pending && (
              <span className="absolute -top-2 -right-6 px-1.5 py-0.5 rounded-md rounded-bl-none text-[9px] text-white" style={{ background: '#F8586C' }}>
                {s.pendingUpload}
              </span>
            )}
            {tab === 'records' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full" style={{ background: C.dark }} />}
          </button>
        </div>

        {tab === 'all' ? (
          <div className="px-4 pb-6">
            {/* 总运动 + 运动币 */}
            <div className="mt-3 rounded-2xl bg-app-surface px-4 pt-4 pb-4">
              <div className="flex items-start">
                <button
                  {...bindTap('records.hub.open')}
                  className="bg-transparent border-none p-0 text-left flex-1"
                >
                  <div className="flex items-center gap-1 text-[13px]" style={{ color: C.purple }}>
                    <IcZap size={14} /> 总运动
                  </div>
                  <div className="text-[34px] font-bold text-app-text leading-tight mt-1">
                    {user.totalMinutes} <span className="text-[13px] font-normal">分钟</span>
                    <IcArrowRight size={16} className="inline text-app-text-muted ml-1" />
                  </div>
                </button>
                <button
                  {...wontfix('me.main.coin.wontfix')}
                  className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full border-none text-[12px]"
                  style={{ background: '#FBF3E4', color: '#9A7B41' }}
                >
                  <IcCoins size={13} /> 运动币 {wallet.coins.toLocaleString()} <IcArrowRight size={12} />
                </button>
              </div>
              <div className="flex gap-2.5 mt-3">
                <div className="flex-1 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-app-bg text-[12px] text-app-text">
                  <IcTimer size={14} className="text-app-text-muted" /> 今日无运动
                </div>
                <button
                  {...bindTap('steps.detail.open')}
                  className="flex-1 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-app-bg border-none text-[12px] text-app-text"
                >
                  <IcFootprints size={14} className="text-app-text-muted" /> 今日 {steps.today} 步
                  <IcArrowRight size={12} className="text-app-text-muted ml-auto" />
                </button>
              </div>
              {/* 跑步里程三卡(同组 wontfix) */}
              <div className="flex gap-2.5 mt-2.5">
                {[
                  { label: '总跑步', v: user.totalRunKm },
                  { label: '户外跑步', v: outdoorRunKm },
                  { label: '室内跑步', v: indoorRunKm },
                ].map((it) => (
                  <button
                    key={it.label}
                    {...wontfix('me.main.runstat.wontfix')}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-app-bg border-none text-left"
                  >
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: C.greenDeep }}>
                      <IcFootprints size={12} /> {it.label}
                    </div>
                    <div className="text-[16px] font-bold text-app-text mt-0.5">
                      {it.v.toFixed(2)} <span className="text-[10px] font-normal text-app-text-muted">公里</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 能力/状态卡(同组 wontfix) */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { label: '运动状态', v: '状态稳定', tint: C.purple, Icon: IcActivity },
                { label: '本周热量缺口', v: '-- 千卡', tint: C.orange, Icon: IcFlame },
                { label: '跑步能力', v: '58.4 稳定', tint: C.greenDeep, Icon: IcFootprints },
                { label: '肌肉能力', v: '数据不足', tint: C.purple, Icon: IcDumbbell },
              ].map((it) => (
                <button
                  key={it.label}
                  {...wontfix('me.main.ability.wontfix')}
                  className="rounded-2xl bg-app-surface border-none px-4 py-4 text-left"
                >
                  <div className="flex items-center gap-1 text-[12px]" style={{ color: it.tint }}>
                    <it.Icon size={13} /> {it.label}
                  </div>
                  <div className="text-[18px] font-bold text-app-text mt-1.5">{it.v}</div>
                </button>
              ))}
            </div>

            {/* 身体数据 */}
            <div className="text-[13px] text-app-text-muted mt-4 mb-2">身体数据</div>
            <div className="grid grid-cols-2 gap-3">
              <button
                {...bindTap('weight.entry.open')}
                className="rounded-2xl bg-app-surface border-none px-4 py-4 text-left"
              >
                <div className="flex items-center gap-1 text-[12px]" style={{ color: C.greenDeep }}>
                  <IcScale size={13} /> 体重
                </div>
                <div className="text-[18px] font-bold text-app-text mt-1.5">
                  {user.weightKg.toFixed(1)} <span className="text-[11px] font-normal text-app-text-muted">公斤</span>
                </div>
              </button>
              {[
                { label: 'BMI', v: String(user.bmi), Icon: IcScale },
                { label: '体脂率', v: '-- %', Icon: IcRuler },
                { label: '身高', v: `${user.heightCm}.0 厘米`, Icon: IcRuler },
              ].map((it) => (
                <button
                  key={it.label + it.v}
                  {...wontfix('me.main.bodydata.wontfix')}
                  className="rounded-2xl bg-app-surface border-none px-4 py-4 text-left"
                >
                  <div className="flex items-center gap-1 text-[12px]" style={{ color: C.greenDeep }}>
                    <it.Icon size={13} /> {it.label}
                  </div>
                  <div className="text-[18px] font-bold text-app-text mt-1.5">{it.v}</div>
                </button>
              ))}
            </div>

            {/* 围度 / 健康数据(同组 wontfix) */}
            <div className="text-[13px] text-app-text-muted mt-4 mb-2">围度与健康数据</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '腰围', v: '-- 厘米', Icon: IcCircle },
                { label: '臀围', v: '-- 厘米', Icon: IcCircle },
                { label: '饮食', v: '0 千卡', Icon: IcUtensils },
                { label: '睡眠', v: '--', Icon: IcMoon },
              ].map((it) => (
                <button
                  key={it.label}
                  {...wontfix('me.main.healthdata.wontfix')}
                  className="rounded-2xl bg-app-surface border-none px-4 py-4 text-left"
                >
                  <div className="flex items-center gap-1 text-[12px]" style={{ color: C.orange }}>
                    <it.Icon size={13} /> {it.label}
                  </div>
                  <div className="text-[18px] font-bold text-app-text mt-1.5">{it.v}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-6">
            {/* 运动数据同步卡 */}
            <div className="mt-3 rounded-2xl bg-app-surface px-4 pt-4 pb-4">
              <button
                {...bindTap('records.sync.open.fromMe')}
                className="flex items-center w-full bg-transparent border-none p-0"
              >
                <span className="flex items-center gap-1.5 text-[14px] font-medium text-app-text">
                  <IcRefresh size={15} /> {s.recordsSync}
                </span>
                <div className="flex-1" />
                <IcArrowRight size={16} className="text-app-text-muted" />
              </button>
              {pending ? (
                <>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[18px]" style={{ background: '#B8BCC6' }}>
                      <IcZap size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-app-text">
                        {pending.type} {pending.km != null ? `${pending.km.toFixed(2)} 公里` : ''}
                      </div>
                      <div className="text-[12px] text-app-text-muted mt-0.5">
                        用时 {fmtDuration(pending.durationSec)} 消耗 {pending.kcal} 千卡
                      </div>
                    </div>
                    <span className="text-[12px] text-app-text-muted shrink-0">
                      {Number(pending.date.slice(5, 7))} 月 {Number(pending.date.slice(8))} 日
                    </span>
                  </div>
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'me.main.record.upload' },
                      { onTrigger: startUpload },
                    )}
                    disabled={uploading}
                    className="w-full mt-3 py-3 rounded-full border-none text-white text-[15px] font-medium"
                    style={{ background: uploading ? '#A8E8CF' : C.green }}
                  >
                    {uploading ? s.uploading : s.uploadSportRecord}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center gap-1.5 w-full mt-3 py-3 rounded-full border border-app-border bg-transparent text-[15px] disabled:cursor-default disabled:opacity-70"
                  style={{ color: C.greenDeep }}
                >
                  <IcCheck size={16} /> {uploadDone ? s.uploadComplete : s.noPendingRecords}
                </button>
              )}
            </div>

            {/* 最新记录 */}
            <div className="mt-3 rounded-2xl bg-app-surface px-4 py-2">
              <div className="text-[13px] text-app-text-muted pt-2 pb-1">{s.latestRecords}</div>
              {uploadedRecords.map((r, i) => (
                <button
                  key={r.id}
                  {...bindTap('record.detail.open.fromMe', {
                    params: { recordId: r.id },
                    beforeTrigger: () => setCurrent('recordId', r.id),
                  })}
                  className={`flex items-center gap-3 w-full bg-transparent border-none p-0 py-3 text-left ${
                    i < uploadedRecords.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                >
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: r.type.includes('跑') ? '#DDF5EA' : '#EFEAFB' }}
                  >
                    <RecordTypeIcon type={r.type} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-medium text-app-text">
                      {r.name}{r.km != null ? ` ${r.km.toFixed(2)} 公里` : ''}
                      {r.source !== 'Keep' && (
                        <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] align-middle" style={{ background: '#F0F3F7', color: '#8A8F99' }}>
                          {r.source}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-app-text-muted mt-0.5">
                      用时 {fmtDuration(r.durationSec)} 消耗 {r.kcal} 千卡
                    </div>
                  </div>
                  <span className="text-[12px] text-app-text-muted shrink-0">
                    {Number(r.date.slice(5, 7))}月{Number(r.date.slice(8))}日
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="h-2" />
      </div>
    </div>
  );
}
