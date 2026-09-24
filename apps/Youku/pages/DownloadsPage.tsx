import React from 'react';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { YOUKU_CONFIG } from '../data';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import { IcBack, IcSettings, EmptyZhenhuan, GOLD_BTN_STYLE, historyTitle, resolveContent } from './me/meShared';

const STORAGE = YOUKU_CONFIG.storage as unknown as { downloadedText: string; freeText: string };
/** 更多精彩内容推荐(s217 三海报,片库同类电视剧补位) */
const RECOMMEND_IDS = ['s_zhulou', 's_xuanan', 's_shengong'];

/**
 * spec 节点 me.downloads(route /me/downloads)—— 我的下载(s217 空态 / 假下载 hasContent 推断态)。
 * 金色会员横幅随 membership 联动;存储条已下载量随假下载条目累加。
 */
export default function DownloadsPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const membership = useYoukuStore((s) => s.membership);
  const downloads = useYoukuStore((s) => s.downloads);
  const showToast = useYoukuStore((s) => s.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const totalMB = downloads.reduce((acc, d) => acc + d.sizeMB, 0);
  const downloadedText =
    downloads.length === 0 ? STORAGE.downloadedText : totalMB >= 1024 ? `${(totalMB / 1024).toFixed(1)}G` : `${totalMB}MB`;
  const tierText = membership.tier === 'svip' ? 'SVIP' : 'VIP';

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 我的下载 / 设置 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">我的下载</span>
        <button
          {...action('me.downloads.settings.wontfixToast', wontfix)}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcSettings size={20} strokeWidth={1.8} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="px-4 pt-2 text-[24px] font-bold">下载</div>

        {/* 会员横幅(金棕渐变,假开通联动已开通态) */}
        <div
          className="mx-3 mt-3 flex items-center rounded-xl px-4 py-3.5"
          style={{ background: 'linear-gradient(90deg,#3A2E1C,#6B5636)' }}
        >
          {membership.active ? (
            <div>
              <div className="text-[15px] font-bold text-[#F5E3B0]">已开通{tierText}会员,极速下载特权生效中</div>
              <div className="mt-1 text-[12px] text-[#C8B482]">下载加速110%,尊享高清缓存</div>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-[#F5E3B0]">会员尊享极速下载特权</div>
                <div className="mt-1 text-[12px] text-[#C8B482]">预计加速110%</div>
              </div>
              <button
                {...action('me.downloads.trial.wontfixToast', wontfix)}
                className="ml-auto shrink-0 cursor-pointer rounded-lg border border-[#D9B36A] bg-transparent px-3.5 py-2 text-[13px] text-[#F5E3B0]"
              >
                试用
              </button>
              <button
                {...bindTap('me.downloads.vip.open')}
                className="ml-2 shrink-0 cursor-pointer rounded-lg border-none px-3.5 py-2 text-[13px] font-bold"
                style={GOLD_BTN_STYLE}
              >
                立即开通
              </button>
            </>
          )}
        </div>

        {/* 下载区:空态插画 或 已下载条目列表(拍板Q8 假下载) */}
        {downloads.length === 0 ? (
          <div className="pt-12">
            <EmptyZhenhuan text="您还没有下载的视频" />
          </div>
        ) : (
          <div className="mt-2">
            {downloads.map((d) => {
              const r = resolveContent(d.id, String(d.ctype));
              if (!r) return null;
              return (
                <div
                  key={`${d.id}#${d.episode ?? 0}`}
                  {...bindTap('me.downloads.item.open', {
                    params: contentNavParams({ id: d.id, type: d.ctype }, d.episode != null ? { ep: d.episode } : undefined),
                  })}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
                >
                  <div className="relative h-[86px] w-[152px] shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="line-clamp-2 text-[16px] leading-snug text-(--app-c-text-primary)">{historyTitle(r, d.episode)}</div>
                    <div className="mt-2 text-[13px] text-[#999999]">
                      {d.sizeMB}MB · <span className="text-[#2BC8B4]">已完成</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 更多精彩内容推荐 */}
        <div className="mt-8 px-4 text-[18px] font-bold">更多精彩内容</div>
        <div className="mt-3 grid grid-cols-3 gap-x-2 px-3">
          {RECOMMEND_IDS.map((id) => {
            const r = resolveContent(id, 'series');
            if (!r) return null;
            return (
              <div
                key={id}
                {...bindTap('me.downloads.recommend.open', { params: contentNavParams({ id, type: 'series' }) })}
                className="cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                  <Img src={r.poster} label={r.title} ratio="poster" className="h-full w-full object-cover" />
                </div>
                <div className="mt-1.5 truncate text-[14px] text-(--app-c-text-primary)">{r.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-[#999999]">{r.badge || r.typeText}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部存储条 */}
      <div className="shrink-0 pb-3 pt-2 text-center text-[13px] text-[#666666]">
        已下载{downloadedText} / {STORAGE.freeText}
      </div>
    </div>
  );
}
