import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcRight } from '../res/icons';

/** 帮助与支持(裁定3:我的页 🎧 = 客服/帮助反馈)。 */
export default function SupportPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.support} />
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          <button {...bindTap('support.faq.open')}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            查看热门问题 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...action('support.dev.wontfixToast', () => st.showNotice(s.notAvailable))}
            className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-[#424242]">
            找开发者 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
