import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { dayGroupLabel } from '../utils/appTime';
import { contentNavParams } from '../utils/openContent';
import { IcBack, CheckCircle, EditBar, EmptyBox, historyTitle, pctText, resolveContent } from './me/meShared';
import type { HistoryEntry } from '../types';

const hKey = (h: HistoryEntry) => `${h.id}#${h.episode ?? 0}`;

/**
 * spec 节点 me.history(route /me/history?edit?=1)—— 历史记录页(s247/s248)。
 * 时间分组(今天/昨天/MM月DD日);短视频折叠为『看过的短视频』合辑卡 → shorts.watched;
 * 编辑多选态 URL 驱动(edit.enter push ?edit=1,back 退出),删除联动 me.main 历史横滑。
 */
export default function HistoryPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const history = useYoukuStore((s) => s.history);
  const editSelect = useYoukuStore((s) => s._temp.editSelect);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const deleteHistory = useYoukuStore((s) => s.deleteHistory);
  const showToast = useYoukuStore((s) => s.showToast);

  const isEdit = sp.get('edit') === '1';

  // 短视频折叠为一张合辑卡(s247);短剧同剧只留最新一条;其余按时间分组
  const shorts = history.filter((h) => h.ctype === 'short');
  const rest = history
    .filter((h) => h.ctype !== 'short')
    .filter((h, i, arr) =>
      h.ctype === 'drama' ? arr.findIndex((x) => x.ctype === 'drama' && x.id === h.id) === i : true,
    );
  const firstShort = shorts[0];

  interface Group {
    label: string;
    items: HistoryEntry[];
  }
  const groups: Group[] = [];
  for (const h of rest) {
    const label = dayGroupLabel(h.ts);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(h);
    else groups.push({ label, items: [h] });
  }

  // 合辑跟随最新短视频所在分组;无其余条目时单独成组
  const collectionGroupLabel = firstShort ? dayGroupLabel(firstShort.ts) : null;

  const allKeys = rest.map(hKey);
  const allShortKeys = shorts.map(hKey);
  const everySelected = allKeys.length > 0 && allKeys.every((k) => editSelect.includes(k));

  const enterEdit = () => {
    setTemp({ editSelect: [] });
    setSearchParams((p) => {
      p.set('edit', '1');
      return p;
    });
  };
  const toggleKey = (k: string) =>
    setTemp({ editSelect: editSelect.includes(k) ? editSelect.filter((x) => x !== k) : [...editSelect, k] });

  /** 合辑卡(浏览态 → shorts.watched;编辑态勾选=全部短视频条目) */
  const collectionCard = () => {
    if (!firstShort) return null;
    const r = resolveContent(firstShort.id, 'short');
    if (!r) return null;
    const shortsAllSelected = allShortKeys.every((k) => editSelect.includes(k));
    const visual = (
      <>
        <div className="relative h-[86px] w-[152px] shrink-0">
          <div className="absolute -right-2 top-3 h-[74px] w-[148px] rounded-lg bg-(--app-c-chip-bg)" />
          <div className="absolute -right-1 top-1.5 h-[80px] w-[150px] rounded-lg bg-(--app-c-chip-bg)" />
          <div className="relative h-[86px] w-[152px] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
            <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="text-[17px] font-medium text-(--app-c-text-primary)">看过的短视频</div>
          <div className="mt-2 text-[13px] text-[#999999]">包含多个短视频内容</div>
        </div>
      </>
    );
    if (isEdit) {
      return (
        <div
          {...action(
            'me.history.edit.select.toggle',
            () =>
              setTemp({
                editSelect: shortsAllSelected
                  ? editSelect.filter((k) => !allShortKeys.includes(k))
                  : [...editSelect.filter((k) => !allShortKeys.includes(k)), ...allShortKeys],
              }),
            { params: { itemKey: 'shorts-collection', value: shortsAllSelected ? '0' : '1' } },
          )}
          className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
        >
          <CheckCircle checked={allShortKeys.length > 0 && shortsAllSelected} />
          {visual}
        </div>
      );
    }
    return (
      <div {...bindTap('me.history.shorts.open')} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
        {visual}
      </div>
    );
  };

  const itemCard = (h: HistoryEntry) => {
    const r = resolveContent(h.id, String(h.ctype));
    if (!r) return null;
    const key = hKey(h);
    const visual = (
      <>
        <div className="relative h-[86px] w-[152px] shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
          <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
          {r.badge && (
            <span className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] leading-none text-[#E8C87E]">
              {r.badge}
            </span>
          )}
          {r.episodeCount != null && (
            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] leading-none text-white">
              {r.updatedTo != null && r.updatedTo < r.episodeCount ? `更新至${r.updatedTo}集` : `${r.episodeCount}集全`}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="line-clamp-2 text-[16px] leading-snug text-(--app-c-text-primary)">{historyTitle(r, h.episode)}</div>
          <div className="mt-2 text-[13px] text-[#999999]">📱 手机 · {pctText(h.progressSec, h.durationSec)}</div>
        </div>
      </>
    );
    if (isEdit) {
      return (
        <div
          key={key}
          {...action('me.history.edit.select.toggle', () => toggleKey(key), {
            params: { itemKey: key, value: editSelect.includes(key) ? '0' : '1' },
          })}
          className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
        >
          <CheckCircle checked={editSelect.includes(key)} />
          {visual}
        </div>
      );
    }
    const params = contentNavParams({ id: h.id, type: h.ctype }, h.episode != null ? { ep: h.episode } : undefined);
    // 内容卡通用路由:电影→player / 剧集类→player.series / 短剧→shorts(声明字面量分流)
    if (h.ctype === 'drama') {
      return (
        <div key={key} {...bindTap('me.history.item.shorts.open', { params: { shortId: h.id } })} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
          {visual}
        </div>
      );
    }
    if (h.ctype === 'movie') {
      return (
        <div key={key} {...bindTap('me.history.item.open', { params })} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
          {visual}
        </div>
      );
    }
    return (
      <div key={key} {...bindTap('me.history.item.series.open', { params })} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
        {visual}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 / 历史记录 / 编辑(编辑态=取消) */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">历史记录</span>
        {isEdit ? (
          <button {...bindBack()} className="w-10 cursor-pointer border-none bg-transparent p-0 text-right text-[15px] text-(--app-c-text-primary)">
            取消
          </button>
        ) : (
          <button
            {...action('me.history.edit.enter', enterEdit)}
            className="w-10 cursor-pointer border-none bg-transparent p-0 text-right text-[15px] text-(--app-c-text-primary)"
          >
            编辑
          </button>
        )}
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        {history.length === 0 && <EmptyBox text="暂无观看历史" />}
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-4 pb-1 pt-4 text-[22px] font-bold">{g.label}</div>
            {collectionGroupLabel === g.label && collectionCard()}
            {g.items.map(itemCard)}
          </div>
        ))}
        {/* 合辑所在日期无其余条目时,单独成组 */}
        {firstShort && !groups.some((g) => g.label === collectionGroupLabel) && (
          <div>
            <div className="px-4 pb-1 pt-4 text-[22px] font-bold">{collectionGroupLabel}</div>
            {collectionCard()}
          </div>
        )}
      </div>

      {/* 编辑态底部栏 */}
      {isEdit && (
        <EditBar
          hasSelection={editSelect.length > 0}
          selectAllBind={action('me.history.edit.selectAll.toggle', () =>
            setTemp({ editSelect: everySelected ? [] : [...allKeys, ...allShortKeys] }),
          )}
          deleteBind={action('me.history.edit.delete.commit', () => {
            if (editSelect.length === 0) {
              showToast('请先选择要删除的内容');
              return;
            }
            deleteHistory(editSelect.filter((k) => k !== 'shorts-collection'));
            back();
          })}
        />
      )}
    </div>
  );
}
