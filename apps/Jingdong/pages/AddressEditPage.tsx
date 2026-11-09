import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { showToast, wontfix } from '../components/ui';
import { IcCheck, IcChevronDown, IcUsers, IcMapPin, IcNavBack } from '../res/icons';

const REGION_NODES = [
  { id: 'r_sh', name: '上海市 浦东新区' },
  { id: 'r_hn', name: '河南省 郑州市 金水区' },
  { id: 'r_js', name: '江苏省 南京市 玄武区' },
  { id: 'r_bj', name: '北京市 朝阳区' },
  { id: 'r_gd', name: '广东省 深圳市 南山区' },
];
const TAGS = ['学校', '家', '公司', '自定义'];

// 新增/编辑地址 — 复刻截图 217:收货人 / 手机号 / 地图选址·地区选址 / 详细地址 / 设为默认 / 使用场景 / 地址标签 / 确认。
// 编辑态右上角「删除」→ 确认弹窗后真正移除地址。
export function AddressEditPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const { search } = useLocation();
  const editId = new URLSearchParams(search).get('id') || '';

  const addresses = useJingdongStore((s) => s.addresses);
  const saveAddress = useJingdongStore((s) => s.saveAddress);
  const removeAddress = useJingdongStore((s) => s.removeAddress);
  const editing = editId ? addresses.find((a) => a.id === editId) : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [region, setRegion] = useState(editing?.region ?? '');
  const [detail, setDetail] = useState(editing?.detail ?? '');
  const [tag, setTag] = useState(editing?.tag ?? '');
  const [isDefault, setIsDefault] = useState(editing?.isDefault ?? false);
  const [scene, setScene] = useState<'shop' | 'miao'>('shop');
  const [mode, setMode] = useState<'map' | 'region'>('map'); // 地图选址 / 地区选址
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = () => {
    if (!name.trim()) return showToast('请填写收货人');
    if (!phone.trim()) return showToast('请填写手机号');
    if (!region.trim()) return showToast('请选择所在地区');
    saveAddress({
      id: editId || undefined,
      name: name.trim(),
      phone: phone.trim(),
      region: region.trim(),
      detail: detail.trim(),
      tag: tag || '自定义',
      isDefault,
    });
    showToast('保存成功');
    back();
  };

  const doDelete = () => {
    if (!editId) return;
    removeAddress(editId);
    setConfirmDelete(false);
    showToast('地址已删除');
    back();
  };

  const field = 'flex-1 text-[15px] text-[#1A1A1A] placeholder:text-[#BBB] bg-transparent outline-none';

  return (
    <div className="relative flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 标题 + 编辑态右上角「删除」 */}
      <div className="shrink-0 h-11 flex items-center px-2 text-[#333]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center -ml-1">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[17px] font-medium truncate px-1">
          {editId ? '编辑地址' : '新增收货地址'}
        </div>
        {editId ? (
          <button
            {...bindTap({ kind: 'action', id: 'address.delete.show' }, { onTrigger: () => setConfirmDelete(true) })}
            className="min-w-9 h-9 px-1 flex items-center justify-center text-[15px] text-[#333]"
          >
            删除
          </button>
        ) : (
          <span className="w-9" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-scroll-container="addressedit-scroll" data-scroll-direction="vertical">
        {/* 收货人 / 手机号 */}
        <div className="bg-white rounded-2xl px-4">
          <div className="flex items-center h-14 border-b border-[#F5F5F5]">
            <span className="w-16 text-[15px] text-[#1A1A1A]">收货人</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="请填写收货人姓名" />
            <button onClick={wontfix} className="flex items-center gap-1 text-[13px] text-[#666]">
              <IcUsers size={16} />通讯录
            </button>
          </div>
          <div className="flex items-center h-14">
            <span className="w-16 text-[15px] text-[#1A1A1A]">手机号</span>
            <span className="flex items-center text-[15px] text-[#1A1A1A] mr-2">+86<IcChevronDown size={14} className="text-[#999]" /></span>
            <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请填写收货人手机号" inputMode="numeric" />
          </div>
        </div>

        {/* 选址卡 */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setMode('map')}
              className={`flex-1 py-3 text-center text-[15px] ${mode === 'map' ? 'font-semibold text-[#1A1A1A] bg-white' : 'text-[#999] bg-[#F7F7F7]'}`}
            >
              地图选址
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'address.region.show' }, { onTrigger: () => setMode('region') })}
              className={`flex-1 py-2 text-center leading-tight ${mode === 'region' ? 'font-semibold text-[#1A1A1A] bg-white' : 'text-[#999] bg-[#F7F7F7]'}`}
            >
              <div className="text-[15px]">地区选址</div>
              <div className="text-[10px] text-[#BBB]">（含港澳台及海外）</div>
            </button>
          </div>

          {mode === 'region' ? (
            <div className="py-1">
              {REGION_NODES.map((r) => (
                <button
                  key={r.id}
                  {...bindTap(
                    { kind: 'action', id: 'address.region.select.node' },
                    { params: { regionId: r.id }, onTrigger: () => { setRegion(r.name); setMode('map'); } },
                  )}
                  className="w-full flex items-center justify-between px-4 h-12 text-[15px] text-[#333] border-b border-[#F7F7F7] last:border-0"
                >
                  <span>{r.name}</span>
                  {region === r.name && <IcCheck size={16} className="text-[#E1251B]" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4">
              <div className="flex items-center h-14 border-b border-[#F5F5F5]">
                <span className="w-16 text-[15px] text-[#1A1A1A]">地址</span>
                <span className={`flex-1 text-[15px] ${region ? 'text-[#1A1A1A]' : 'text-[#BBB]'}`}>{region || '选择收货地址'}</span>
                <IcMapPin size={18} className="text-[#E1251B]" />
              </div>
              <div className="flex items-center h-14 border-b border-[#F5F5F5]">
                <span className="w-16 text-[15px] text-[#1A1A1A]">门牌号</span>
                <input className={field} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="为配送顺利，请确认门牌号准确" />
              </div>
              <button onClick={wontfix} className="w-full py-3 flex items-center justify-center gap-1 text-[13px] text-[#666]">
                地址粘贴板<IcChevronDown size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 设为默认 */}
        <div className="bg-white rounded-2xl px-4 py-3.5 flex items-start justify-between">
          <div className="pr-4">
            <div className="text-[15px] text-[#1A1A1A]">设为购物默认地址</div>
            <div className="text-[12px] text-[#999] mt-0.5 leading-snug">仅快递商品可优先使用该默认地址，秒送/外卖暂不支持</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'address.default.toggle' }, { onTrigger: () => setIsDefault((v) => !v) })}
            className={`mt-1 w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${
              isDefault ? 'bg-[#E1251B]' : 'border border-[#CCC]'
            }`}
          >
            {isDefault && <IcCheck size={15} className="text-white" />}
          </button>
        </div>

        {/* 使用场景 + 地址标签 */}
        <div className="bg-white rounded-2xl px-4 py-4 space-y-4">
          <div className="flex items-center">
            <span className="w-20 text-[15px] text-[#1A1A1A]">使用场景</span>
            <div className="flex gap-3">
              {([['shop', '购物'], ['miao', '秒送/外卖']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setScene(k)}
                  className={`px-4 h-8 rounded-md text-[13px] ${scene === k ? 'bg-[#FDECEA] text-[#E1251B]' : 'bg-[#F5F5F5] text-[#333]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start">
            <span className="w-20 text-[15px] text-[#1A1A1A] pt-1">地址标签</span>
            <div className="flex flex-wrap gap-3">
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-4 h-8 rounded-md text-[13px] ${tag === t ? 'bg-[#FDECEA] text-[#E1251B]' : 'bg-[#F5F5F5] text-[#333]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 确认 */}
      <div className="shrink-0 bg-white px-4 py-2.5 border-t border-[#F0F0F0]">
        <button
          {...bindTap({ kind: 'action', id: 'address.form.save' }, { onTrigger: save })}
          className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium"
        >
          确认
        </button>
      </div>

      {/* 删除确认弹窗 */}
      {confirmDelete && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-10">
          <div
            {...bindTap({ kind: 'action', id: 'address.delete.cancel' }, { onTrigger: () => setConfirmDelete(false) })}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-[300px] bg-white rounded-2xl overflow-hidden">
            <div className="px-5 pt-6 pb-5 text-center text-[16px] text-[#1A1A1A] leading-relaxed">
              是否删除该地址
            </div>
            <div className="flex border-t border-[#EEE]">
              <button
                {...bindTap({ kind: 'action', id: 'address.delete.cancel' }, { onTrigger: () => setConfirmDelete(false) })}
                className="flex-1 h-12 text-[16px] text-[#666] border-r border-[#EEE]"
              >
                取消
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'address.delete.confirm' }, { onTrigger: doDelete })}
                className="flex-1 h-12 text-[16px] text-[#E1251B] font-medium"
              >
                删除地址
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
