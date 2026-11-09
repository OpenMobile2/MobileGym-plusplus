import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

export default function CollectPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const Card = ({ icon, label, bind }: { icon: string; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="flex flex-1 flex-col items-center gap-2 rounded-2xl bg-[#F4F6F9] py-8">
      <div className="text-3xl">{icon}</div><span className="text-sm text-[#33405C]">{label}</span>
    </button>
  );
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.myCollect} />
      <div className="grid grid-cols-2 gap-3 p-4">
        <Card icon="📘" label={s.wordbook} bind={bindTap('collect.wordbook.open')} />
        <Card icon="📄" label="小讲堂文章" bind={action('collect.article.wontfixToast', toast)} />
        <Card icon="🛍️" label="商品" bind={action('collect.goods.wontfixToast', toast)} />
      </div>
    </div>
  );
}
