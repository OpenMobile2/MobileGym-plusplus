import React, { useEffect } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import { IcSearch, IcScan, IcClose, IcChevronRight, IcCopy, IcImage } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 包裹搜索页(spec home.search):idle=多包裹工具;输入后=结果列表 */
export default function HomeSearchPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, bindBack } = useCainiaoGestures();
  const { t } = useI18n();
  const query = useCainiaoStore((s) => s._temp.packageSearch);
  const packages = useCainiaoStore((s) => s.packages);
  const shipOrders = useCainiaoStore((s) => s.shipOrders);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  // 每次进入清空搜索框(阶段⑥反馈#4)
  useEffect(() => { setTemp({ packageSearch: '' }); }, [setTemp]);

  const results = query.trim()
    ? packages.filter(
        (p) => p.title.includes(query.trim()) || p.trackingNo.includes(query.trim()) || p.company.includes(query.trim()),
      )
    : [];
  const shipResults = query.trim()
    ? shipOrders.filter((order) =>
        [order.orderNo, order.shipCode, order.itemName, order.remark]
          .some((value) => value?.includes(query.trim())),
      )
    : [];

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      {/* 搜索栏 */}
      <div className="flex items-center gap-2 bg-(--app-c-card-bg) px-3 pb-2 pt-12">
        <div className="flex h-10 flex-1 items-center rounded-full bg-(--app-c-chip-bg) px-3">
          <IcSearch size={17} className="shrink-0 text-(--app-c-text-muted)" />
          <input
            data-action="home.search.input"
            data-action-type="input"
            value={query}
            onChange={(e) => setTemp({ packageSearch: e.target.value })}
            placeholder="搜索快递单号/商品名称/备注"
            className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[14px] text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
          />
          {query ? (
            <button
              {...action('home.search.clear', () => setTemp({ packageSearch: '' }))}
              className="cursor-pointer rounded-full border-none bg-[#D9DEE7] p-0.5 text-white"
            >
              <IcClose size={13} />
            </button>
          ) : (
            <button {...action('home.search.tools.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-secondary)">
              <IcScan size={18} />
            </button>
          )}
        </div>
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent text-[15px] text-(--app-c-text-primary)">
          {t('common.cancel')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {query.trim() ? (
          <div className="px-3 pt-3">
            <div className="text-[13px] text-(--app-c-text-secondary)">搜索我的快递(商品名/备注/运单号)</div>
            {results.length > 0 || shipResults.length > 0 ? (
              <div className="mt-2 rounded-xl bg-(--app-c-card-bg) p-3">
                {results.map((p) => (
                  <div
                    key={p.id}
                    {...bindTap('home.search.result.open', { params: { packageId: p.id } })}
                    className="flex cursor-pointer gap-2.5 py-2"
                  >
                    <Img src={p.image} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[14px] text-(--app-c-text-primary)">{p.source} | {p.title}</div>
                      <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">
                        {p.company}: <span className="text-(--app-c-brand)">{p.trackingNo}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {shipResults.map((order) => (
                  <div
                    key={order.id}
                    {...bindTap('home.search.shiporder.open', { params: { orderId: order.id } })}
                    className="flex cursor-pointer gap-2.5 border-t border-(--app-c-divider) py-2"
                  >
                    <Img src="/@app-assets/Cainiao/misc/courier.png" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-(--app-c-text-primary)">{order.itemName || order.itemLabel}</div>
                      {order.remark && <div className="truncate text-[12px] text-(--app-c-text-secondary)">备注：{order.remark}</div>}
                      <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">寄件订单 {order.orderNo}</div>
                    </div>
                  </div>
                ))}
                <div className="pt-1 text-center text-[12px] text-(--app-c-text-muted)">共找到{results.length + shipResults.length}条记录</div>
              </div>
            ) : (
              <div className="py-10 text-center text-[13px] text-(--app-c-text-muted)">{t('common.empty')}</div>
            )}
          </div>
        ) : (
          <div className="px-3 pt-3">
            {/* 多包裹查询工具(占位) */}
            <div className="rounded-xl bg-(--app-c-card-bg) p-3">
              <div className="flex items-center text-[16px] font-bold text-(--app-c-text-primary)">
                多包裹查询工具
                <button {...action('home.search.tools.wontfixToast', wontfix)} className="ml-auto cursor-pointer border-none bg-transparent text-[12px] text-(--app-c-text-muted)">
                  使用攻略 ?
                </button>
              </div>
              <div className="mt-2.5 flex gap-2">
                <button {...action('home.search.tools.wontfixToast', wontfix)} className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border border-(--app-c-border) bg-(--app-c-chip-bg) p-2.5 text-left">
                  <div>
                    <div className="text-[14px] font-semibold text-(--app-c-text-primary)">批量复制单号</div>
                    <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">换行输入多个运单号</div>
                  </div>
                  <span className="rounded-full bg-(--app-c-brand) p-2 text-white"><IcCopy size={15} /></span>
                </button>
                <button
                  {...action('home.search.tools.wontfixToast', wontfix)}
                  className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border border-(--app-c-border) bg-(--app-c-chip-bg) p-2.5 text-left"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-(--app-c-text-primary)">批量上传图片</div>
                    <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">
                      上传含运单号的截图
                    </div>
                  </div>
                  <span className="rounded-full bg-[#2BC48A] p-2 text-white"><IcImage size={15} /></span>
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-(--app-c-border) p-2.5">
                <div className="text-[14px] font-semibold text-(--app-c-text-primary)">
                  小鸟包裹添加助手 <span className="text-[12px] font-normal text-(--app-c-text-muted)">无需输入单号,戳一戳小鸟快速添加</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {['拼多多', '抖音', '其他'].map((name) => (
                    <button key={name} {...action('home.search.tools.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-lg border border-(--app-c-border) bg-(--app-c-card-bg) p-2 text-left">
                      <div className="text-[13px] font-semibold text-(--app-c-text-primary)">{name}</div>
                      <div className="mt-1 flex items-center text-[12px] text-(--app-c-text-muted)">去添加 <IcChevronRight size={12} /></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* 月度横幅(装饰) */}
            <div className="mt-3 rounded-xl bg-(--app-c-card-bg) p-3">
              <div className="text-[16px] font-bold text-(--app-c-text-primary)">你上个月买了多少包裹?</div>
              <div className="mt-2 flex h-28 items-center justify-center rounded-lg bg-gradient-to-r from-[#BFDCFF] via-[#D8E8FF] to-[#BFD2FF] text-[15px] text-[#456]">
                上月你的关键词是「?」
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
