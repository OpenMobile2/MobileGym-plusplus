import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcCart, IcCheck, IcPlus, IcClose, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf, shopOf, fansText } from '../utils/detail';
import { promoLabel } from '../utils/search';
import type { FollowedProduct, Product } from '../types';

const EMPTY_LION = '/@app-assets/Suning/me/empty-lion.png';

type FollowTab = 'goods' | 'shops' | 'creators' | 'contents';
type GoodsFilter = 'all' | 'drop' | 'promo' | 'subscribed';

const asTab = (v: string | null): FollowTab =>
  v === 'shops' || v === 'creators' || v === 'contents' ? v : 'goods';
const asFilter = (v: string | null): GoodsFilter =>
  v === 'drop' || v === 'promo' || v === 'subscribed' ? v : 'all';

/**
 * 我的关注(spec me.follow,s317~s325)。
 * tab / filter / edit 三个离散态全部走 queryParam(v1.8.0:平台禁止 useState 管离散 UI 态);
 * ?dialog=priceWatch 降价通知弹窗 URL 驱动,关闭走 bindBack。
 * 达人卡目标 creator.profile 已减范围,按铁律①落合并 toast 而非死链接。
 */
export default function FollowPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = asTab(searchParams.get('tab'));
  const filter = asFilter(searchParams.get('filter'));
  const editMode = tab === 'goods' && searchParams.get('edit') === '1';
  const dialogOpen = searchParams.get('dialog') === 'priceWatch';

  const followedProducts = useSuningStore((s) => s.followedProducts);
  const followedShops = useSuningStore((s) => s.followedShops);
  const followedCreators = useSuningStore((s) => s.followedCreators);
  const cartItems = useSuningStore((s) => s.cartItems);
  const multiSelect = useSuningStore((s) => s._temp.multiSelect);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const unfollowProducts = useSuningStore((s) => s.unfollowProducts);

  const wontfix = () => showToast(S.toastNotOpen);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);

  const goods = followedProducts
    .map((f) => ({ follow: f, product: productOf(f.productId) }))
    .filter((row): row is { follow: FollowedProduct; product: Product } => row.product != null);
  const visibleGoods = goods.filter(({ follow, product }) => {
    switch (filter) {
      // 「降价」= 现价已跌到订阅价(降价通知的语义);种子三条均未达到 → 空态(frame:r2@7.2)
      case 'drop':
        return follow.subscribePrice != null && product.price <= follow.subscribePrice;
      case 'promo':
        return product.promoTag != null;
      case 'subscribed':
        return follow.subscribePrice != null;
      default:
        return true;
    }
  });

  const setTab = (next: FollowTab) => setSearchParams({ tab: next }, { replace: true });
  const setFilter = (next: GoodsFilter) =>
    setSearchParams({ tab: 'goods', filter: next }, { replace: true });

  /** bind 处必须是字面量 id(一致性检查器按字面量扫描),故按 key 分派而不是拼串 */
  const tabBind = (key: FollowTab) => {
    const run = () => setTab(key);
    switch (key) {
      case 'goods':
        return action('me.follow.select.tabGoods', run, { params: { tab: key } });
      case 'shops':
        return action('me.follow.select.tabShops', run, { params: { tab: key } });
      case 'creators':
        return action('me.follow.select.tabCreators', run, { params: { tab: key } });
      default:
        return action('me.follow.select.tabContents', run, { params: { tab: key } });
    }
  };
  const filterBind = (key: GoodsFilter) => {
    const run = () => setFilter(key);
    switch (key) {
      case 'all':
        return action('me.follow.select.filterAll', run, { params: { filter: key } });
      case 'drop':
        return action('me.follow.select.filterDrop', run, { params: { filter: key } });
      case 'promo':
        return action('me.follow.select.filterPromo', run, { params: { filter: key } });
      default:
        return action('me.follow.select.filterSubscribed', run, { params: { filter: key } });
    }
  };

  const allSelected = visibleGoods.length > 0 && multiSelect.length === visibleGoods.length;
  const toggleAll = () =>
    setTemp({ multiSelect: allSelected ? [] : visibleGoods.map((g) => g.product.id) });
  const toggleOne = (productId: string) =>
    setTemp({
      multiSelect: multiSelect.includes(productId)
        ? multiSelect.filter((id) => id !== productId)
        : [...multiSelect, productId],
    });

  const TABS: Array<{ key: FollowTab; label: string }> = [
    { key: 'goods', label: S.followTabGoods },
    { key: 'shops', label: S.followTabShops },
    { key: 'creators', label: S.followTabCreators },
    { key: 'contents', label: S.followTabContents },
  ];
  const FILTERS: Array<{ key: GoodsFilter; label: string }> = [
    { key: 'all', label: S.followFilterAll },
    { key: 'drop', label: S.followFilterDrop },
    { key: 'promo', label: S.followFilterPromo },
    { key: 'subscribed', label: S.followFilterSubscribed },
  ];
  const SHOP_FILTERS = [
    S.followFilterAll,
    S.followShopFilterCoupon,
    S.followShopFilterNew,
    S.followShopFilterAct,
  ];
  const picks = SUNING_CONFIG.products.slice(12, 16);

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 我的关注 + 购物车(角标)+ 编辑/完成(仅商品Tab) */}
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-[16px] font-bold text-[var(--app-text)]">{S.followTitle}</span>
        <button
          {...bindTap('me.follow.cart.open')}
          className="relative shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[15px] rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[9px] leading-[15px] text-white">
              {cartCount}
            </span>
          )}
        </button>
        {tab === 'goods' && (
          <button
            {...action('me.follow.editMode.toggle', () =>
              setSearchParams(
                editMode
                  ? { tab: 'goods', filter }
                  : { tab: 'goods', filter, edit: '1' },
                { replace: true },
              ),
            )}
            className="shrink-0 cursor-pointer border-none bg-transparent px-1 text-[14px] text-[var(--app-text)]"
          >
            {editMode ? S.done : S.edit}
          </button>
        )}
      </div>

      {/* 二级Tab:商品/店铺/达人/内容 */}
      <div className="flex shrink-0 items-center bg-[var(--app-surface)] px-2 pb-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            {...tabBind(t.key)}
            className={`relative min-w-0 flex-1 cursor-pointer border-none bg-transparent py-1 text-[14px] ${
              tab === t.key ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* 筛选条(随 Tab 变化;店铺Tab 整组一致 toast) */}
      {tab === 'goods' && (
        <div className="flex shrink-0 gap-2 bg-[var(--app-surface)] px-3 pb-2 pt-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              {...filterBind(f.key)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] ${
                filter === f.key
                  ? 'border-[var(--app-primary)] bg-[#FFF3E8] text-[var(--app-primary)]'
                  : 'border-[var(--app-border)] bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'shops' && (
        <div className="flex shrink-0 gap-2 bg-[var(--app-surface)] px-3 pb-2 pt-1.5">
          {SHOP_FILTERS.map((label, i) => (
            <button
              key={label}
              {...action('me.follow.wontfix.toast', wontfix)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-[12px] ${
                i === 0
                  ? 'border-[var(--app-primary)] bg-[#FFF3E8] text-[var(--app-primary)]'
                  : 'border-[var(--app-border)] bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'goods' && (
          <>
            {visibleGoods.length === 0 ? (
              <EmptyBlock
                text={filter === 'all' ? S.followGoodsEmpty : S.followFilterEmpty}
                actionSlot={
                  <button
                    {...bindTap('me.follow.goShopping.open')}
                    className="mt-3 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-6 py-1.5 text-[13px] font-bold text-white"
                  >
                    {S.followGoShopping}
                  </button>
                }
              />
            ) : (
              visibleGoods.map(({ follow, product }) => (
                <GoodsCard
                  key={product.id}
                  product={product}
                  follow={follow}
                  editMode={editMode}
                  checked={multiSelect.includes(product.id)}
                  onToggle={() => toggleOne(product.id)}
                />
              ))
            )}

            {!editMode && (
              <>
                <div className="py-3 text-center text-[14px] font-bold text-[var(--app-text)]">{S.pickGoods}</div>
                <div className="grid grid-cols-2 gap-2">
                  {picks.map((p) => (
                    <button
                      key={p.id}
                      {...bindTap('me.follow.productDetail.open', { params: { productId: p.id } })}
                      className="cursor-pointer overflow-hidden rounded-xl border-none bg-[var(--app-surface)] p-0 text-left"
                    >
                      <span className="block aspect-square w-full bg-[var(--app-c-chip-bg)]">
                        <Img src={p.image} className="h-full w-full object-contain" />
                      </span>
                      <span className="block p-2">
                        <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
                        <span className="mt-1 block text-[15px] font-bold text-[var(--app-c-danger)]">
                          <span className="text-[10px]">¥</span>
                          {p.price}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'shops' &&
          followedShops.map((shopId) => {
            const shop = shopOf(shopId);
            if (!shop) return null;
            return (
              <button
                key={shopId}
                {...bindTap('me.follow.shop.open', { params: { shopId } })}
                className="mb-2 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
              >
                <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
                  <Img src={shop.logo} className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-[var(--app-text)]">{shop.name}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--app-c-text-muted)]">
                    {fansText(shop.followers)}
                    {S.fansUnit}
                  </span>
                </span>
                <IcChevronRight size={16} className="shrink-0 text-[#CCC]" />
              </button>
            );
          })}

        {tab === 'creators' && (
          <>
            {followedCreators.map((creatorId) => {
              const c = SUNING_CONFIG.creators.find((x) => x.id === creatorId);
              if (!c) return null;
              return (
                // creator.profile 已减范围(用户拍板不做),入口保留 toast 反馈
                <button
                  key={creatorId}
                  {...action('me.follow.wontfix.toast', wontfix)}
                  className="mb-2 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
                    <Img src={c.avatar} className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-[var(--app-text)]">{c.name}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-[var(--app-c-text-muted)]">{c.bio}</span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--app-border)] px-2.5 py-1 text-[11px] text-[var(--app-text-muted)]">
                    {S.followed}
                  </span>
                </button>
              );
            })}
            <div className="py-4 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.followNoMore}</div>
          </>
        )}

        {tab === 'contents' && (
          <EmptyBlock
            text={S.followContentsEmpty}
            actionSlot={
              <button
                {...bindTap('me.follow.discover.open')}
                className="mt-3 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-6 py-1.5 text-[13px] font-bold text-white"
              >
                {S.followGoDiscover}
              </button>
            }
          />
        )}
      </div>

      {/* 编辑态底部悬浮栏:全选 + 取消关注(未选中置灰、不打 tag) */}
      {editMode && (
        <div className="flex shrink-0 items-center gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
          <button
            {...action('me.follow.selectAll.toggle', toggleAll)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-left"
          >
            <CheckCircle checked={allSelected} />
            <span className="text-[13px] text-[var(--app-text)]">{S.selectAll}</span>
          </button>
          {multiSelect.length > 0 ? (
            <button
              {...action('me.follow.unfollow.submit', () => {
                unfollowProducts(multiSelect);
                showToast(S.toastUnfollowed);
                setSearchParams({ tab: 'goods', filter }, { replace: true });
              })}
              className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-5 py-1.5 text-[13px] font-bold text-white"
            >
              {S.followUnfollowBtn}
            </button>
          ) : (
            <button disabled className="shrink-0 rounded-full border-none bg-[var(--app-c-chip-bg)] px-5 py-1.5 text-[13px] font-bold text-[var(--app-c-text-muted)]">
              {S.followUnfollowBtn}
            </button>
          )}
        </div>
      )}

      {dialogOpen && <PriceWatchDialog />}
    </div>
  );
}

function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
        checked ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] text-transparent'
      }`}
    >
      <IcCheck size={12} />
    </span>
  );
}

