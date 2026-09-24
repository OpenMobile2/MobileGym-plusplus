import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Sheet from '../components/Sheet';
import { IcChevronDown, IcMic, IcCamera } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { TAGS_ADDRESS, TAGS_RELATION } from '../constants';
import { CAINIAO_CONFIG } from '../data';
import { useI18n } from '../i18n';

/** 新增/编辑地址(spec ship.address.edit)+ 省市区弹层 + 设置标签弹层 */
export default function AddressEditPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, back } = useCainiaoGestures();
  const { t } = useI18n();
  const { search } = useLocation();
  const sheet = new URLSearchParams(search).get('sheet');

  const draft = useCainiaoStore((s) => s.addressDraft);
  const setAddressDraft = useCainiaoStore((s) => s.setAddressDraft);
  const saveAddress = useCainiaoStore((s) => s.saveAddress);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));
  const [parseText, setParseText] = React.useState('');

  const d = draft ?? {};
  const landline = d.phoneType === 'landline';
  const regionText = d.province ? `${d.province} ${d.city} ${d.district}` : '';

  const parseSmart = () => {
    // 简易识别:姓名, 电话, 省市区+详细地址(spec:粘贴并识别做文本解析)
    const text = parseText.trim();
    if (!text) return showToast('请先粘贴或输入文本');
    const phone = (text.match(/1\d{10}/) ?? [])[0] ?? '';
    const provinces = Object.keys(CAINIAO_CONFIG.regions.省份);
    let province = '', city = '', district = '';
    for (const p of provinces) {
      const pi = text.indexOf(p);
      if (pi >= 0) {
        province = p;
        const cities = CAINIAO_CONFIG.regions.省份[p as keyof typeof CAINIAO_CONFIG.regions.省份] as Record<string, string[]>;
        for (const c of Object.keys(cities)) {
          if (text.includes(c)) {
            city = c;
            for (const dd of cities[c]) if (text.includes(dd)) district = dd;
            break;
          }
        }
        break;
      }
    }
    const name = text.split(/[,，\s]/).map((x) => x.trim()).find((x) => x && !/\d/.test(x) && x.length <= 4) ?? '';
    let detail = text;
    for (const cut of [name, phone, province, city, district]) if (cut) detail = detail.replace(cut, '');
    detail = detail.replace(/[,，\s]+/g, ' ').trim();
    setAddressDraft({ name: name || d.name, phone: phone || d.phone, province, city, district, detail });
    showToast('已识别');
  };

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title={d.id ? '编辑地址' : t('ship.newAddress')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 智能识别区 */}
        <div className="mt-2 overflow-hidden rounded-2xl bg-(--app-c-card-bg)">
          <div className="bg-[#1668DC] px-3 py-2 text-[13px] text-white">
            示例: 菜小鸟, 136xxxx0000, 浙江省杭州市西湖区某小区
          </div>
          <div className="p-3">
            <textarea
              value={parseText}
              onChange={(e) => setParseText(e.target.value)}
              placeholder='请粘贴或输入文本, 点击"识别"自动识别姓名、电话和地址'
              className="h-16 w-full resize-none border-none bg-transparent text-[13px] outline-none placeholder:text-(--app-c-text-muted)"
            />
            <div className="mt-1 flex items-center gap-2">
              <button {...action('ship.address.ai.wontfixToast', wontfix)} className="flex cursor-pointer items-center gap-1 rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3 py-1.5 text-[13px] text-(--app-c-text-primary)">
                <IcMic size={14} /> AI语音识别
              </button>
              <button {...action('ship.address.ai.wontfixToast', wontfix)} className="flex cursor-pointer items-center gap-1 rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3 py-1.5 text-[13px] text-(--app-c-text-primary)">
                <IcCamera size={14} /> 图片识别
              </button>
              <button
                {...action('ship.address.parse', parseSmart)}
                className="ml-auto cursor-pointer rounded-full border-none bg-(--app-c-brand) px-4 py-1.5 text-[13px] font-semibold text-white"
              >
                粘贴并识别
              </button>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) px-3">
          <div className="flex items-center border-b border-(--app-c-divider) py-3.5">
            <span className="w-20 shrink-0 text-[15px] text-(--app-c-text-primary)">姓名</span>
            <input
              data-action="ship.address.input.name"
              data-action-type="input"
              value={d.name ?? ''}
              onChange={(e) => setAddressDraft({ name: e.target.value })}
              placeholder="请输入姓名"
              className="min-w-0 flex-1 border-none bg-transparent text-[15px] outline-none placeholder:text-(--app-c-text-muted)"
            />
          </div>
          <div className="flex items-center border-b border-(--app-c-divider) py-3.5">
            <span className="w-20 shrink-0 text-[15px] text-(--app-c-text-primary)">{landline ? '座机号' : '手机号'}</span>
            <input
              data-action="ship.address.input.phone"
              data-action-type="input"
              inputMode="numeric"
              value={d.phone ?? ''}
              onChange={(e) => setAddressDraft({ phone: e.target.value.replace(/[^\d-]/g, '') })}
              placeholder={landline ? '请输入座机号' : '请输入手机号'}
              className="min-w-0 flex-1 border-none bg-transparent text-[15px] outline-none placeholder:text-(--app-c-text-muted)"
            />
            {landline && (
              <>
                <span className="mx-1 text-(--app-c-text-muted)">—</span>
                <input
                  data-action="ship.address.input.ext"
                  data-action-type="input"
                  inputMode="numeric"
                  value={d.ext ?? ''}
                  onChange={(e) => setAddressDraft({ ext: e.target.value.replace(/[^\d]/g, '') })}
                  placeholder="分机号"
                  className="w-16 border-none bg-transparent text-[15px] outline-none placeholder:text-(--app-c-text-muted)"
                />
              </>
            )}
            <button
              {...action('ship.address.phoneType.toggle', () => setAddressDraft({ phoneType: landline ? 'mobile' : 'landline' }))}
              className="ml-2 shrink-0 cursor-pointer border-none bg-transparent text-[14px] text-(--app-c-text-primary)"
            >
              {landline ? '切换手机' : '切换座机'}
            </button>
          </div>
          <button {...bindTap('ship.region.open')} className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3.5 text-left">
            <span className="w-20 shrink-0 text-[15px] text-(--app-c-text-primary)">省市区</span>
            <span className={`flex-1 text-[15px] ${regionText ? 'text-(--app-c-text-primary)' : 'text-(--app-c-text-muted)'}`}>
              {regionText || '请选择省市区'}
            </span>
            <IcChevronDown size={16} className="text-(--app-c-text-muted)" />
          </button>
          <div className="flex items-start border-b border-(--app-c-divider) py-3.5">
            <span className="w-20 shrink-0 text-[15px] text-(--app-c-text-primary)">详细地址</span>
            <textarea
              data-action="ship.address.input.detail"
              data-action-type="input"
              value={d.detail ?? ''}
              onChange={(e) => setAddressDraft({ detail: e.target.value })}
              placeholder="请输入街道/小区/乡镇/村等"
              className="h-14 min-w-0 flex-1 resize-none border-none bg-transparent text-[15px] outline-none placeholder:text-(--app-c-text-muted)"
            />
          </div>
          <div className="flex items-center py-3.5">
            <span className="w-20 shrink-0 text-[15px] text-(--app-c-text-primary)">设置标签</span>
            <div className="flex flex-1 justify-end gap-2">
              {TAGS_RELATION.map((tg) => {
                const on = d.tagRelation === tg;
                return (
                  <button
                    key={tg}
                    {...action('ship.address.select.tag', () => setAddressDraft({ tagRelation: on ? undefined : tg }), { params: { value: tg } })}
                    className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-[14px] ${on ? 'border-(--app-c-brand) bg-[#E5F1FF] text-(--app-c-brand)' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'}`}
                  >
                    {tg}
                  </button>
                );
              })}
            </div>
            <button {...bindTap('ship.address.tags.open')} className="ml-1 cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-muted)">
              <IcChevronDown size={16} />
            </button>
          </div>
          <button
            {...action('ship.address.defaultSender.toggle', () => setAddressDraft({ isDefaultSender: !d.isDefaultSender }))}
            className="flex w-full cursor-pointer items-center justify-between border-t border-(--app-c-divider) bg-transparent py-3.5 text-left"
          >
            <span className="text-[15px] text-(--app-c-text-primary)">设为默认发件人</span>
            <span className={`flex h-6 w-11 items-center rounded-full px-0.5 ${d.isDefaultSender ? 'justify-end bg-(--app-c-brand)' : 'justify-start bg-[#C7C7CC]'}`}>
              <span className="h-5 w-5 rounded-full bg-white shadow" />
            </span>
          </button>
          <div className="pb-3 text-right">
            <button {...action('ship.address.clear', () => setAddressDraft({ name: '', phone: '', ext: '', province: '', city: '', district: '', detail: '', tagAddress: undefined, tagRelation: undefined }))} className="cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-secondary)">
              清空
            </button>
          </div>
        </div>
      </div>

      {/* 确定 */}
      <div className="shrink-0 bg-(--app-c-page-bg) px-4 pb-4 pt-2">
        <button
          {...action('ship.address.save', () => {
            if (!d.name || !d.phone || !d.province || !d.detail) {
              showToast('请填写完整地址信息');
              return;
            }
            saveAddress(d);
            back();
          })}
          className="h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
        >
          确定
        </button>
      </div>

      {sheet === 'region' && <RegionSheet />}
      {sheet === 'tags' && <TagsSheet />}
    </div>
  );
}

