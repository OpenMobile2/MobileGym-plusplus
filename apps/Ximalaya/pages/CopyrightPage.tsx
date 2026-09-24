import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar, Img, showToast, wontfix } from '../components/ui';
import { useXimalayaStore } from '../state';
import { IcPlus, IcChevronRight } from '../res/icons';

const COPYRIGHT_TYPES = ['著作权', '商标权', '肖像权', '其他'];

export function CopyrightPage() {
  const { bindTap, back } = useXimalayaGestures();
  const albums = useXimalayaStore((st) => st.albums);
  const player = useXimalayaStore((st) => st.player);
  const album = albums.find((a) => a.id === player.currentAlbumId) ?? albums[0];

  const [type, setType] = useState<string>('著作权');   // 版权类型(无声明 id,本地态)
  const [work, setWork] = useState('');
  const [author, setAuthor] = useState('');
  const [phone, setPhone] = useState('');

  const submit = () => { showToast('已提交'); back(); };

  const inputField = (field: string, value: string, set: (v: string) => void, placeholder: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...bindTap({ kind: 'action', id: 'copyright.input.input' }, { params: { field, value }, onTrigger: () => {} })}
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={placeholder}
      className="flex-1 text-[14px] text-[#333] text-right outline-none bg-transparent"
      {...extra}
    />
  );

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="版权申诉" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* Banner */}
        <div className="mx-3 mt-3 rounded-xl bg-gradient-to-r from-[#FFF3E6] to-[#FFE9D6] px-4 py-4">
          <div className="text-[16px] font-semibold text-[#8A5A22]">尊重创作 · 保护版权</div>
          <div className="text-[12px] text-[#A97C4A] mt-1">如你的作品被侵权,请提交申诉,我们将尽快核实处理。</div>
        </div>

        {/* 申诉声音 */}
        <div className="bg-white mt-3 px-4 py-3">
          <div className="text-[13px] text-[#999] mb-2">申诉声音</div>
          <div className="flex items-center gap-3">
            <Img src={album.cover} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[14px] text-[#333] truncate">{album.title}</div>
              <div className="text-[12px] text-[#999] truncate">{album.anchorName}</div>
            </div>
          </div>
        </div>

        {/* 版权类型(本地单选) */}
        <div className="bg-white mt-3 px-4 py-3">
          <div className="text-[13px] text-[#999] mb-2">版权类型</div>
          <div className="flex flex-wrap gap-2">
            {COPYRIGHT_TYPES.map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={'px-3 py-1.5 rounded-full text-[13px] border ' + (active ? 'border-[#FF7D00] text-[#FF7D00] bg-[#FFF3E6]' : 'border-[#DDD] text-[#666]')}
                >{t}</button>
              );
            })}
          </div>
        </div>

        {/* 作品/著作人/手机号 */}
        <div className="bg-white mt-3">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
            <span className="text-[14px] text-[#333] shrink-0 mr-3">作品名称</span>
            {inputField('work', work, setWork, '请输入作品名称')}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
            <span className="text-[14px] text-[#333] shrink-0 mr-3">著作人名称</span>
            {inputField('author', author, setAuthor, '请输入著作人名称')}
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-[14px] text-[#333] shrink-0 mr-3">联系人手机号</span>
            {inputField('phone', phone, setPhone, '请输入手机号', { type: 'tel', inputMode: 'numeric', maxLength: 11 })}
          </div>
        </div>

        {/* 证明材料上传(wontfix) */}
        <div className="bg-white mt-3 px-4 py-4">
          <div className="text-[15px] text-[#333] font-medium mb-2">证明材料上传</div>
          <button
            {...bindTap({ kind: 'action', id: 'copyright.upload.wontfix' }, { onTrigger: wontfix })}
            className="w-20 h-20 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#BBB]"
            aria-label="上传证明材料"
          ><IcPlus size={28} /></button>
        </div>

        {/* 在线申请版权认证(wontfix) */}
        <button
          {...bindTap({ kind: 'action', id: 'copyright.apply.wontfix' }, { onTrigger: wontfix })}
          className="w-full bg-white mt-3 px-4 py-3.5 flex items-center justify-between"
        >
          <span className="text-[14px] text-[#333]">在线申请版权认证</span>
          <IcChevronRight size={18} className="text-[#CCC]" />
        </button>

        <div className="h-4" />
      </div>

      {/* 提交(橙) */}
      <div className="shrink-0 p-3 bg-white border-t border-[#F2F2F2]">
        <button
          {...bindTap({ kind: 'action', id: 'copyright.submit.submit' }, { onTrigger: submit })}
          className="w-full h-11 rounded-full bg-[#FF7D00] text-white text-[16px] font-medium"
        >提交</button>
      </div>
    </div>
  );
}
