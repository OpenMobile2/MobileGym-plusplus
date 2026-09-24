import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import Img from '../components/Img';
import { ConfirmDialog } from '../components/Sheet';
import {
  IcScan, IcSearch, IcPickup, IcSend, IcSwap, IcIdCard, IcSmile, IcPiggy, IcPuzzle, IcRecycle,
  IcBox, IcChevronRight, IcChevronUp, IcSettings, IcClose, IcCoins,
} from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { CAINIAO_CONFIG } from '../data';
import { tomorrowLabel, isRecentSigned, fmtMdHm } from '../utils/appTime';

/** 首页(spec home.main):查收/寄退切换 + 金刚区 + 包裹卡 + 装饰瀑布流 */
export default function HomePage() {
  const { bindTap, action, back } = useCainiaoGestures();
  const s = useAppStrings(strings, stringsEn);
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const showConfirm = sp.get('dialog') === 'confirmTaken';
  const confirmPkgId = sp.get('packageId') ?? undefined;

  const segment = useCainiaoStore((s) => s.homeSegment);
  const packages = useCainiaoStore((s) => s.packages);
  const shipOrders = useCainiaoStore((s) => s.shipOrders);
  const hintDismissed = useCainiaoStore((s) => s.homeHintDismissed);
  const setHomeSegment = useCainiaoStore((s) => s.setHomeSegment);
  const dismissHomeHint = useCainiaoStore((s) => s.dismissHomeHint);
  const confirmTaken = useCainiaoStore((s) => s.confirmTaken);
  const showToast = useCainiaoStore((s) => s.showToast);
  const setTemp = useCainiaoStore((s) => s.setTemp);

  const arrived = packages.filter((p) => p.status === '待取件');
  // 查收 = 到站包裹 + 近日签收(与列表展示一致,阶段⑥ 0731)
  const recentSigned = packages.filter((p) => p.status === '已签收' && isRecentSigned(p.statusTs));
  const shouquCount = arrived.length + recentSigned.length;
  const toSend = shipOrders.filter((o) => o.status === '待上门取件' || o.status === '待投柜' || o.status === '待到店自寄');
  // 寄退数量与列表一致
  const jituiCount = toSend.length;

  const wontfix = () => showToast(s.commonNotOpen);

  return (
    <div className="relative flex h-full flex-col" data-status-bar-foreground="light">
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-(--app-c-page-bg)"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部蓝色渐变区 */}
        <div className="bg-gradient-to-b from-(--app-c-header-from) via-(--app-c-header-via) to-(--app-c-header-to) px-3 pb-16 pt-12">
          {/* 搜索条 */}
          <div className="flex items-center gap-2">
            <div
              {...bindTap('home.search.open')}
              className="flex h-10 flex-1 cursor-pointer items-center rounded-full bg-(--app-c-card-bg) pl-3 pr-1"
            >
              <IcSearch size={18} className="text-(--app-c-text-muted)" />
              <span className="ml-2 flex-1 truncate text-[13px] text-(--app-c-text-muted)">{s.homeSearchPlaceholder}</span>
              <span className="rounded-full bg-(--app-c-brand) px-4 py-1.5 text-[13px] font-semibold text-white">
                {s.homeSearch}
              </span>
            </div>
            <button
              {...action('home.scan.wontfixToast', wontfix)}
              className="cursor-pointer border-none bg-transparent p-1 text-white"
            >
              <IcScan size={26} />
            </button>
          </div>
          {/* 金刚区 4 */}
          <div className="mt-5 flex">
            {[
              { key: 'pickup', label: s.homePickup, icon: IcPickup, badge: arrived.length },
              { key: 'send', label: s.homeSend, icon: IcSend },
              { key: 'swap', label: s.homeSwap, icon: IcSwap },
              { key: 'idcode', label: s.homeIdcode, icon: IcIdCard },
            ].map(({ key, label, icon: Icon, badge }) => {
              const binding =
                key === 'pickup'
                  ? bindTap('home.pickup.open')
                  : key === 'send'
                    ? bindTap('home.ship.open')
                    : key === 'idcode'
                      ? bindTap('home.idcode.open')
                      : action('home.swap.wontfixToast', wontfix);
              return (
                <button
                  key={key}
                  {...binding}
                  className="relative flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent"
                >
                  <div className="relative">
                    <Icon size={30} className="text-white" strokeWidth={1.8} />
                    {badge ? (
                      <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-[#F5222D] px-1 text-center text-[10px] leading-4 text-white">
                        {badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[14px] font-semibold text-white">{label}</span>
                </button>
              );
            })}
          </div>
          {/* 营销横幅:点击领取→我的权益(阶段⑥反馈#5) */}
          <div className="mt-4 flex items-center justify-between rounded-xl px-2 py-1.5">
            <div className="text-[15px] font-bold italic text-white">周日5折寄</div>
            <div
              {...bindTap('home.benefits.open')}
              className="cursor-pointer rounded-full bg-gradient-to-r from-[#FF7A45] to-[#F5222D] px-4 py-1 text-[13px] font-semibold text-white"
            >
              点击领取 ›
            </div>
            <div className="text-[15px] font-bold italic text-white">会员折上折</div>
          </div>
        </div>

        {/* 二排功能区(浅蓝渐变) */}
        <div className="-mt-10 rounded-t-3xl bg-gradient-to-b from-(--app-c-wash-from) to-(--app-c-wash-to) px-3 pb-2 pt-3">
          <div className="flex">
            {[
              { label: '裹酱积分', icon: IcSmile, color: '#F5A623' },
              { label: '包裹赚赚', icon: IcPiggy, color: '#E4573D' },
              { label: '欢乐赢红包', icon: IcPuzzle, color: '#E4573D' },
              { label: '菜鸟回收', icon: IcRecycle, color: '#39B54A' },
              { label: '更多', icon: IcBox, color: '#6AA1E8' },
            ].map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                {...action('home.marketing.wontfixToast', wontfix)}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent"
              >
                <Icon size={26} style={{ color }} strokeWidth={1.8} />
                <span className="text-[12px] text-(--app-c-text-primary)">{label}</span>
              </button>
            ))}
          </div>
          {/* 会员福利横幅(阶段⑥反馈#6:可点 toast) */}
          <div
            {...action('home.marketing.wontfixToast', wontfix)}
            className="mt-3 flex cursor-pointer items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-[#FFF3E4] to-[#FFD9AE] px-3 py-2.5"
          >
            <div>
              <span className="text-[14px] font-bold text-[#7A4A12]">〔会员福利〕视频会员</span>
              <span className="text-[14px] font-bold text-[#E4573D]">免费领!</span>
              <div className="mt-0.5 text-[11px] text-[#B08B5C]">解锁成功可立即兑换</div>
            </div>
            <div className="rounded-lg bg-gradient-to-b from-[#FF8A3D] to-[#F0621B] px-3 py-1.5 text-center text-[13px] font-bold leading-4 text-white">
              免费<br />领取
            </div>
          </div>
        </div>

        {/* 包裹卡片区 */}
        <div className="mx-3 mt-2 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="flex items-center">
            <button
              {...action('home.segment.select.shouqu', () => setHomeSegment('shouqu'))}
              className={`cursor-pointer border-none bg-transparent text-[19px] ${segment === 'shouqu' ? 'font-bold text-(--app-c-text-primary) underline decoration-[#1677FF] decoration-4 underline-offset-8' : 'text-(--app-c-text-secondary)'}`}
            >
              {s.homeShouqu}{shouquCount}
            </button>
            <button
              {...action('home.segment.select.jitui', () => setHomeSegment('jitui'))}
              className={`ml-5 cursor-pointer border-none bg-transparent text-[19px] ${segment === 'jitui' ? 'font-bold text-(--app-c-text-primary) underline decoration-[#00B578] decoration-4 underline-offset-8' : 'text-(--app-c-text-secondary)'}`}
            >
              {s.homeJitui}{jituiCount}
            </button>
            <button
              {...action('home.quickadd.wontfixToast', wontfix)}
              className="ml-auto flex cursor-pointer items-center gap-1 rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-2.5 py-1 text-[12px] text-(--app-c-text-primary)"
            >
              <IcCoins size={13} className="text-(--app-c-text-primary)" /> 快速添加
            </button>
            <button
              {...bindTap('home.importSettings.open')}
              className="ml-2 cursor-pointer rounded-full border-none bg-(--app-c-brand-soft) p-1.5 text-(--app-c-brand)"
            >
              <IcSettings size={16} />
            </button>
          </div>

          {segment === 'shouqu' ? (
            <div className="mt-3">
              {arrived.length === 0 && recentSigned.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-(--app-c-text-muted)">{s.commonEmpty}</div>
              ) : (
                <>
                  {arrived.length > 0 && (
                    <div className="border-l-2 border-[#D6E4FF] pl-3">
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-(--app-c-text-primary)">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--app-c-brand) text-white">
                          <IcBox size={12} />
                        </span>
                        {s.homeArrived} · {arrived.length}件
                        <IcChevronUp size={16} className="ml-auto text-(--app-c-brand)" />
                      </div>
                      {arrived.map((p) => (
                        <div key={p.id}>
                          <div
                            {...bindTap('home.package.open', { params: { packageId: p.id } })}
                            className="mt-2 cursor-pointer"
                          >
                            <div className="text-[14px]">
                              <span className="font-semibold text-(--app-c-brand)">递易快递柜</span>{' '}
                              <span className="font-semibold text-(--app-c-text-primary)">{p.station}</span>
                              <IcChevronRight size={14} className="inline text-(--app-c-text-muted)" />
                            </div>
                            <div className="mt-2 flex gap-2.5">
                              <Img src={p.image} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                              <div className="min-w-0">
                                <div className="text-[24px] font-extrabold leading-7 text-(--app-c-text-primary)">{p.pickupCode}</div>
                                <div className="mt-1 truncate text-[13px] text-(--app-c-text-primary)">{p.source} | {p.title}</div>
                                <div className="text-[12px] text-(--app-c-text-muted)">{p.company} | 已入站{p.daysInStation}天</div>
                              </div>
                            </div>
                          </div>
                          {!hintDismissed && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="flex h-9 flex-1 items-center rounded-full bg-(--app-c-chip-bg) px-3 text-[13px] text-(--app-c-text-secondary)">
                                <button
                                  {...action('home.package.hint.dismiss', dismissHomeHint)}
                                  className="mr-1.5 cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-muted)"
                                >
                                  <IcClose size={14} />
                                </button>
                                包裹已经取走?
                                <button
                                  {...bindTap('home.confirmTaken.open', { params: { packageId: p.id } })}
                                  className="ml-auto cursor-pointer border-none bg-transparent text-[13px] font-semibold text-(--app-c-text-primary)"
                                >
                                  {s.homeConfirmTaken}
                                </button>
                              </div>
                              <button
                                {...action('home.package.delegate.wontfixToast', wontfix)}
                                className="h-9 cursor-pointer rounded-full border-none bg-(--app-c-brand) px-4 text-[14px] font-semibold text-white"
                              >
                                {s.homeDelegate}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {recentSigned.length > 0 && (
                    <div className={`border-l-2 border-[#D9F2E6] pl-3 ${arrived.length > 0 ? 'mt-4' : ''}`}>
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-(--app-c-text-primary)">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00B578] text-white">
                          <IcBox size={12} />
                        </span>
                        近日签收 · {recentSigned.length}件
                        <IcChevronUp size={16} className="ml-auto text-[#00B578]" />
                      </div>
                      {recentSigned.map((p) => (
                        <div
                          key={p.id}
                          {...bindTap('home.package.open', { params: { packageId: p.id } })}
                          className="mt-2 cursor-pointer"
                        >
                          <div className="text-[14px]">
                            <span className="font-semibold text-[#00B578]">已签收</span>{' '}
                            <span className="font-semibold text-(--app-c-text-primary)">{p.station ?? p.company}</span>
                            <IcChevronRight size={14} className="inline text-(--app-c-text-muted)" />
                          </div>
                          <div className="mt-2 flex gap-2.5">
                            <Img src={p.image} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <div className="truncate text-[15px] font-semibold text-(--app-c-text-primary)">{p.title}</div>
                              <div className="mt-1 truncate text-[13px] text-(--app-c-text-primary)">{p.source} | {p.company}</div>
                              <div className="text-[12px] text-(--app-c-text-muted)">{fmtMdHm(p.statusTs)} 签收</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-3">
              {toSend.length > 0 ? (
                toSend.map((o) => (
                  <div key={o.id} className="border-l-2 border-[#D9F2E6] pl-3">
                    <div className="text-[15px] font-semibold text-(--app-c-text-primary)">
                      {s.homeToSend} · {toSend.length}件
                    </div>
                    <div className="mt-1 text-[14px] text-(--app-c-text-primary)">
                      {o.status === '待上门取件' ? `待快递员上门 预约时间: ${tomorrowLabel()}9:00-11:00` : o.status}
                    </div>
                    <div
                      {...bindTap('home.shiporder.open', { params: { orderId: o.id } })}
                      className="mt-2 flex cursor-pointer gap-2.5"
                    >
                      <Img src="/@app-assets/Cainiao/misc/courier.png" className="h-16 w-16 shrink-0 rounded-lg bg-(--app-c-brand-soft) object-cover" />
                      <div className="min-w-0">
                        <div className="text-[20px] font-extrabold text-(--app-c-text-primary)">寄件码 {o.shipCode}</div>
                        <div className="mt-0.5 truncate text-[13px] text-(--app-c-text-primary)">寄件 | 寄给{o.toCity}的【{o.toName}】</div>
                        {o.itemName && <div className="mt-0.5 truncate text-[12px] text-(--app-c-text-secondary)">商品：{o.itemName}</div>}
                        {o.remark && <div className="truncate text-[12px] text-(--app-c-text-muted)">备注：{o.remark}</div>}
                        <div className="mt-1 flex gap-1">
                          {['2小时上门', '丢损必赔', '隐私保护'].map((tag) => (
                            <span key={tag} className="rounded border border-(--app-c-border) px-1 text-[10px] text-(--app-c-text-muted)">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[13px] text-(--app-c-text-muted)">{s.commonEmpty}</div>
              )}
            </div>
          )}

          {/* 全部包裹 */}
          <div
            {...bindTap('home.packagelist.open', {
              beforeTrigger: () => setTemp({
                filter: { packageType: [], owner: [], logistics: [], trade: [], company: [] },
                filterApplied: false,
                packageSearch: '',
              }),
            })}
            className="mt-3 flex cursor-pointer items-center border-t border-(--app-c-divider) pt-3"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00B578] text-white">
              <IcBox size={12} />
            </span>
            <span className="ml-2 text-[15px] font-semibold text-(--app-c-text-primary)">{s.homeAllPackages}</span>
            <span className="ml-auto text-[15px] font-semibold text-(--app-c-brand)">{packages.length}件</span>
            <IcChevronRight size={16} className="text-(--app-c-text-muted)" />
          </div>
        </div>

        {/* 商品瀑布流(阶段⑥反馈#10:可点 toast) */}
        <div className="mt-2 grid grid-cols-2 gap-2 px-3 pb-4">
          {CAINIAO_CONFIG.homeFeed.map((f) => (
            <div key={f.id} {...action('home.marketing.wontfixToast', wontfix)} className="cursor-pointer overflow-hidden rounded-xl bg-(--app-c-card-bg)">
              <Img src={f.image} className="aspect-square w-full object-cover" />
              <div className="p-2">
                <div className="truncate text-[13px] text-(--app-c-text-primary)">{f.title}</div>
                <div className="mt-1 flex items-baseline">
                  <span className="text-[12px] text-[#F5222D]">¥</span>
                  <span className="text-[17px] font-bold text-[#F5222D]">{f.price}</span>
                  <span className="ml-auto text-[11px] text-(--app-c-text-muted)">{f.sold}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfirm && (
        <ConfirmTakenDialog packageId={confirmPkgId} onDone={() => { confirmTaken(confirmPkgId); back(); }} />
      )}
    </div>
  );
}

function ConfirmTakenDialog({ packageId, onDone }: { packageId?: string; onDone: () => void }) {
  const { action } = useCainiaoGestures();
  void packageId;
  return (
    <ConfirmDialog
      text="确认已取走该包裹?"
      subText="确认后包裹将标记为已签收"
      confirmLabel="确认"
      confirmBinding={action('home.confirmTaken.confirm', onDone)}
    />
  );
}