function EmptyBlock({ text, actionSlot }: { text: string; actionSlot: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-16">
      <span className="h-24 w-24 overflow-hidden">
        <Img src={EMPTY_LION} className="h-full w-full object-contain" />
      </span>
      <span className="mt-2 px-8 text-center text-[13px] text-[var(--app-c-text-muted)]">{text}</span>
      {actionSlot}
    </div>
  );
}

/** 关注商品卡(s317):图/标题/价格 + 找相似 / 降价通知(或订阅价)/ 加购;编辑态整行变复选 */
function GoodsCard({
  product: p,
  follow,
  editMode,
  checked,
  onToggle,
}: {
  product: Product;
  follow: FollowedProduct;
  editMode: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  const { bindTap, action } = useSuningGestures();
  const S = useStrings();
  const setTemp = useSuningStore((s) => s.setTemp);
  const label = promoLabel(p);

  const body = (
    <>
      <span className="h-[86px] w-[86px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
        <Img src={p.image} className="h-full w-full object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{p.title}</span>
        {label && (
          <span className="mt-1 inline-block rounded-sm bg-[var(--app-c-danger)] px-1 text-[9px] leading-4 text-white">
            {label}
          </span>
        )}
        <span className="mt-1 block text-[16px] font-bold text-[var(--app-c-danger)]">
          <span className="text-[11px]">¥</span>
          {p.price}
        </span>
      </span>
    </>
  );

  return (
    <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-3">
      <div className="flex items-center gap-2">
        {editMode && (
          <button
            {...action('me.follow.selectAll.toggle', onToggle, { params: { productId: p.id } })}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0"
          >
            <CheckCircle checked={checked} />
          </button>
        )}
        {editMode ? (
          <div className="flex min-w-0 flex-1 gap-2.5">{body}</div>
        ) : (
          <button
            {...bindTap('me.follow.productDetail.open', { params: { productId: p.id } })}
            className="flex min-w-0 flex-1 cursor-pointer gap-2.5 border-none bg-transparent p-0 text-left"
          >
            {body}
          </button>
        )}
      </div>

      {!editMode && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            {...bindTap('me.follow.similar.open', { params: { productId: p.id } })}
            className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
          >
            {S.findSimilar}
          </button>
          {follow.subscribePrice == null ? (
            <button
              {...bindTap('me.follow.priceWatch.open', {
                params: { productId: p.id },
                beforeTrigger: () => setTemp({ priceWatchDraft: '' }),
              })}
              className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text)]"
            >
              {S.followPriceWatch}
            </button>
          ) : (
            <button
              {...bindTap('me.follow.priceWatchEdit.open', {
                params: { productId: p.id },
                beforeTrigger: () => setTemp({ priceWatchDraft: String(follow.subscribePrice) }),
              })}
              className="cursor-pointer rounded-full border border-[var(--app-primary)] bg-[#FFF3E8] px-3 py-1 text-[12px] text-[var(--app-primary)]"
            >
              {S.followSubscribedPrefix}
              {follow.subscribePrice.toFixed(2)}
            </button>
          )}
          <button
            {...bindTap('me.follow.skuAdd.open', {
              params: { productId: p.id },
              beforeTrigger: () => setTemp({ skuEntryHint: 'add' }),
            })}
            className="cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] p-1.5 text-white"
          >
            <IcPlus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/** ?dialog=priceWatch(s323/s324):期望价格数字输入 + 折扣标签 + 取消(bindBack)/确定 */
function PriceWatchDialog() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const draft = useSuningStore((s) => s._temp.priceWatchDraft);
  const setTemp = useSuningStore((s) => s.setTemp);
  const setPriceWatch = useSuningStore((s) => s.setPriceWatch);
  const showToast = useSuningStore((s) => s.showToast);

  const p = productOf(productId);
  const value = Number(draft);
  // 期望价必须低于现价,否则「降价通知」立刻满足条件、无意义(与 toast 文案一致)
  const valid = draft !== '' && Number.isFinite(value) && value > 0 && (p == null || value < p.price);
  // 折扣标签只在低于现价时出现(s324「8.9折」);高于现价即「已达期望价」,不算折扣
  const discount = valid && p && value < p.price ? ((value / p.price) * 10).toFixed(1) : null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[78%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[16px] font-bold text-[var(--app-text)]">{S.priceWatchTitle}</div>
        <div className="mt-1 text-center text-[12px] leading-4 text-[var(--app-c-text-muted)]">{S.priceWatchDesc}</div>

        {p && (
          <div className="mt-3 flex items-center gap-2">
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
              <Img src={p.image} className="h-full w-full object-contain" />
            </span>
            <span className="line-clamp-2 min-w-0 flex-1 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 rounded-lg bg-[var(--app-c-chip-bg)] px-3 py-2">
          <span className="shrink-0 text-[13px] text-[var(--app-text-muted)]">{S.priceWatchExpect}</span>
          <span className="shrink-0 text-[15px] font-bold text-[var(--app-c-danger)]">¥</span>
          <input
            data-action="me.follow.priceWatch.input"
            data-action-type="input"
            inputMode="decimal"
            value={draft}
            placeholder={p ? String(p.price) : ''}
            onChange={(e) => setTemp({ priceWatchDraft: e.target.value })}
            data-keep-keyboard="true"
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] font-bold text-[var(--app-c-danger)] outline-none placeholder:font-normal placeholder:text-[var(--app-c-text-muted)]"
          />
          {draft !== '' && (
            <button
              {...action('me.follow.priceWatch.input', () => setTemp({ priceWatchDraft: '' }), {
                params: { value: '' },
              })}
              className="shrink-0 cursor-pointer rounded-full border-none bg-[#DDD] p-0.5 text-white"
            >
              <IcClose size={11} />
            </button>
          )}
          {discount && (
            <span className="shrink-0 rounded-sm bg-[var(--app-c-danger)] px-1 text-[10px] leading-4 text-white">
              {discount}
              {S.priceWatchDiscountSuffix}
            </span>
          )}
        </div>
        {p && (
          <div className="mt-1.5 px-1 text-[11px] text-[var(--app-c-text-muted)]">
            {S.priceWatchCurrent} ¥{p.price}
          </div>
        )}

        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button
            {...bindBack()}
            className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]"
          >
            {S.cancel}
          </button>
          <button
            {...action('me.follow.priceWatch.confirm', () => {
              if (!valid) {
                showToast(S.toastPriceWatchInvalid);
                return;
              }
              setPriceWatch(productId, value);
              showToast(S.toastPriceWatchSet);
              back();
            })}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
