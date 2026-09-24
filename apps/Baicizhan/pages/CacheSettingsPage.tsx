import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader, Row } from '../components/common';

const ITEMS = [
  { key: 'book', label: '词书' },
  { key: 'radio', label: '单词电台' },
  { key: 'readAudio', label: '阅读计划音频' },
  { key: 'examAudio', label: '真题音频' },
  { key: 'other', label: '清除其他缓存' },
];

export default function CacheSettingsPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.cacheManage} />
      <div className="mt-2">
        {ITEMS.map((it) => (
          <Row key={it.key} label={it.label} right={cleared[it.key] ? '0 B' : `${(it.label.length * 3.2).toFixed(1)} MB`}
            bind={action('cache.clear.item', () => { setCleared((c) => ({ ...c, [it.key]: true })); st.showToast('已清除'); }, { params: { cacheType: it.key } })} />
        ))}
      </div>
    </div>
  );
}
