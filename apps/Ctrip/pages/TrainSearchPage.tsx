import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { Img, PrimaryBtn, BottomSheet, usePanel, Switch, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';
import { IconRenderer } from '../res/icons';

/** 火车票搜索(spec train.search)。城市/日期弹层;学生票开关(Q9);查询→list;出行百宝箱wontfix。 */
const TABS = [{ id: 'flight', label: '机票' }, { id: 'train', label: '火车票' }, { id: 'bus', label: '汽车' }, { id: 'boat', label: '船票' }];

export default function TrainSearchPage() {
  const { bindTap, bindBack } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const [from, setFrom] = React.useState('上海');
  const [to, setTo] = React.useState('潍坊');
  const [student, setStudent] = React.useState(true);
  const [highspeed, setHighspeed] = React.useState(false);

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative h-[176px] overflow-hidden bg-[#087DCF]">
          <Img src="/@app-assets/Ctrip/gen/banner_train.png" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0074C8]/70 via-transparent to-transparent" />
          <button {...bindBack()} className="absolute left-3 top-4 h-9 w-9 rounded-full border-none bg-black/20 text-[28px] text-white">‹</button>
          <div className="absolute left-7 top-[52px] text-white drop-shadow">
            <div className="text-[25px] font-black italic">夏日列车行</div>
            <div className="text-[20px] font-black italic text-[#FFF55C]">人生体验卡解锁中</div>
            <div className="mt-1 inline-block rounded bg-[#1589DF]/90 px-2 py-1 text-[12px]">抽 ¥300 火车免单</div>
          </div>
        </div>

        <div className="relative -mt-4 overflow-hidden rounded-t-[18px] bg-white">
          <div className="flex px-2">
            {TABS.map((t) => (
              <div key={t.id} className={`flex-1 text-center py-3 text-[15px] ${t.id === 'train' ? 'text-[#0086F6] font-bold border-b-[3px] border-[#0086F6]' : 'text-[#222]'}`}>
                {t.id === 'train' ? '国内·国际火车' : t.label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white mx-2 rounded-b-xl p-3">
          <div className="mb-3 flex rounded-lg bg-[#F2F4F7] p-1 text-center text-[13px]">
            <span className="flex-1 rounded-md bg-white py-1.5 font-semibold shadow-sm">单程</span>
            <span className="flex-1 py-1.5 text-[#555]">往返</span>
          </div>
          <div className="flex items-center">
            <button {...bindTap({ kind: 'action', id: 'trainSearch.city.open' }, { onTrigger: () => open('city') })} className="flex-1 text-left bg-transparent border-none cursor-pointer">
              <div className="text-[25px] font-bold">{from}</div>
            </button>
            <button onClick={swap} className="w-9 h-9 rounded-full bg-[#F2F4F7] border-none cursor-pointer text-[#0086F6]">⇄</button>
            <button {...bindTap({ kind: 'action', id: 'trainSearch.city.open' }, { onTrigger: () => open('city') })} className="flex-1 text-right bg-transparent border-none cursor-pointer">
              <div className="text-[25px] font-bold">{to}站</div>
            </button>
          </div>

          <button {...bindTap({ kind: 'action', id: 'trainSearch.date.open' }, { onTrigger: () => open('date') })} className="w-full flex items-center justify-between py-3 mt-2 border-t border-[#F2F2F2] bg-transparent border-x-0 border-b-0 cursor-pointer">
            <span className="text-[23px] font-bold">7月1日 <span className="text-[12px] font-normal">明天</span></span>
          </button>

          <div className="flex items-center justify-between py-2 border-t border-[#F2F2F2]">
            <span className="text-[14px] text-[#333333]">学生票</span>
            <Switch on={student} onToggle={() => setStudent((v) => !v)} binding={bindTap({ kind: 'action', id: 'trainSearch.student.toggle' }, { onTrigger: () => setStudent((v) => !v) })} />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[14px] text-[#333333]">只看高铁/动车</span>
            <Switch on={highspeed} onToggle={() => setHighspeed((v) => !v)} />
          </div>

          <PrimaryBtn binding={bindTap('trainSearch.query')} className={`w-full mt-3 h-12 text-[18px] ${student ? '!bg-gradient-to-r !from-[#12C97A] !to-[#05B967]' : ''}`}>
            {student ? '学生票查询' : '查询'}
          </PrimaryBtn>
        </div>

        <div className="mx-2 mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-[#EEFFF5] to-[#F9FFF1] px-3 py-3">
          <div><div className="text-[16px] font-bold">携程学生 <span className="text-[#FF7136]">享三重特权</span></div><div className="mt-1 text-[11px] text-[#27885E]">安心退改 · 专属方案 · 提前兑现</div></div>
          <button {...bindTap({ kind: 'action', id: 'trainSearch.toolbox.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="rounded-lg border-none bg-[#12C778] px-3 py-2 text-[12px] text-white">去领取</button>
        </div>

        {/* 出行百宝箱 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111111] mb-2">出行百宝箱</div>
          <div className="grid grid-cols-4 gap-y-3">
            {[
              ['抢票', 'IcTicket'], ['换座', 'IcTrain'], ['订汽车', 'IcCar'], ['时刻表', 'IcTabTrip'],
            ].map(([t, icon]) => (
              <button key={t} {...bindTap({ kind: 'action', id: 'trainSearch.toolbox.wontfix' }, { params: { t }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <span className="w-9 h-9 rounded-full bg-[#EAF4FF] text-[#0086F6] flex items-center justify-center">
                  <IconRenderer name={icon} size={17} />
                </span>
                <span className="text-[12px] text-[#555555]">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div data-hide-on-keyboard className="grid h-[52px] shrink-0 grid-cols-5 border-t border-[#EEE] bg-white text-center text-[9px] text-[#555]">
        {['抢票', '在线换座', '福利中心', '行程/订单', '个人中心'].map((item) => (
          <button key={item} {...bindTap({ kind: 'action', id: 'trainSearch.toolbox.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="border-none bg-white py-1">
            <div className="text-[16px]">▣</div>{item}
          </button>
        ))}
      </div>

      {(panel === 'city' || panel === 'date') && (
        <BottomSheet title={panel === 'city' ? '选择城市' : '选择日期'} onClose={close}>
          <div className="p-4">
            {panel === 'city' ? (
              <div className="flex flex-wrap gap-2">
                {['上海', '北京', '潍坊', '杭州', '南京', '济南', '青岛'].map((c) => (
                  <button key={c} onClick={close} className="bg-[#F2F4F7] rounded-full px-4 py-1.5 text-[13px] border-none cursor-pointer">{c}</button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button key={d} onClick={close} className={`py-2 rounded border-none cursor-pointer ${d === 5 ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333333]'}`}>{d}</button>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
