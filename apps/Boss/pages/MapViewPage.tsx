import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { MissingContent, PageHeader } from '../components/common';
import { StaticMap } from './JobDetailPage';
import { COLORS } from '../res/colors';

/** 职位地图页(Q14):放大的静态地图 + 地址;导航 wontfix toast。 */
const MapViewPage: React.FC = () => {
  const { action } = useBossGestures();
  const store = useBossStore();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';
  const job = BOSS_CONFIG.jobs.find((j) => j.id === jobId);
  if (!job) return <MissingContent text="工作地点对应的职位不存在或已被移除" />;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="工作地点" />
      <div className="min-h-0 flex-1" data-scroll-container="main" data-scroll-direction="vertical">
        <StaticMap label={job.address} tall />
        <div className="px-4 py-4">
          <div className="text-[16px] font-semibold text-gray-900">{job.address}</div>
          <div className="mt-1 text-[13px] text-gray-500">{job.city} {job.district}</div>
        </div>
      </div>
      <div className="shrink-0 px-4 pb-6">
        <button
          {...action('mapview.navigate.toast', () => store.showNotice('当前环境暂未接入地图导航，请点击“我知道了”返回。'), { params: {} })}
          className="w-full rounded-full py-3 text-center text-[15px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          导航
        </button>
      </div>
    </div>
  );
};

export default MapViewPage;
