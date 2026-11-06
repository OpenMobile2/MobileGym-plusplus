import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, PrimaryBtn, useToast, BottomSheet, usePanel } from '../components/ui';

/** 接送机：关联未出行机票订单；无订单时给示例航班可选。 */
export default function CarPickupPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const { value: panel, open, close } = usePanel();
  const [tab, setTab] = React.useState('arrival');
  const [place, setPlace] = React.useState('人民广场酒店');
  const places = ['人民广场酒店', '陆家嘴金融城', '徐家汇商圈', '虹桥火车站', '上海迪士尼度假区', '杭州西湖景区'];
  const orders = useCtripStore((st) => st.orders);
  const flightOrders = orders.filter((o) => o.category === 'flight' && (o.status === 'upcoming' || o.status === 'unpaid'));
  const fallbackFlights = [
    { id: 'demo_ho1167', title: 'HO1167 · 长春→无锡', subtitle: '08:40 抵达' },
    { id: 'demo_mu5132', title: 'MU5132 · 上海→北京', subtitle: '14:20 起飞' },
  ];
  const options = flightOrders.length > 0
    ? flightOrders.map((o) => ({ id: o.id, title: o.title, subtitle: o.subtitle || o.date }))
    : fallbackFlights;
  const [flightId, setFlightId] = React.useState(options[0]?.id || '');
  const selected = options.find((f) => f.id === flightId) || options[0];

  React.useEffect(() => {
    if (options[0] && !options.some((o) => o.id === flightId)) {
      setFlightId(options[0].id);
    }
  }, [options, flightId]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('接送机')} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white flex px-2">
          {[{ id: 'arrival', label: '去机场接您' }, { id: 'departure', label: s.t('送机') }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold border-b-2 border-[#0086F6]' : 'text-[#666666]'}`}>{t.label}</button>
          ))}
        </div>
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="py-2 border-b border-[#F2F2F2]">
            <div className="text-[13px] text-[#999999] mb-2">{s.t('关联航班')}</div>
            <div className="space-y-2">
              {options.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlightId(f.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border cursor-pointer ${flightId === f.id ? 'border-[#0086F6] bg-[#EAF4FF]' : 'border-[#EEEEEE] bg-white'}`}
                >
                  <div className="text-[15px] font-semibold">{f.title}</div>
                  <div className="text-[12px] text-[#999] mt-0.5">{f.subtitle}</div>
                </button>
              ))}
            </div>
            {flightOrders.length === 0 && (
              <div className="text-[11px] text-[#999] mt-2">{s.t('暂无机票订单，已展示示例航班；预订机票后可在此关联')}</div>
            )}
          </div>
          <button type="button" onClick={() => open('place')} className="flex w-full items-center justify-between border-x-0 border-t-0 border-b border-[#F2F2F2] bg-transparent py-3 text-left">
            <div className="text-[13px] text-[#999999]">{tab === 'arrival' ? s.t('目的地') : s.t('出发地')}</div>
            <div className="text-[16px] font-semibold">{place} ›</div>
          </button>
          <PrimaryBtn
            binding={bindTap({ kind: 'action', id: 'carPickup.query.wontfix' }, {
              onTrigger: () => showToast(selected ? `已为「${selected.title}」查询接送车` : s.t('请选择航班')),
            })}
            className="w-full mt-3"
          >{s.t('查询')}</PrimaryBtn>
        </div>
      </div>
      {panel === 'place' && (
        <BottomSheet title={tab === 'arrival' ? s.t('选择目的地') : s.t('选择出发地')} onClose={close}>
          <div className="p-2">
            {places.map((item) => (
              <button key={item} type="button" onClick={() => { setPlace(item); close(); }} className="flex w-full items-center justify-between border-x-0 border-t-0 border-b border-[#F2F2F2] bg-transparent px-3 py-3 text-left text-[14px]">
                <span>{item}</span><span className={place === item ? 'text-[#0086F6]' : 'text-[#CCC]'}>{place === item ? '✓' : '›'}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
