/**
 * 备孕模式介绍全屏页(浅粉渐变,右上×)。
 * spec: mode.prepIntro;证据 screenshot 114_4 / frame r6@4。
 */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, Img } from '../components/ui';
import { IcClose } from '../res/icons';

const Pink = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold" style={{ color: MY.primary }}>{children}</span>
);

export default function PrepIntroPage() {
  const { bindTap, bindBack } = useMeiyouGestures();
  const prepEnabled = useMeiyouStore((st) => st.prepEnabled);

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: 'linear-gradient(180deg, #FFE4EE 0%, #FFF3F7 40%, #FFFFFF 100%)' }}
    >
      {/* 右上× */}
      <div className="flex justify-end px-3 pt-2 shrink-0">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="关闭">
          <IcClose size={24} className="text-[#666]" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col px-5">
        {/* 大标题+副标 */}
        <div className="text-center">
          <div className="text-[26px] font-bold text-[#1A1A1A]">备孕模式</div>
          <div className="mt-1.5 text-[14px] text-[#666]">孩子是礼物,美柚让等待更有温度</div>
        </div>

        {/* 三行卖点卡 */}
        <div className="bg-white/90 rounded-2xl mt-5 px-4 py-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ background: '#FFE3ED' }}>💡</div>
            <div className="ml-3 text-[15px] text-[#333]">
              了解每日的 <Pink>怀孕几率</Pink> 和 <Pink>爱爱建议</Pink>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ background: '#FFE3ED' }}>📅</div>
            <div className="ml-3 text-[15px] text-[#333]">
              精准的 <Pink>排卵日预测</Pink>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0" style={{ background: '#FFE3ED' }}>👫</div>
            <div className="ml-3 text-[15px] text-[#333]">
              <Pink>备孕亲友版</Pink> 一起备孕更高效
            </div>
          </div>
        </div>

        {/* 3D插画 */}
        <div className="flex-1 flex items-end justify-center min-h-0 pb-3">
          <Img
            src="/@app-assets/Meiyou/gen/illu_prep_intro.png"
            className="max-h-full w-56 object-contain"
            alt=""
          />
        </div>
      </div>

      {/* 底部大按钮:未开启→进设置页;已开启→同样进设置页(文案区分) */}
      <div className="px-5 pb-6 shrink-0">
        <button
          {...bindTap('meiyou.prepsetup-open')}
          className="w-full h-12 rounded-full border-none cursor-pointer text-[16px] font-semibold text-white"
          style={{ background: MY.primary }}
        >
          {prepEnabled ? '切换到备孕模式' : '开启备孕模式'}
        </button>
      </div>
    </div>
  );
}
