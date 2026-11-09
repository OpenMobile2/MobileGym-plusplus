import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, fmtCount } from '../components/ui';
import { setImageViewerPayload } from './MediaImageviewerPage';

// 节点: celebrity.page —— 影人/人物页(头部+简介+作品 sections+相册)。
// evidence: IMG_Ff60ef9_t0070/t0071/t0074

/** 英文名(evidence t0071「Zhanxiong Xu」);seed 无 enName 字段,页面侧映射。 */
const EN_NAMES: Record<string, string> = {
  cel_xuzhanxiong: 'Changlin Gu',
  cel_liuye: 'Mozhi Shen',
  cel_yushi: 'Yu Cheng',
  cel_wangzhifei: 'Zhifei Lu',
  cel_wanglei: 'Zichuan Lei',
  cel_wangyaoqing: 'Zhilang Yao',
  cel_zhangli: 'Manli Zhang',
};

const PHOTOS = [
  '/@app-assets/Douban/images/bc_photo1.svg',
  '/@app-assets/Douban/images/bc_photo2.svg',
  '/@app-assets/Douban/images/bc_photo3.svg',
  '/@app-assets/Douban/images/bc_photo4.svg',
  '/@app-assets/Douban/images/bc_photo5.svg',
];

export default function CelebrityPagePage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();
  const toast = useDoubanStore((s) => s.toast);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const follows = useDoubanStore((s) => s.follows);
  const toggleFollowCelebrity = useDoubanStore((s) => s.toggleFollowCelebrity);
  const addHistory = useDoubanStore((s) => s.addHistory);

  const celebrityId = routeParams.celebrityId ?? 'cel_xuzhanxiong';
  const celeb = useMemo(
    () => celebrities.find((c) => c.id === celebrityId) ?? celebrities[0],
    [celebrities, celebrityId],
  );
  const followed = follows.celebrities.includes(celeb.id);

  const [introExpanded, setIntroExpanded] = useState(false);
  /** 首入促销 sheet(t0071 橙色「标记看过的影视」全屏推广);首帧展示,取消/补充均本地关闭。 */
  const [promoOpen, setPromoOpen] = useState(true);

  const works = useMemo(
    () => celeb.works.map((id) => subjects.find((s) => s.id === id)).filter((s) => s != null),
    [celeb.works, subjects],
  );
  const movieWorks = works.filter((s) => s.type === 'movie' || s.type === 'tv');
  const bookWorks = works.filter((s) => s.type === 'book');
  const musicWorks = works.filter((s) => s.type === 'music');
  const markedIds = useMemo(() => new Set(marks.map((m) => m.subjectId)), [marks]);

  /** 简介全文:seed desc(一行)+ 代表作品补足段落,截断态 2-3 行。 */
  const introText = useMemo(() => {
    const workNames = works.map((s) => s.title);
    const base = celeb.desc ? `${celeb.desc}。` : '';
    const rep = workNames.length > 0 ? `代表作品有《${workNames.join('》《')}》。` : '';
    return `${celeb.name},${celeb.role}。${base}${rep}长期活跃于华语影视/文艺领域,其作品在豆瓣获得广泛关注与讨论,累计${fmtCount(celeb.followers)}位豆友关注。`;
  }, [celeb, works]);

  /** 作品卡:海报 + 左上收藏角标(♡+/已标记✓)+ 片名 + 星级评分 */
  const workCard = (s: (typeof works)[number]) => {
    const tapProps =
      s.type === 'movie' || s.type === 'tv'
        ? bindTap('celebrity.page.movieWork-open', { params: { itemId: s.id } })
        : s.type === 'book'
          ? bindTap('celebrity.page.bookWork-open', { params: { subjectId: s.id } })
          : bindTap('celebrity.page.musicWork-open', { params: { subjectId: s.id } });
    const marked = markedIds.has(s.id);
    return (
      <div key={s.id} {...tapProps} className="w-[92px] shrink-0 cursor-pointer">
        <div className="relative">
          <Img src={s.cover} className="w-[92px] h-[128px] rounded-md object-cover" />
          <button
            {...bindTap('celebrity.page.workMark-open', {
              stopPropagation: true,
              beforeTrigger: () => addHistory('subject', s.id),
            })}
            className="absolute top-0 left-0 w-6 h-7 flex items-center justify-center border-none cursor-pointer rounded-tl-md rounded-br-md"
            style={{ background: 'rgba(0,0,0,0.55)', color: marked ? C.gold : '#fff', fontSize: 11 }}
            aria-label="收藏标记"
          >
            {marked ? '✓' : '♡+'}
          </button>
        </div>
        <div className="mt-1.5 text-[13px] font-semibold truncate" style={{ color: C.text }}>{s.title}</div>
        <div className="mt-0.5">
          {s.rating == null ? (
            <span className="text-[11px]" style={{ color: C.sub }}>暂无评分</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Stars value={s.rating} size={10} color={C.gold} />
              <span className="text-[11px] font-semibold" style={{ color: '#FF9900' }}>{s.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  /** 区块标题 + 「全部xx >」(wontfix) */
  const sectionHead = (title: string, allLabel: string) => (
    <div className="flex items-center justify-between px-4">
      <span className="text-base font-bold" style={{ color: C.text }}>{title}</span>
      <button
        {...bindTap({ kind: 'action', id: 'celebrity.page.worksAll.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        className="text-xs bg-transparent border-none cursor-pointer"
        style={{ color: C.sub }}
      >
        {allLabel} ›
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white relative" data-status-bar-foreground="dark">
      {/* 顶部条:返回 / 「人物」 / 「…」 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>人物</div>
        <button
          {...bindTap({ kind: 'action', id: 'celebrity.page.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-lg tracking-widest relative"
          style={{ color: C.text }}
        >
          ···
          <span
            className="absolute top-1.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-semibold not-italic tracking-normal"
            style={{ background: '#E5484D', color: '#fff' }}
          >
            2
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* ---------------- 头部卡 ---------------- */}
        <div className="flex items-start gap-3.5 px-4 pt-2">
          <Img src={celeb.avatar} className="w-[76px] h-[76px] rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="text-[20px] font-bold leading-tight truncate" style={{ color: C.text }}>{celeb.name}</div>
            {EN_NAMES[celeb.id] && <div className="mt-0.5 text-[13px]" style={{ color: C.sub }}>{EN_NAMES[celeb.id]}</div>}
            <div className="mt-1.5 text-xs" style={{ color: C.sub }}>{fmtCount(celeb.followers)}人关注</div>
          </div>
          <button
            {...bindTap(
              { kind: 'action', id: 'celebrity.page.follow.toggle' },
              {
                onTrigger: () => {
                  if (followed) {
                    toggleFollowCelebrity(celeb.id);
                    toast('已取消关注');
                  } else {
                    toggleFollowCelebrity(celeb.id);
                    toast('关注成功,进入 我的关注-人物 查看');
                  }
                },
              },
            )}
            className="shrink-0 px-4 h-8 rounded-full text-sm cursor-pointer self-center"
            style={
              followed
                ? { background: '#F2F3F5', color: C.sub, border: 'none' }
                : { background: C.green, color: '#fff', border: 'none' }
            }
          >
            {followed ? '已关注' : '+ 关注'}
          </button>
        </div>

        {/* ---------------- 简介 ---------------- */}
        <div className="px-4 mt-4">
          <div className="text-base font-bold" style={{ color: C.text }}>简介</div>
          <div
            {...bindTap(
              { kind: 'action', id: 'celebrity.page.intro.expand' },
              { onTrigger: () => setIntroExpanded(true) },
            )}
            className={`mt-1.5 text-sm leading-relaxed cursor-pointer ${introExpanded ? '' : 'line-clamp-3'}`}
            style={{ color: '#4A4F58' }}
          >
            {introText}
            {!introExpanded && <span style={{ color: C.sub }}> …展开</span>}
          </div>
        </div>

        {/* ---------------- 影视 section ---------------- */}
        {movieWorks.length > 0 && (
          <div className="mt-5">
            {sectionHead('影视', `全部影视${movieWorks.length}`)}
            <div className="mt-2.5 flex gap-3 px-4 overflow-x-auto" data-scroll-container="works-movie" data-scroll-direction="horizontal">
              {movieWorks.map(workCard)}
            </div>
          </div>
        )}

        {/* ---------------- 图书 section ---------------- */}
        {bookWorks.length > 0 && (
          <div className="mt-5">
            {sectionHead('图书', `全部图书${bookWorks.length}`)}
            <div className="mt-2.5 flex gap-3 px-4 overflow-x-auto" data-scroll-container="works-book" data-scroll-direction="horizontal">
              {bookWorks.map(workCard)}
            </div>
          </div>
        )}

        {/* ---------------- 音乐 section(音乐人条目) ---------------- */}
        {musicWorks.length > 0 && (
          <div className="mt-5">
            {sectionHead('音乐', `全部音乐${musicWorks.length}`)}
            <div className="mt-2.5 flex gap-3 px-4 overflow-x-auto" data-scroll-container="works-music" data-scroll-direction="horizontal">
              {musicWorks.map(workCard)}
            </div>
          </div>
        )}

        {/* ---------------- 相册 section ---------------- */}
        <div className="mt-5">
          {sectionHead('相册', '全部照片')}
          <div className="mt-2.5 flex gap-2 px-4 overflow-x-auto" data-scroll-container="album" data-scroll-direction="horizontal">
            {PHOTOS.map((src, i) => (
              <div
                key={src}
                {...bindTap('celebrity.page.photo-open', {
                  beforeTrigger: () => setImageViewerPayload({ images: PHOTOS, index: i }),
                })}
                className="shrink-0 cursor-pointer rounded-md overflow-hidden"
                style={{ width: 132, height: 96 }}
              >
                <Img src={src} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- 首入促销 sheet(t0071 橙色「标记看过的影视」全屏推广) ---------------- */}
      {promoOpen && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-between px-6 pt-16 pb-8" style={{ background: '#FF8A1E' }}>
          <div className="flex flex-col items-center text-center mt-6">
            <div className="text-[26px] font-extrabold leading-tight" style={{ color: '#fff' }}>标记看过的影视</div>
            <div className="mt-2.5 text-sm" style={{ color: '#FFF3E4' }}>找回你看过的每一部电影、剧集</div>
            {/* 手机样机图 */}
            <div className="mt-8 w-40 h-72 rounded-[22px] p-2 shadow-xl" style={{ background: '#fff' }}>
              <div className="w-full h-full rounded-[16px] flex flex-col items-center pt-5" style={{ background: '#FFF7EE' }}>
                <div className="w-14 h-14 rounded-xl mb-3" style={{ background: '#FFD9A8' }} />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 w-28 mb-2.5">
                    <div className="w-8 h-11 rounded" style={{ background: '#FFE2BB' }} />
                    <div className="flex-1">
                      <div className="h-2 rounded-full mb-1.5" style={{ background: '#FFE2BB' }} />
                      <div className="h-2 w-2/3 rounded-full" style={{ background: '#FFEAD0' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col items-center gap-4 mt-6">
            <button
              onClick={() => setPromoOpen(false)}
              className="w-full h-12 rounded-full text-[15px] font-semibold border-none cursor-pointer"
              style={{ background: '#1A1A1A', color: '#fff' }}
            >
              补充我的影视记录
            </button>
            <button
              onClick={() => setPromoOpen(false)}
              className="text-sm bg-transparent border-none cursor-pointer"
              style={{ color: '#FFF3E4' }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
