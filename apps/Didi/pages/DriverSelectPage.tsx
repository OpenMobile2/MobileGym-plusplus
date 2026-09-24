import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, CheckCircle, C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';

/** 代驾车型选择(浏览版) —— 证据 s29 */

interface DriverType {
  id: string;
  name: string;
  desc: string;
  price: number;
  priceLabel: string; // 预估 / 一口价
  coupon?: number;
  tag?: string;
  hot?: boolean;
}

const TYPES: DriverType[] = [
  { id: 'dd', name: '滴滴代驾', desc: '品质服务 更省心', price: 92.4, priceLabel: '预估', coupon: 19.8, tag: '3秒应答', hot: true },
  { id: 'tk', name: '滴滴特快', desc: '极速接驾 少等待', price: 142, priceLabel: '一口价', hot: true },
  { id: 'xj', name: '新桔代驾', desc: '超低价格 巨省钱', price: 44.77, priceLabel: '一口价', coupon: 39.6 },
  { id: 'th', name: '特惠代驾', desc: '经济划算 更实惠', price: 62.94, priceLabel: '一口价', coupon: 41.2, tag: '特惠' },
  { id: 'qm', name: '球迷专属代驾', desc: '球赛散场 超快接驾', price: 145.2, priceLabel: '一口价', tag: '极速应答' },
  { id: 'xx', name: '星享代驾', desc: '五星司机 尊享服务', price: 182, priceLabel: '预估' },
];

export default function DriverSelectPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(['dd', 'th']));

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pickedNames = TYPES.filter((t) => picked.has(t.id)).map((t) => t.name);

  const renderRow = (t: DriverType) => (
    <button
      key={t.id}
      {...bindTap({ kind: 'action', id: 'driver.select.type.toggle' }, { onTrigger: () => togglePick(t.id) })}
      className={`flex items-center w-full px-3 py-3 text-left rounded-xl border ${
        picked.has(t.id) ? 'border-transparent' : 'border-transparent'
      }`}
      style={{ background: picked.has(t.id) ? '#EFF6FF' : '#fff' }}
    >
      <span className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] mr-2.5 shrink-0" style={{ background: '#FFF1E6' }}>
        🧑‍✈️
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[16px] font-semibold text-app-text">{t.name}</span>
          {t.tag && (
            <span
              className="text-[10px] px-1 py-0.5 rounded"
              style={t.tag === '特惠'
                ? { background: C.red, color: '#fff' }
                : { background: '#FFF1E6', color: C.orangeDeep, border: `1px solid ${C.orange}` }}
            >
              {t.tag}
            </span>
          )}
        </span>
        <span className="block text-[12px] text-app-text-muted mt-0.5 truncate">{t.desc}</span>
      </span>
      <span className="flex flex-col items-end mr-2.5 shrink-0">
        <span className="text-[12px] text-app-text-muted">
          {t.priceLabel}
          <span className="text-[18px] font-bold ml-0.5" style={{ color: C.dark }}>{t.price}</span>
          <span className="text-[12px]">元</span>
        </span>
        {t.coupon != null && (
          <span className="text-[11px] mt-0.5 px-1 rounded" style={{ background: '#FFF1E6', color: C.red }}>
            新人特权 券-{t.coupon}元
          </span>
        )}
      </span>
      <CheckCircle checked={picked.has(t.id)} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="滴滴代驾" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部地图条 */}
        <MapCanvas height={120} route>
          <div className="absolute left-3 bottom-2">
            <div className="bg-white rounded-lg shadow px-2 py-1 text-[11px] text-app-text">
              平台推荐 | 27.0公里 38分钟
            </div>
          </div>
        </MapCanvas>
        {/* 一口价提示条 */}
        <div className="flex items-center px-3 py-2 text-[12px]" style={{ background: '#FFF6E8', color: '#B4530A' }}>
          <span className="flex-1">特惠单若改变路线终点或等候超10分钟,将重新计算一口价</span>
          <span>›</span>
        </div>

        <div className="px-3 pt-2.5 pb-3 flex flex-col gap-2">
          <div className="rounded-xl p-2 flex flex-col gap-1.5" style={{ background: '#FFF4E8', border: `1px solid ${C.orange}` }}>
            <div className="flex items-center gap-1 px-1 text-[13px] font-semibold" style={{ color: C.orangeDeep }}>
              ⚡ 司机多,出发快
            </div>
            {TYPES.filter((t) => t.hot).map(renderRow)}
          </div>
          <div className="flex flex-col gap-1.5">
            {TYPES.filter((t) => !t.hot).map(renderRow)}
          </div>
        </div>

        <button
          onClick={() => toast('该功能暂未开放')}
          className="w-full flex items-center justify-center gap-1 py-2 border-none text-[12px]"
          style={{ background: '#E8F1FF', color: C.blue }}
        >
          请阅读并同意录音信息处理协议、个人信息共享说明 ›
        </button>
      </div>

      {/* 底部呼叫条(flex,非 fixed) */}
      <div className="shrink-0 bg-app-surface px-3 pt-2 pb-3 border-t border-app-border">
        <div className="flex justify-between text-[12px] text-app-text-muted pb-2 px-1">
          {['预约', '帮朋友叫', '叫多名', '无代步车', '个性化', '发票'].map((t) => (
            <button key={t} onClick={() => toast('该功能暂未开放')} className="bg-transparent border-none text-app-text-muted text-[12px] p-0">
              {t} ›
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-full overflow-hidden" style={{ background: '#26282E' }}>
          <div className="flex-1 px-4 py-2.5 text-white">
            <div className="text-[14px] font-semibold">已选 {picked.size} 种代驾</div>
            <div className="text-[11px] opacity-70 truncate">{pickedNames.join(' ') || '请选择代驾类型'}</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'driver.select.call' }, { onTrigger: () => toast('代驾下单暂未开放(演示)') })}
            className="h-full px-6 py-3.5 border-none text-white text-[16px] font-semibold"
            style={{ background: C.orange }}
          >
            同意协议并呼叫
          </button>
        </div>
      </div>
    </div>
  );
}
