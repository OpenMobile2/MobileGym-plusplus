import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar, showToast } from '../components/common';
import { IcClose, IcDown, IcPin, IcSearch } from '../res/icons';

const maskPhone = (phone: string) => `${phone.slice(0, 3)}****${phone.slice(-4)}`;

/** 模拟城市与常见地点(用于地址联想;不同城市在本模拟中展示同样的店铺) */
const CITIES = ['南京', '上海', '北京', '深圳'];
const CITY_POIS: Record<string, string[]> = {
  南京: ['新街口德基广场', '夫子庙景区', '南京南站', '仙林大学城', '鼓楼医院', '珠江路科技园', '奥体中心', '江宁万达广场'],
  上海: ['人民广场', '陆家嘴中心', '南京东路步行街', '上海虹桥站', '徐家汇', '静安寺', '外滩', '五角场'],
  北京: ['天安门广场', '中关村', '国贸CBD', '西单大悦城', '北京南站', '望京SOHO', '三里屯', '五道口'],
  深圳: ['深圳北站', '华强北', '腾讯滨海大厦', '深圳湾公园', '东门老街', '车公庙', '科技园', '会展中心'],
};

/** 选择收货地址页(spec address.select,证据 IMG_6060;支持地址联想 + 城市切换) */
export default function AddressSelectPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, back } = useTbsgGestures();
  const [sp] = useSearchParams();

  const city = useTbsgStore((st) => st.city);
  const locationPoi = useTbsgStore((st) => st.locationPoi);
  const addresses = useTbsgStore((st) => st.addresses);
  const currentAddressId = useTbsgStore((st) => st.currentAddressId);
  const setCurrentAddress = useTbsgStore((st) => st.setCurrentAddress);
  const setLocationPoi = useTbsgStore((st) => st.setLocationPoi);
  const setCity = useTbsgStore((st) => st.setCity);
  const pinAddress = useTbsgStore((st) => st.pinAddress);

  const [tipVisible, setTipVisible] = useState(true);
  const [query, setQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const fromCheckout = sp.get('from') === 'checkout';

  /** 联想结果:已有地址 + 各城市常见地点(按关键词/城市名模糊匹配) */
  const suggests = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const addrHits = addresses
      .filter((a) => `${a.poi}${a.detail}${a.name}`.includes(q))
      .map((a) => ({ kind: 'addr' as const, id: a.id, poi: a.poi, sub: `${a.detail} · ${a.name}`, city }));
    const poiHits: { kind: 'poi'; poi: string; sub: string; city: string }[] = [];
    for (const c of CITIES) {
      for (const p of CITY_POIS[c]) {
        if (p.includes(q) || c.includes(q)) poiHits.push({ kind: 'poi', poi: p, sub: `${c}市`, city: c });
      }
    }
    return [...addrHits, ...poiHits].slice(0, 10);
  }, [query, addresses, city]);

  const pickPoi = (poi: string, c: string) => { setCity(c); setLocationPoi(poi); back(); };
  const pickAddr = (id: string, poi: string) => { setCurrentAddress(id); setLocationPoi(poi); back(); };

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title={s.selectAddress} />

      {/* 城市 + 搜索框 */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0 relative">
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'address.city.select' }, {
            params: { city }, onTrigger: () => setCityOpen((v) => !v),
          })}
          className="flex items-center gap-1 text-[16px] font-semibold text-[#1A1A1A] bg-transparent border-none cursor-pointer shrink-0"
        >
          {city}
          <IcDown size={14} className="text-[#666666]" />
        </button>
        <div className="flex-1 h-10 rounded-lg bg-[#F3F6F8] flex items-center px-3 gap-2">
          <IcSearch size={16} className="text-[#BBBBBB]" />
          <input
            {...bindTap<HTMLInputElement>({ kind: 'action', id: 'address.search.input' }, { onTrigger: () => {} })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="请输入地址"
            className="flex-1 min-w-0 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="清空" className="bg-transparent border-none cursor-pointer p-0 shrink-0">
              <IcClose size={15} className="text-[#BBBBBB]" />
            </button>
          )}
        </div>
        {/* 城市下拉 */}
        {cityOpen && (
          <div className="absolute left-4 top-[52px] z-30 w-28 bg-white rounded-lg shadow-lg border border-[#EEEEEE] overflow-hidden">
            {CITIES.map((c) => (
              <button
                key={c}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'address.city.select' }, {
                  params: { city: c }, onTrigger: () => { setCity(c); setCityOpen(false); },
                })}
                className={`w-full text-left px-3 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${c === city ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 联想结果(输入时覆盖列表) */}
      {suggests ? (
        <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-4">
          {suggests.length === 0 ? (
            <div className="py-16 text-center text-[14px] text-[#999999]">找不到相应地址,换个词试试</div>
          ) : (
            suggests.map((sug) => (
              <button
                key={`${sug.kind}-${sug.poi}-${sug.sub}`}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'address.search.pick' }, {
                  params: { poi: sug.poi },
                  onTrigger: () => (sug.kind === 'addr' ? pickAddr(sug.id, sug.poi) : pickPoi(sug.poi, sug.city)),
                })}
                className="w-full flex items-center gap-2.5 py-3.5 border-b border-[#F0F0F0] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
              >
                <IcPin size={16} className="text-[#ED6C2C] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] text-[#1A1A1A] truncate">{sug.poi}</div>
                  <div className="text-[12px] text-[#999999] truncate">{sug.sub}</div>
                </div>
                {sug.kind === 'addr' && <span className="text-[11px] text-[#ED6C2C] bg-[#FDEEE3] rounded px-1 py-0.5 shrink-0">已存</span>}
              </button>
            ))
          )}
        </div>
      ) : (
        <>
          {/* 当前定位 */}
          <div className="px-4 pt-2 shrink-0">
            <div className="text-[13px] text-[#999999]">当前定位</div>
            <div className="flex items-center py-2.5 border-b border-[#F0F0F0]">
              <IcPin size={16} className="text-[#1A1A1A] shrink-0" />
              <span className="ml-2 flex-1 text-[17px] font-semibold text-[#1A1A1A] truncate">{locationPoi}</span>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'address.relocate.stub' },
                  { onTrigger: () => showToast(s.notOpen) },
                )}
                className="text-[14px] text-[#ED6C2C] bg-transparent border-none cursor-pointer shrink-0"
              >
                重新定位
              </button>
            </div>
          </div>

          {/* 闪购收货地址列表 */}
          <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-4">
            <div className="text-[13px] text-[#999999] pt-3 pb-1">闪购收货地址</div>
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start py-3.5 border-b border-[#F0F0F0]">
                <span className="w-7 shrink-0 pt-1">
                  {currentAddressId === a.id && (
                    <span className="w-5 h-5 rounded-full bg-[#ED6C2C] text-white text-[12px] flex items-center justify-center">✓</span>
                  )}
                </span>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  {...(fromCheckout
                    ? bindTap<HTMLDivElement>('address.select.pick', { beforeTrigger: () => { setCurrentAddress(a.id); setLocationPoi(a.poi); } })
                    : bindBack<HTMLDivElement>({ beforeTrigger: () => { setCurrentAddress(a.id); setLocationPoi(a.poi); } }))}
                >
                  <div className="text-[17px] font-semibold text-[#1A1A1A] leading-snug">{a.poi} {a.detail}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {a.isDefault && (
                      <span className="text-[11px] text-[#ED6C2C] bg-[#FDEEE3] rounded px-1 py-0.5">常用</span>
                    )}
                    <span className="text-[13px] text-[#999999]">{a.name} {a.gender}</span>
                    <span className="text-[13px] text-[#999999]">{maskPhone(a.phone)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-1 ml-2">
                  <button
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'address.select.pin' },
                      { params: { addressId: a.id }, onTrigger: () => pinAddress(a.id) },
                    )}
                    className="text-[14px] text-[#666666] bg-transparent border-none cursor-pointer"
                  >
                    置顶
                  </button>
                  <span className="w-px h-3.5 bg-[#DDDDDD]" />
                  <button
                    {...bindTap<HTMLButtonElement>('address.select.edit-open', { params: { id: a.id } })}
                    className="text-[14px] text-[#666666] bg-transparent border-none cursor-pointer"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 清理提示条 */}
          {tipVisible && (
            <div className="shrink-0 mx-3 mb-2 rounded-lg bg-[#FDF3E7] flex items-center px-3 py-2.5">
              <span className="text-[16px] shrink-0">🧹</span>
              <span className="ml-2 flex-1 text-[13px] text-[#B4551E] truncate">发现大量地址长时间不使用,建议清除</span>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'address.batchclear.stub' },
                  { onTrigger: () => showToast(s.notOpen) },
                )}
                className="ml-2 h-7 px-2.5 rounded-md bg-[#ED6C2C] text-white text-[12px] font-semibold border-none cursor-pointer shrink-0"
              >
                批量清除
              </button>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'address.tip.close' },
                  { onTrigger: () => setTipVisible(false) },
                )}
                aria-label="关闭提示"
                className="ml-1 w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
              >
                <IcClose size={15} className="text-[#B4551E]" />
              </button>
            </div>
          )}
        </>
      )}

      {/* 新增收货地址 */}
      <div className="shrink-0 px-3 pb-3 pt-1">
        <button
          {...bindTap<HTMLButtonElement>('address.select.add-open')}
          className="w-full h-12 rounded-full bg-[#FADCC4] text-[#B4551E] text-[16px] font-semibold border-none cursor-pointer"
        >
          新增收货地址
        </button>
      </div>
    </div>
  );
}
