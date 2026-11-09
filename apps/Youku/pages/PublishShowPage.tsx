import React, { useState } from 'react';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { YOUKU_CONFIG } from '../data';
import Img from '../components/Img';
import { IcSearch } from '../components/msgpub/icons';

interface ShowLite {
  id: string;
  title: string;
  channel: string;
  year: number;
  poster: string;
  heat: number;
  actors?: string[];
}

/** 片库按热度降序(热门tab 直接用;分类tab 再按 channel 过滤) */
const CATALOG = (YOUKU_CONFIG.catalog as unknown as ShowLite[]).slice().sort((a, b) => b.heat - a.heat);

/** 分类tab 顺序(s202-s205:热门/电视剧/综艺/电影/少儿/动漫/纪录) */
const TAB_KEYS = ['hot', 'drama', 'variety', 'movie', 'kids', 'anime', 'documentary'] as const;
type TabKey = (typeof TAB_KEYS)[number];

/** channel → 品类展示文案 i18n key(humanities/game 仅出现在热门tab条目行) */
const CH_I18N: Record<string, string> = {
  drama: 'publish.show.tab.drama',
  variety: 'publish.show.tab.variety',
  movie: 'publish.show.tab.movie',
  kids: 'publish.show.tab.kids',
  anime: 'publish.show.tab.anime',
  documentary: 'publish.show.tab.documentary',
  humanities: 'publish.show.type.humanities',
  game: 'publish.show.type.game',
};

/** spec 节点 publish.show(route /publish/show)—— 选择节目页(s202-s205);选中写 _temp.publishDraft 后 back 回编辑页 */
export default function PublishShowPage() {
  const { action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const draft = useYoukuStore((s) => s._temp.publishDraft);
  const setTemp = useYoukuStore((s) => s.setTemp);
  const [tab, setTab] = useState<TabKey>('hot');
  const [keyword, setKeyword] = useState('');

  const kw = keyword.trim();
  const byTab = tab === 'hot' ? CATALOG : CATALOG.filter((x) => x.channel === tab);
  const list = kw ? byTab.filter((x) => x.title.includes(kw)) : byTab;

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶栏:搜索节目输入框 + 取消 */}
      <div className="flex shrink-0 items-center gap-4 px-3 py-2">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-(--app-c-chip-bg) px-3.5">
          <IcSearch size={18} strokeWidth={2} className="shrink-0 text-[#8A8A8A]" />
          <input
            data-action="publish.show.search.input"
            data-action-type="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('publish.show.searchPh')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
          />
        </div>
        <button
          {...bindBack()}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[16px] text-(--app-c-text-primary)"
        >
          {t('common.cancel')}
        </button>
      </div>

      {/* 分类tab行:热门/电视剧/综艺/电影/少儿/动漫/纪录(选中态渐变下划线) */}
      <div className="flex shrink-0 items-end justify-between px-4 pt-2">
        {TAB_KEYS.map((k) => (
          <button
            key={k}
            {...action('publish.show.select.tab', () => setTab(k), { params: { value: k } })}
            className={`flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-[16px] ${
              tab === k ? 'font-bold text-(--app-c-text-primary)' : 'text-[#8A8A8A]'
            }`}
          >
            <span>{t(`publish.show.tab.${k}`)}</span>
            <span
              className={`h-[3px] w-5 rounded-full ${
                tab === k ? 'bg-gradient-to-r from-[#0C7BFF] to-[#C77DFF]' : 'bg-transparent'
              }`}
            />
          </button>
        ))}
      </div>

      {/* 灰底提示条(静态文案) */}
      <div className="mt-2 shrink-0 bg-(--app-c-card-bg) px-3 py-2.5 text-[13px] text-[#999999]">
        {t('publish.show.notice')}
      </div>

      {/* 节目列表:海报 + 片名 + 品类·年份 + 演员行 */}
      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto pb-6"
      >
        {list.length === 0 && (
          <div className="pt-20 text-center text-[14px] text-[#666666]">
            {t('publish.show.empty')}
          </div>
        )}

        {list.map((it) => (
          <div
            key={it.id}
            {...action(
              'publish.show.select.show',
              () => {
                setTemp({ publishDraft: { ...draft, showId: it.id, showTitle: it.title } });
                back();
              },
              { params: { value: it.id } },
            )}
            className="flex cursor-pointer gap-3.5 px-3 py-3"
          >
            <Img
              src={it.poster}
              label={it.title}
              ratio="poster"
              className="h-[104px] w-[74px] shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="truncate text-[17px] font-medium">{it.title}</div>
              <div className="mt-2.5 text-[14px] text-[#999999]">
                {t(CH_I18N[it.channel] ?? 'publish.show.tab.hot')}
                <span className="px-1.5">·</span>
                {it.year}
              </div>
              <div className="mt-2.5 truncate text-[14px] text-[#999999]">
                {t('publish.show.actors')}: {(it.actors ?? []).join(' ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
