import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, OrangeBtn, C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { copyToClipboard, shareWithSystem } from '../capabilities';

// 行程分享(入口见 recA 接驾页)。节点: trip.share
export default function TripSharePage() {
  const { bindTap } = useDidiGestures();
  const trip = useDidiStore((s) => s.trip);
  const toast = useDidiStore((s) => s.toast);
  const plate = trip.driver ? `${trip.driver.plate}·${trip.driver.plateColor}` : '测试·A004·黑';
  const shareText = `【滴滴】行程实时分享：${trip.from} → ${trip.to || '目的地'}`;
  const shareUrl = `https://mock.didi.test/trip/share?from=${encodeURIComponent(trip.from)}&to=${encodeURIComponent(trip.to || '目的地')}`;

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="行程分享" />
      <div className="flex-1 overflow-y-auto p-3">
        <Card className="overflow-hidden mb-3">
          <MapCanvas route height={130} />
          <div className="p-4">
            <div className="text-[16px] font-semibold text-app-text">{plate}</div>
            <div className="mt-2 text-[13px] text-app-text">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: C.green }} />
              {trip.from}
            </div>
            <div className="mt-1 text-[13px] text-app-text">
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: C.orange }} />
              {trip.to || '目的地'}
            </div>
            <div className="mt-2 text-[12px] text-app-text-muted">
              预计 {trip.durationMin} 分钟后到达 · 位置实时同步
            </div>
          </div>
        </Card>
        <OrangeBtn
          bind={bindTap(
            { kind: 'action', id: 'trip.share.send' },
            {
              onTrigger: () => {
                const launched = shareWithSystem(shareText, (r) => { if (r.resultCode === 'OK') toast('分享成功'); });
                if (!launched) toast('无法打开分享应用');
              },
            },
          )}
          className="mb-2.5"
        >
          发送给紧急联系人
        </OrangeBtn>
        <button
          {...bindTap(
            { kind: 'action', id: 'trip.share.copy' },
            {
              onTrigger: () => {
                if (!copyToClipboard(shareUrl)) {
                  toast('无法访问剪切板');
                  return;
                }
                toast('链接已复制');
              },
            },
          )}
          className="w-full py-3 rounded-full text-[16px] bg-app-surface border"
          style={{ borderColor: C.orange, color: C.orange }}
        >
          复制行程链接
        </button>
        <div className="text-center text-[12px] text-app-text-muted mt-3">
          行程信息将实时同步,保护您的出行安全
        </div>
      </div>
    </div>
  );
}
