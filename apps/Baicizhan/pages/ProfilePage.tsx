import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, Row } from '../components/common';
import { IcMail, IcSettings, IcBolt } from '../res/icons';

const DEVICES = ['单词机Lite', '单词机Max', '扫学机', '超级单词机', '词典笔Lite'];

export default function ProfilePage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const p = st.profile;
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F2F5FA]" data-status-bar-foreground="dark">
      <PageHeader right={<>
        <button {...action('profile.msg.wontfixToast', toast)} className="relative"><IcMail size={22} color="#33405C" /><span className="absolute -right-1 -top-1 rounded-full bg-[#FF4D4F] px-1 text-[9px] text-white">14</span></button>
        <button {...action('profile.scan.wontfixToast', toast)}>▣</button>
        <button {...bindTap('profile.settings.open')} className="relative"><IcSettings size={22} color="#33405C" /><span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[#FF4D4F]" /></button>
      </>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow">🐶</div>
          <div className="ml-3">
            <div className="text-lg font-bold text-[#212121]">{p.name}</div>
            <button {...bindTap('profile.identity.edit')} className="mt-0.5 text-xs text-[#9AA5B1]">BczID: {p.bczId} · {st.settings.identity} ›</button>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button {...bindTap('profile.listen.vocab', { params: { mode: 'listen' } })} className="flex-1 rounded-xl bg-white px-3 py-3 text-left">
            <div className="text-xs text-[#9AA5B1]">听力词汇量 ›</div><div className="text-lg font-bold text-[#212121]">{p.listenVocab}</div>
          </button>
          <button {...bindTap('profile.read.vocab', { params: { mode: 'read' } })} className="flex-1 rounded-xl bg-white px-3 py-3 text-left">
            <div className="text-xs text-[#9AA5B1]">阅读词汇量 ›</div><div className="text-lg font-bold text-[#212121]">{p.readVocab}</div>
          </button>
        </div>

        <div className="mt-3 flex gap-3 rounded-2xl bg-white p-4">
          {[[<IcBolt key="b" size={22} color="#8B5CF6" />, st.streakDays, '不断电学习'], ['📅', 21, '累计学习'], ['📚', p.learnedCount, '已学单词']].map((c, i) => (
            <div key={i} className="flex flex-1 flex-col items-center">
              <div className="text-xl">{c[0]}</div>
              <div className="mt-1 text-base font-bold text-[#212121]">{c[1]}{i < 2 ? ' 天' : ' 个'}</div>
              <div className="text-[10px] text-[#9AA5B1]">{c[2]}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-sm font-semibold text-[#212121]">我的学习设备</div>
          <div className="mt-3 flex justify-between">
            {DEVICES.map((d) => (
              <button key={d} {...action('profile.device.wontfixToast', toast)} className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FA] text-lg">📟</div>
                <span className="w-12 text-center text-[9px] text-[#9AA5B1]">{d}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl">
          <Row label="我的学习" bind={action('profile.menu.wontfixToast', toast)} />
          <Row label="我的账户" bind={bindTap('profile.wallet.open')} />
          <Row label="我的图书" bind={bindTap('profile.books.open')} />
          <Row label="我的日历" bind={action('profile.menu.wontfixToast', toast)} />
          <Row label="帮助与反馈" bind={bindTap('profile.help.open')} />
          <Row label={s.myCollect} bind={bindTap('profile.collect.open')} />
        </div>
        <div className="h-2" style={{ background: colors.homeBg }} />
      </div>
    </div>
  );
}
