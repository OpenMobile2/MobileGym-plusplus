import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { IcNavBack } from '../res/icons';

/** 顺风车(乘客/车主,浏览版,绿色主题) —— 证据 s31、s32 */

const GREEN = '#0DAB76';
const ORDER_CHIPS = ['市内订单', '跨城订单', '常用路线订单'];

export default function HitchHomePage() {
  const { bindTap, bindBack } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const hitchTab = useDidiStore((s) => s.hitchTab);
  const setHitchTab = useDidiStore((s) => s.setHitchTab);
  const [orderChip, setOrderChip] = React.useState('市内订单');

  return (
    <div className="flex flex-col h-full" style={{ background: '#F2F6F3' }} data-status-bar-foreground="dark">
      {/* 顶部 tabs 行 */}
      <div className="flex items-center px-2 h-11 shrink-0" style={{ background: '#DFF3E8' }}>
        <button {...bindBack()} className="bg-transparent border-none p-1 text-app-text" aria-label="返回">
          <IcNavBack size={22} />
        </button>
        <div className="flex items-end gap-4 flex-1 overflow-hidden pl-1">
          {([['passenger', '乘客'], ['owner', '车主']] as const).map(([k, label]) => (
            <button
              key={k}
              {...bindTap({ kind: 'action', id: 'hitch.home.tab' }, { onTrigger: () => setHitchTab(k) })}
              className="relative bg-transparent border-none p-0 pb-1"
            >
              <span className={`text-[17px] ${hitchTab === k ? 'font-bold text-app-text' : 'text-app-text-muted'}`}>
                {label}
              </span>
              {hitchTab === k && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full"
                  style={{ width: 20, height: 3, background: C.orangeDeep }}
                />
              )}
            </button>
          ))}
          {['车主奖励', '车主服务'].map((t) => (
            <button
              key={t}
              onClick={() => toast(`${t}暂未开放`)}
              className="bg-transparent border-none p-0 pb-1 text-[15px] text-app-text-muted shrink-0"
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => toast('顺风车客服暂未开放')} className="bg-transparent border-none p-1 text-[12px] text-app-text">
          客服
        </button>
        <span className="text-app-text-muted text-[12px]">|</span>
        <button onClick={() => toast('顺风车订单暂未开放')} className="bg-transparent border-none p-1 text-[12px] text-app-text">
          订单
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {hitchTab === 'passenger' ? (
          <>
            {/* 乘客:地图 hero */}
            <MapCanvas height={150}>
              <div className="absolute left-3 top-3">
                <div className="bg-white rounded-lg shadow px-2.5 py-1.5 text-[12px] text-app-text">
                  云溪苑-东北门(邻里便民超市旁)
                </div>
              </div>
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="rounded-full border-none px-2.5 py-1 text-[11px] text-white shadow"
                  style={{ background: C.orange }}
                >
                  邀友赚现金150元
                </button>
              </div>
            </MapCanvas>
            <div className="px-3 -mt-4 relative flex flex-col gap-2.5">
              <div className="rounded-t-xl px-3 py-2 text-[13px] font-medium" style={{ background: '#DFF3E8', color: GREEN }}>
                欢迎使用顺风车~
              </div>
              {/* 出发/目的地白卡 */}
              <div className="bg-app-surface rounded-xl px-3 pt-3 pb-3 shadow-sm">
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="flex items-center w-full bg-transparent border-none text-left pb-2.5"
                >
                  <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: GREEN }} />
                  <span className="flex-1 text-[14px] text-app-text truncate">云溪苑-东北门(邻里便民超市旁)</span>
                  <span className="text-app-text-muted">›</span>
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'hitch.home.go' }, { onTrigger: () => toast('顺风车下单暂未开放') })}
                  className="flex items-center w-full rounded-full px-4 py-3 border-2 text-left bg-app-surface"
                  style={{ borderColor: '#26282E' }}
                >
                  <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                  <span className="text-[18px] font-bold text-app-text">输入目的地</span>
                </button>
                <div className="flex gap-2 mt-2.5">
                  {ORDER_CHIPS.map((t) => (
                    <button
                      key={t}
                      {...bindTap(
                        { kind: 'action', id: 'hitch.home.order.filter' },
                        {
                          onTrigger: () => {
                            setOrderChip(t);
                            toast(`已切换到${t}`);
                          },
                          params: { filter: t },
                        },
                      )}
                      className="text-[12px] rounded-full px-2.5 py-1 border-none"
                      style={orderChip === t
                        ? { background: '#DFF3E8', color: GREEN, fontWeight: 600 }
                        : { background: '#F5F6FA', color: '#666' }}
                    >
                      {t}{orderChip === t ? ' · 已选' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* 区域超值路线 */}
              <div className="bg-app-surface rounded-xl px-3 py-3">
                <div className="flex items-center mb-1">
                  <span className="flex-1 text-[15px] font-bold text-app-text">区域超值路线</span>
                  <button onClick={() => toast('该功能暂未开放')} className="bg-transparent border-none text-[12px] text-app-text-muted p-0">
                    更多 ›
                  </button>
                </div>
                {[['云江 ⇌ 云江临空港', '9.5折起'], ['云江 ⇌ 云江乐乐岛', '9.5折起']].map(([r, p]) => (
                  <button
                    key={r}
                    onClick={() => toast('该功能暂未开放')}
                    className="flex items-center w-full py-2.5 bg-transparent border-none text-left border-b border-app-border last:border-b-0"
                  >
                    <span className="flex-1 text-[14px] text-app-text">{r}</span>
                    <span className="text-[14px] font-semibold" style={{ color: C.red }}>{p}</span>
                  </button>
                ))}
              </div>

              {/* 注册车主 banner */}
              <button
                onClick={() => toast('该功能暂未开放')}
                className="w-full rounded-xl border-none px-4 py-3.5 flex items-center text-left"
                style={{ background: 'linear-gradient(90deg,#FFF0DC,#FFE2BE)' }}
              >
                <span className="flex-1">
                  <span className="block text-[15px] font-bold" style={{ color: '#8A4B12' }}>注册成为车主</span>
                  <span className="block text-[12px] mt-0.5" style={{ color: '#B4793C' }}>首单奖励最高100元</span>
                </span>
                <span className="text-[13px] text-white rounded-full px-3 py-1.5" style={{ background: C.orange }}>
                  去看看
                </span>
              </button>

              {/* 免单券 / 学生认证 双卡 */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="flex-1 rounded-xl border-none px-3 py-3 text-left"
                  style={{ background: '#E7F8F1' }}
                >
                  <div className="text-[14px] font-bold" style={{ color: GREEN }}>邀请领免单券</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#4C9E7E' }}>30元免单券去抢</div>
                </button>
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="flex-1 rounded-xl border-none px-3 py-3 text-left"
                  style={{ background: '#FFF4EC' }}
                >
                  <div className="text-[14px] font-bold" style={{ color: C.orangeDeep }}>学生认证专享</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#C97B3D' }}>10元优惠 领现</div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 车主 hero */}
            <div style={{ background: 'linear-gradient(180deg,#BFEBD2,#E7F7EE)' }} className="px-4 pt-4 pb-8">
              <div className="flex items-start">
                <div className="flex-1 text-[24px] font-extrabold leading-snug" style={{ color: '#14351F' }}>
                  欢迎使用
                  <br />
                  滴滴顺风车
                </div>
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="rounded-full border-none px-3 py-1.5 text-[12px] text-white"
                  style={{ background: GREEN }}
                >
                  奖励中心 ›
                </button>
              </div>
            </div>
            <div className="px-3 -mt-5 relative flex flex-col gap-2.5">
              <div className="bg-app-surface rounded-xl px-3 pt-3 pb-3 shadow-sm">
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="flex items-center w-full bg-transparent border-none text-left pb-2.5"
                >
                  <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: GREEN }} />
                  <span className="flex-1 text-[14px] text-app-text truncate">
                    从 <span className="font-semibold">云溪苑3栋-2单元</span> 出发
                  </span>
                  <span className="text-app-text-muted">›</span>
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'hitch.home.go' }, { onTrigger: () => toast('顺风车下单暂未开放') })}
                  className="flex items-center w-full rounded-full px-4 py-3 border-2 text-left bg-app-surface"
                  style={{ borderColor: '#26282E' }}
                >
                  <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                  <span className="text-[18px] font-bold text-app-text">你要去哪儿</span>
                </button>
              </div>

              {/* 订单 chips */}
              <div className="flex gap-2">
                {ORDER_CHIPS.map((t) => (
                  <button
                    key={t}
                    {...bindTap(
                      { kind: 'action', id: 'hitch.home.order.filter' },
                      {
                        onTrigger: () => {
                          setOrderChip(t);
                          toast(`已切换到${t}`);
                        },
                        params: { filter: t },
                      },
                    )}
                    className="text-[13px] rounded-full px-3 py-1.5 border-none"
                    style={orderChip === t
                      ? { background: '#fff', color: '#14351F', fontWeight: 700 }
                      : { background: 'rgba(255,255,255,.6)', color: '#666' }}
                  >
                    {t}{orderChip === t ? ' · 已选' : ''}
                  </button>
                ))}
              </div>
              <div className="text-[12px] text-app-text-muted">
                已为你找到 2 个{orderChip}
              </div>

              {/* 顺路订单卡 ×2 */}
              {[
                { dist: '顺路1.3km', time: '今天13:10-13:45', from: '临湖区·天悦庭2栋', to: '桥东区·交通职院桥东校区', price: '¥68.7', tag: '1人独享', foot: '支付快·取消少' },
                { dist: '顺路2.0km', time: '今天13:10-13:25', from: '临湖区·绿洲城-东门', to: '临湖区·政务服务中心', price: '¥74.65', tag: '1人拼车', foot: '好评高·取消少' },
              ].map((o) => (
                <div key={o.from} className="bg-app-surface rounded-xl px-3 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px] font-bold" style={{ color: GREEN }}>{o.dist}</span>
                    <span className="text-[13px] text-app-text">{o.time}</span>
                    <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#FFF1E6', color: C.orangeDeep }}>
                      含新人奖50元
                    </span>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[14px] text-app-text truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GREEN }} />
                        {o.from}
                      </div>
                      <div className="flex items-center gap-2 text-[14px] text-app-text-muted truncate mt-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.orange }} />
                        {o.to}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#F5F6FA', color: '#666' }}>{o.tag}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#FFF1E6', color: C.orangeDeep }}>已支付</span>
                      </div>
                    </div>
                    <div className="text-[18px] font-bold text-app-text ml-2 shrink-0">{o.price}</div>
                  </div>
                  <div className="flex items-center mt-2.5 pt-2.5 border-t border-app-border">
                    <span className="text-[12px] text-app-text-muted flex-1">👍 {o.foot}</span>
                    <button
                      onClick={() => toast('请先完成车主认证')}
                      className="text-[13px] rounded-full px-3.5 py-1.5"
                      style={{ background: '#E7F8F1', color: GREEN, border: `1px solid ${GREEN}` }}
                    >
                      认证后接单
                    </button>
                  </div>
                </div>
              ))}

              {/* 底部认证 banner */}
              <div className="rounded-xl px-4 py-3.5 flex items-center" style={{ background: '#FFF0DC' }}>
                <div className="flex-1">
                  <div className="text-[14px] font-bold" style={{ color: '#8A4B12' }}>认证车主后可立即接单</div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#B4793C' }}>
                    大平台可信赖,顺路订单多 · 首单最高可得100元奖励
                  </div>
                </div>
                <button
                  onClick={() => toast('该功能暂未开放')}
                  className="text-[13px] text-white rounded-full px-3.5 py-2 border-none shrink-0"
                  style={{ background: C.orange }}
                >
                  立即认证
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
