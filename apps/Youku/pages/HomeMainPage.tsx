import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { YOUKU_CONFIG } from '../data';
import type { CatalogItem } from '../types';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import PlusMenu from '../components/PlusMenu';
import {
  Carousel,
  ChannelBar,
  Dots,
  PosterCard,
  SectionHeader,
  TopSearchBar,
  type ChannelChip,
} from './home/homeUi';
import { useHorizontalSwipe } from './home/useHorizontalSwipe';

const C = YOUKU_CONFIG;
const CATALOG = C.catalog as unknown as CatalogItem[];
const FLOORS = C.home.floors as Array<{ title: string; style: string; ids: string[] }>;
const FOCUS = C.home.focusBanner as Array<{ id: string; tagline: string }>;

/**
 * spec 节点 home.main(route /)—— 首页-精选feed。
 * 视觉参照 s184/s218:悬浮顶栏(搜索胶囊+频道条)+ 焦点海报轮播 + 专属推荐六宫格 +
 * 猜你喜欢 + 主题楼层(row3);SLG/信息流广告已按 spec 移除,版面由相邻内容楼层补齐。
 */
export default function HomeMainPage() {
  const { bindTap, action, bindBack, go } = useYoukuGestures();
  const { t } = useI18n();
  const isDark = useYoukuDark();
  const showToast = useYoukuStore((s) => s.showToast);
  const libFollowing = useYoukuStore((s) => s.libFollowing);
  const avatar = useYoukuStore((s) => s.user.avatar);
  const [sp, setSearchParams] = useSearchParams();
  const menuOpen = sp.get('menu') === 'plus';
  const openPlusMenu = () =>
    setSearchParams((p) => {
      p.set('menu', 'plus');
      return p;
    });
  const wontfix = () => showToast(t('common.wontfix'));

  const byId = useMemo(() => new Map(CATALOG.map((c) => [c.id, c])), []);
  const focusSlides = useMemo(
    () =>
      FOCUS.map((f) => ({ item: byId.get(f.id), tagline: f.tagline })).filter(
        (f): f is { item: CatalogItem; tagline: string } => !!f.item,
      ),
    [byId],
  );

  // 焦点海报轮播(spec home.main.focus.swipe:横滑切换,页码圆点联动)
  const [focusIdx, setFocusIdx] = useState(0);
  const advanceFocus = (dir: 1 | -1) =>
    setFocusIdx((i) => (i + dir + focusSlides.length) % focusSlides.length);

  // 搜索框轮播热词(进入搜索页后作为占位词,由搜索模块读取 hotwords)
  const hotwords = C.searchHotwords as Array<{ word: string; tag: string }>;
  const [hotIdx, setHotIdx] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setHotIdx((i) => (i + 1) % hotwords.length), 4000);
    return () => window.clearInterval(timer);
  }, [hotwords.length]);

  // 整页左右滑:首页 → 第一个内容频道(qa:Q9 推断A)
  const pageSwipe = useHorizontalSwipe({
    onLeft: () =>
      go('home.main.swipeChannel.open', { channelId: C.channels.content[0].id, kind: 'content' }),
  });

  // 频道条:首页(选中) + 内容频道 + 长尾频道(范围外频道已按阶段④拍板整体移除)
  const chips: ChannelChip[] = [
    { key: 'home', name: t('home.homeChip'), active: true },
    ...C.channels.content.map((c) => ({
      key: c.id,
      name: c.name,
      active: false,
      bind: bindTap('home.main.channel.open', { params: { channelId: c.id } }),
    })),
    ...C.channels.lite.map((c) => ({
      key: c.id,
      name: c.name,
      active: false,
      bind: bindTap('home.main.channelLite.open', { params: { channelId: c.id } }),
    })),
  ];

  const isFollowing = (id: string) => libFollowing.some((e) => e.id === id);

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="relative h-full w-full overflow-hidden bg-(--app-c-page-bg) text-(--app-c-text-primary)"
    >
      {/* 悬浮顶栏:搜索胶囊 + 频道条浮于头图上(design-tokens:首页无实体顶栏) */}
      <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent pb-2 pt-10">
        <TopSearchBar
          avatar={avatar}
          avatarBind={bindTap('home.main.me.open')}
          hotword={hotwords[hotIdx]?.word ?? ''}
          hotTag={hotwords[hotIdx]?.tag || undefined}
          searchBind={bindTap('home.main.search.open')}
          filterBind={action('home.main.plusMenu.open', openPlusMenu)}
          filterLabel={t('home.filter')}
          transparent
          filterAsPlus
        />
        <div className="mt-1">
          <ChannelBar
            chips={chips}
            expandBind={action('home.main.channelExpand.wontfixToast', () =>
              showToast(t('common.wontfix')),
            )}
          />
        </div>
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        {...pageSwipe}
        className="h-full w-full overflow-y-auto"
      >
        {/* 焦点海报轮播 */}
        <div className="relative h-[430px] w-full">
          <Carousel slides={focusSlides.map((f) => (
            <div
              key={f.item.id}
              {...bindTap('home.main.focus.player.open', { params: contentNavParams(f.item) })}
              className="relative h-full w-full cursor-pointer"
            >
              <Img
                src={f.item.still}
                label={f.item.title}
                ratio="landscape"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute inset-x-0 bottom-6 px-4">
                <div className="text-[28px] font-bold leading-9 text-white drop-shadow-lg">
                  {f.item.title}
                </div>
                <div className="mt-1.5 truncate text-[13px] text-white/85">{f.tagline}</div>
              </div>
            </div>
          ))} index={focusIdx} onAdvance={advanceFocus} className="h-full" />
          {/* 页码圆点(纯指示器);整行承载轮播切换 action,横滑同样触发 */}
          <div
            {...action('home.main.focus.swipe', () => advanceFocus(1))}
            className="absolute bottom-7 right-4 z-10 cursor-pointer p-1"
          >
            <Dots count={focusSlides.length} index={focusIdx} />
          </div>
        </div>

        {/* 内容楼层(数据全部来自 home.floors 种子) */}
        <div className="pb-4">
          {FLOORS.map((floor) => {
            const items = floor.ids
              .map((id) => byId.get(id))
              .filter((x): x is CatalogItem => !!x);
            const showRec = floor.style === 'grid6';
            return (
              <div key={floor.title} className="mt-6">
                <SectionHeader title={floor.title} />
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 px-3">
                  {items.map((item) => (
                    <PosterCard
                      key={item.id}
                      item={item}
                      t={t}
                      showRec={showRec}
                      leftOverride={
                        floor.style === 'grid6' && isFollowing(item.id)
                          ? t('home.watching')
                          : undefined
                      }
                      tapBind={bindTap('home.main.card.player.open', {
                        params: contentNavParams(item),
                      })}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 顶栏「+」下拉:筛选 / 扫一扫 / 投屏 */}
      <PlusMenu
        open={menuOpen}
        backdropBind={bindBack()}
        filterBind={bindTap('home.main.plusMenu.filter.open')}
        scanBind={action('home.main.plusMenu.scan.wontfixToast', wontfix)}
        castBind={action('home.main.plusMenu.cast.wontfixToast', wontfix)}
        filterLabel={t('home.filter')}
        scanLabel={t('menu.scan')}
        castLabel={t('menu.cast')}
      />
    </div>
  );
}
