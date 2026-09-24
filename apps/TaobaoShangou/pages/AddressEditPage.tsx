import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { CenterDialog, Sheet, TopBar, showToast } from '../components/common';
import { IcRight, IcTrash } from '../res/icons';

const POI_LIST = [
  '阳光花园小区', '紫金学府', '万达茂公寓B座', '东城汇写字楼',
  '仙林大学城学生公寓', '和园小区', '金鹰天地', '南大和园',
];

const TAGS = ['家', '公司', '学校', '父母', '朋友', '自定义'];

/** 新增/修改收货地址页(spec address.edit,证据 IMG_6038/6039/6061) */
export default function AddressEditPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, back } = useTbsgGestures();
  const [sp, setSp] = useSearchParams();

  const spId = sp.get('id');
  const panel = sp.get('panel');
  const addresses = useTbsgStore((st) => st.addresses);
  const saveAddress = useTbsgStore((st) => st.saveAddress);
  const deleteAddress = useTbsgStore((st) => st.deleteAddress);

  const addr = addresses.find((a) => a.id === spId);
  const isEdit = !!addr;

  const [poi, setPoi] = useState(addr?.poi ?? '');
  const [detail, setDetail] = useState(addr?.detail ?? '');
  const [name, setName] = useState(addr?.name ?? '');
  const [gender, setGender] = useState<'先生' | '女士'>(addr?.gender ?? '先生');
  const [phone, setPhone] = useState(addr?.phone ?? '');
  const [tag, setTag] = useState(addr?.tag ?? '');

  const valid = !!poi && !!detail && !!name && /^1\d{10}$/.test(phone);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        title={isEdit ? s.editAddress : '新增收货地址'}
        right={isEdit ? (
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'address.edit.delete' },
              { onTrigger: () => setSp((p) => { p.set('panel', 'delconfirm'); return p; }) },
            )}
            aria-label="删除地址"
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          >
            <IcTrash size={19} className="text-[#1A1A1A]" />
          </button>
        ) : undefined}
      />

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        {/* 静态地图预览 */}
        <div
          className="h-36 flex flex-col items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(160deg,#E6F0E2 0%,#E4EAEE 55%,#DDE6EC 100%)' }}
        >
          <span className="text-[32px] leading-none">📍</span>
          {poi && <span className="mt-1 text-[12px] text-[#666666] bg-white/80 rounded px-1.5 py-0.5">{poi}</span>}
        </div>

        {/* 粘贴智能识别(整行可点) */}
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'address.edit.smartpaste.stub' },
            { onTrigger: () => showToast(s.notOpen) },
          )}
          className="mx-4 mt-3 w-[calc(100%-32px)] h-12 rounded-lg bg-[#F3F6F8] flex items-center px-3 border-none cursor-pointer text-left"
        >
          <span className="flex-1 text-[14px] text-[#BBBBBB] truncate">粘贴文本,智能识别地址信息</span>
          <span className="h-8 px-3 rounded-full bg-white text-[13px] text-[#1A1A1A] border border-[#E5E5E5] shrink-0 flex items-center">
            粘贴
          </span>
        </button>

        {/* 表单 */}
        <div className="px-4">
          {/* 地址(POI) */}
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'address.edit.poi.open' },
              { onTrigger: () => setSp((p) => { p.set('panel', 'poi'); return p; }) },
            )}
            className="w-full flex items-center py-4 border-b border-[#F0F0F0] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
          >
            <span className="w-20 text-[16px] font-semibold text-[#1A1A1A] shrink-0">地址</span>
            <span className={`flex-1 text-[16px] truncate ${poi ? 'text-[#1A1A1A]' : 'text-[#ED6C2C]'}`}>
              {poi || s.selectAddress}
            </span>
            <IcRight size={16} className="text-[#BBBBBB] shrink-0" />
          </button>

          {/* 门牌号 */}
          <div className="flex items-center py-4 border-b border-[#F0F0F0]">
            <span className="w-20 text-[16px] font-semibold text-[#1A1A1A] shrink-0">门牌号</span>
            <input
              {...bindTap<HTMLInputElement>(
                { kind: 'action', id: 'address.edit.input' },
                { onTrigger: () => {} },
              )}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="填写详细地址,例:1层102室"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
          </div>

          {/* 收货人 + 性别 */}
          <div className="flex items-center py-4 border-b border-[#F0F0F0]">
            <span className="w-20 text-[16px] font-semibold text-[#1A1A1A] shrink-0">收货人</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="填写收货人姓名"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
            {(['先生', '女士'] as const).map((g) => (
              <button
                key={g}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'address.edit.gender' },
                  { params: { gender: g }, onTrigger: () => setGender(g) },
                )}
                className="flex items-center gap-1 ml-3 bg-transparent border-none cursor-pointer shrink-0"
              >
                <span className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center ${
                  gender === g ? 'border-[#ED6C2C]' : 'border-[#CCCCCC]'
                }`}
                >
                  {gender === g && <span className="w-2.5 h-2.5 rounded-full bg-[#ED6C2C]" />}
                </span>
                <span className="text-[15px] text-[#1A1A1A]">{g}</span>
              </button>
            ))}
          </div>

          {/* 手机号 */}
          <div className="flex items-center py-4 border-b border-[#F0F0F0]">
            <span className="w-20 text-[16px] font-semibold text-[#1A1A1A] shrink-0">手机号</span>
            <span className="text-[16px] text-[#1A1A1A] shrink-0 mr-3">+86</span>
            <span className="w-px h-4 bg-[#E5E5E5] shrink-0 mr-3" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="填写正确的收货人号码"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[16px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
          </div>

          {/* 地址标签 */}
          <div className="py-4">
            <div className="text-[16px] font-semibold text-[#1A1A1A]">地址标签</div>
            <div className="flex flex-wrap gap-2.5 mt-3">
              {TAGS.map((t) => (
                <button
                  key={t}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'address.edit.tag' },
                    { params: { tag: t }, onTrigger: () => setTag(t) },
                  )}
                  className={`h-9 px-4 rounded-lg text-[14px] cursor-pointer ${
                    tag === t
                      ? 'bg-[#FDEEE3] text-[#ED6C2C] border border-[#ED6C2C] font-semibold'
                      : 'bg-[#F3F6F8] text-[#1A1A1A] border border-transparent'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 保存 */}
          {valid ? (
            <button
              {...bindTap<HTMLButtonElement>('address.edit.save', {
                beforeTrigger: () => saveAddress({
                  id: spId || undefined,
                  poi, detail, name, gender, phone, tag,
                  isDefault: addr?.isDefault ?? false,
                  pinned: addr?.pinned ?? false,
                }),
              })}
              className="w-full h-12 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer mt-4 mb-6"
            >
              {s.save}
            </button>
          ) : (
            <button
              onClick={() => showToast('请完整填写收货信息')}
              className="w-full h-12 rounded-full bg-[#F7C4A3] text-white text-[16px] font-semibold border-none cursor-pointer mt-4 mb-6"
            >
              {s.save}
            </button>
          )}
        </div>
      </div>

      {/* POI 选择面板 */}
      {panel === 'poi' && (
        <Sheet maxH="65%">
          <div className="px-4 py-3 text-[16px] font-bold text-[#1A1A1A] text-center shrink-0">{s.selectAddress}</div>
          <div data-scroll-container="poi" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-4 pb-4">
            {POI_LIST.map((p) => (
              <button
                key={p}
                onClick={() => { setPoi(p); back(); }}
                className="w-full text-left py-3.5 border-b border-[#F0F0F0] bg-transparent border-x-0 border-t-0 cursor-pointer text-[15px] text-[#1A1A1A]"
              >
                {p}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 删除确认弹窗 */}
      {panel === 'delconfirm' && (
        <CenterDialog>
          <div className="text-[16px] font-semibold text-[#1A1A1A] text-center py-3">确认删除该地址?</div>
          <div className="flex gap-3 mt-2">
            <button
              {...bindBack<HTMLButtonElement>()}
              className="flex-1 h-10 rounded-full bg-[#F3F6F8] text-[#1A1A1A] text-[15px] border-none cursor-pointer"
            >
              {s.cancel}
            </button>
            <button
              onClick={() => {
                if (spId) deleteAddress(spId);
                back();
                back();
              }}
              className="flex-1 h-10 rounded-full bg-[#ED6C2C] text-white text-[15px] font-semibold border-none cursor-pointer"
            >
              {s.confirm}
            </button>
          </div>
        </CenterDialog>
      )}
    </div>
  );
}
