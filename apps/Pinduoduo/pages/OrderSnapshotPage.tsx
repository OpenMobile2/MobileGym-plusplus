import React from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan, FufeiTag, Tag } from '../components/ui';

// 商品快照:交易完成时冻结的商品描述信息,可作为交易争议判定依据(只读)。
// 数据取自订单行(已购规格/数量/价格)+ 商品当前描述(图集/详情/店铺)。
export function OrderSnapshotPage() {
  const { orderId } = useParams();
  const order = usePinduoduoStore((s) => s.orders.find((o) => o.id === orderId));
  const line = order?.lines[0];
  const item = usePinduoduoStore((s) => s.items.find((i) => i.id === line?.itemId));
  const shop = usePinduoduoStore((s) => s.shops.find((sh) => sh.id === item?.shopId));

  if (!order || !line) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">快照不存在</div>;
  }

  const gallery = item?.gallery.length ? item.gallery : [line.image];
  const lineTotal = Math.round(line.price * line.qty * 100) / 100;

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="商品快照" className="bg-white" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 说明条 */}
        <div className="bg-[#FAFAFA] px-4 py-3 text-[13px] text-[#666] leading-relaxed border-b border-[#F0F0F0]">
          当前页面内容为交易完成时的商品描述信息,买卖双方在核对交易细节时,该页面可作为判定依据
        </div>

        {/* 主图 */}
        <div className="relative w-full aspect-square bg-white">
          <Img src={gallery[0]} className="w-full h-full object-cover" alt={line.title} />
          <span className="absolute right-2 bottom-2 bg-black/40 text-white text-[11px] px-2 py-0.5 rounded-full">
            1/{gallery.length}
          </span>
        </div>

        {/* 价格 + 标题 */}
        <div className="bg-white px-3 py-2.5">
          <PriceYuan value={line.price} className="text-[#E22E1F] text-[26px]" symbolClass="text-[15px]" />
          <div className="flex gap-1 flex-wrap mt-1.5 mb-1">
            {item?.fufei && <FufeiTag />}
            {(item?.tags || []).map((t) => (
              <Tag key={t} className="text-[#E22E1F] bg-[#FFF0E8]">{t}</Tag>
            ))}
          </div>
          <div className="text-[15px] font-medium leading-snug text-[#333]">{line.title}</div>
        </div>

        {/* 已购信息 */}
        <div className="bg-white mt-2 px-3 py-1">
          <SnapRow label="已购规格" value={<span className="text-[13px] text-[#333] text-right max-w-[60%]">{line.skuDesc}</span>} />
          <SnapRow label="该规格拼单价" value={<PriceYuan value={line.price} className="text-[#333] text-[14px]" symbolClass="text-[11px]" />} />
          <SnapRow label="已购数量" value={<span className="text-[13px] text-[#333]">{line.qty}</span>} />
          <SnapRow label="合计拼单价" value={<PriceYuan value={lineTotal} className="text-[#333] text-[14px]" symbolClass="text-[11px]" />} />
          <SnapRow
            label="实付款"
            value={
              <span className="text-[13px] text-[#E22E1F]">
                ¥{order.paidAmount.toFixed(2)}
                {order.fufei && <span className="text-[#20B010]">(先用后付,确认收货后自动付款 ¥{order.autoPayAmount.toFixed(2)})</span>}
              </span>
            }
          />
        </div>

        {/* 店铺 */}
        {shop && (
          <div className="bg-white mt-2 px-3 py-3 flex items-center gap-2">
            <Img src={shop.logo} className="w-9 h-9 rounded-md object-cover shrink-0" alt={shop.name} />
            <div className="min-w-0">
              <div className="text-[14px] text-[#333] font-medium truncate">{shop.name}</div>
              <div className="text-[12px] text-[#999] truncate">{shop.soldTip}</div>
            </div>
          </div>
        )}

        {/* 图文详情 */}
        {item && item.detailImages.length > 0 && (
          <div className="bg-white mt-2">
            <div className="px-3 py-2.5 text-[14px] text-[#333] font-medium border-b border-[#F0F0F0]">商品详情</div>
            {item.detailImages.map((im, i) => (
              <Img key={i} src={im} className="w-full block" alt="详情" />
            ))}
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}

function SnapRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 gap-3 border-b border-[#F7F7F7] last:border-b-0">
      <span className="text-[13px] text-[#999] shrink-0">{label}</span>
      {value}
    </div>
  );
}