/** 省市区选择弹层(spec ship.region.sheet):热门城市 + 逐级列表(Q1:A) */
function RegionSheet() {
  const { action, back } = useCainiaoGestures();
  const setAddressDraft = useCainiaoStore((s) => s.setAddressDraft);
  const showToast = useCainiaoStore((s) => s.showToast);
  const [prov, setProv] = React.useState('');
  const [city, setCity] = React.useState('');
  const [dist, setDist] = React.useState('');
  const [query, setQuery] = React.useState('');

  const REG = CAINIAO_CONFIG.regions.省份 as Record<string, Record<string, string[]>>;
  const provinces = Object.keys(REG);
  const cities = prov ? Object.keys(REG[prov]) : [];
  const districts = prov && city ? REG[prov][city] : [];
  const level: 'prov' | 'city' | 'dist' = !prov ? 'prov' : !city ? 'city' : 'dist';
  const options = (level === 'prov' ? provinces : level === 'city' ? cities : districts).filter(
    (o) => !query.trim() || o.includes(query.trim()),
  );
  const done = !!(prov && city && dist);

  const pickHot = (h: string) => {
    // 热门城市:直接定位省市,进入区县级
    for (const p of provinces) {
      for (const c of Object.keys(REG[p])) {
        if (c.startsWith(h) || h.startsWith(c.replace('市', ''))) {
          setProv(p); setCity(c); setDist('');
          return;
        }
      }
    }
    showToast('该城市数据未收录');
  };

  return (
    <Sheet title="城市地区">
      <div className="flex h-9 items-center rounded-full bg-(--app-c-chip-bg) px-3">
        <input
          data-action="ship.region.search"
          data-action-type="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="请输入省份/城市/市区搜索"
          className="min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none placeholder:text-(--app-c-text-muted)"
        />
      </div>
      {level === 'prov' && !query && (
        <>
          <div className="mt-3 flex items-center">
            <span className="text-[14px] font-semibold text-(--app-c-text-primary)">热门城市</span>
            <button {...action('ship.region.intl.wontfixToast', () => showToast('该功能暂未开放'))} className="ml-auto cursor-pointer border-none bg-transparent text-[12px] text-(--app-c-brand)">
              寄港澳台&国外城市 ›
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {CAINIAO_CONFIG.regions.热门城市.map((h) => (
              <button
                key={h}
                {...action('ship.region.select.hot', () => pickHot(h), { params: { value: h } })}
                className="cursor-pointer rounded-lg border border-(--app-c-border) bg-(--app-c-card-bg) py-2 text-[13px] text-(--app-c-text-primary)"
              >
                {h}
              </button>
            ))}
          </div>
        </>
      )}
      {/* 路径 chips */}
      {prov && (
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-(--app-c-text-primary)">
          <button
            {...action('ship.region.select.level', () => { setProv(''); setCity(''); setDist(''); }, { params: { value: prov } })}
            className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-(--app-c-brand)"
          >
            {prov}
          </button>
          {city && (
            <>
              <span className="text-(--app-c-text-muted)">·</span>
              <button
                {...action('ship.region.select.level', () => { setCity(''); setDist(''); }, { params: { value: city } })}
                className="cursor-pointer border-none bg-transparent text-[14px] font-semibold text-(--app-c-brand)"
              >
                {city}
              </button>
            </>
          )}
          {dist && <><span className="text-(--app-c-text-muted)">·</span><span>{dist}</span></>}
        </div>
      )}
      <div className="mt-2 max-h-64 overflow-y-auto" data-scroll-container="region" data-scroll-direction="vertical">
        {options.map((o) => (
          <button
            key={o}
            {...action('ship.region.select.level', () => {
              if (level === 'prov') { setProv(o); setQuery(''); }
              else if (level === 'city') { setCity(o); setQuery(''); }
              else setDist(o);
            }, { params: { value: o } })}
            className={`block w-full cursor-pointer border-b border-(--app-c-divider) bg-transparent py-3 text-left text-[15px] ${
              o === dist ? 'font-semibold text-(--app-c-brand)' : 'text-(--app-c-text-primary)'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <button
        {...action('ship.region.confirm', () => {
          if (!done) return;
          setAddressDraft({ province: prov, city, district: dist });
          back();
        })}
        className={`mt-3 h-12 w-full rounded-full border-none text-[16px] font-bold text-white ${done ? 'cursor-pointer bg-(--app-c-brand)' : 'bg-[#B9CDF3]'}`}
      >
        确定
      </button>
    </Sheet>
  );
}

/** 设置标签弹层(a177):两组不互斥,组内单选 */
function TagsSheet() {
  const { action, back } = useCainiaoGestures();
  const draft = useCainiaoStore((s) => s.addressDraft);
  const setAddressDraft = useCainiaoStore((s) => s.setAddressDraft);
  const [tagA, setTagA] = React.useState(draft?.tagAddress);
  const [tagR, setTagR] = React.useState(draft?.tagRelation);

  const chip = (label: string, on: boolean, onTap: () => void) => (
    <button
      key={label}
      {...action('ship.address.tags.select.tag', onTap, { params: { value: label } })}
      className={`flex-1 cursor-pointer rounded-lg border py-2.5 text-center text-[14px] ${on ? 'border-(--app-c-brand) bg-[#E5F1FF] font-semibold text-(--app-c-brand)' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'}`}
    >
      {label}
    </button>
  );

  return (
    <Sheet title="设置标签">
      <div className="text-[14px] font-semibold text-(--app-c-text-primary)">地址标签</div>
      <div className="mt-2 flex gap-2">
        {TAGS_ADDRESS.map((tg) => chip(tg, tagA === tg, () => setTagA(tagA === tg ? undefined : tg)))}
      </div>
      <div className="mt-4 text-[14px] font-semibold text-(--app-c-text-primary)">关系标签</div>
      <div className="mt-2 flex gap-2">
        {TAGS_RELATION.map((tg) => chip(tg, tagR === tg, () => setTagR(tagR === tg ? undefined : tg)))}
      </div>
      <button
        {...action('ship.address.tags.save', () => { setAddressDraft({ tagAddress: tagA, tagRelation: tagR }); back(); })}
        className="mt-6 h-12 w-full cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[16px] font-bold text-white"
      >
        保存
      </button>
    </Sheet>
  );
}
