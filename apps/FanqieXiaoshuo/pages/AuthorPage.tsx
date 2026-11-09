import React from 'react';
import { useParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, BookCover, Avatar } from '../components/ui';
import { IcBack } from '../res/icons';

export default function AuthorPage() {
  const { id = '' } = useParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();

  const author = useFanqieStore((st) => st.authors.find((a) => a.id === id));
  const books = useFanqieStore((st) => st.books);
  const followed = useFanqieStore((st) => st.followedAuthors);
  const toggleFollow = useFanqieStore((st) => st.toggleFollowAuthor);

  if (!author) return null;
  const works = books.filter((b) => b.authorId === id);
  const isFollowed = followed.includes(author.id);

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      {/* 橙色头部 */}
      <div className="shrink-0 bg-gradient-to-b from-[#FF8A50] to-[#FFB07A] pb-4">
        <div className="flex items-center h-11 px-1">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
            <IcBack size={22} className="text-white" />
          </button>
        </div>
        <div className="flex items-center px-4">
          <Avatar src={author.avatar} className="w-16 h-16 border-2 border-white/70 shrink-0" />
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-white truncate">{author.name}</span>
              {author.badge && <span className="text-[10px] text-[#B7770D] bg-(--app-c-bg-card)/90 rounded px-1 shrink-0">{author.badge}</span>}
            </div>
            <div className="text-[12px] text-white/85 mt-1 truncate">{author.sign}</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'author.follow.toggle' }, { onTrigger: () => toggleFollow(author.id) })}
            className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${isFollowed ? 'text-white/80 border-white/60 bg-transparent' : 'text-(--app-c-brand) border-white bg-(--app-c-bg-card)'}`}
          >
            {isFollowed ? s.followed : s.follow}
          </button>
        </div>
        <div className="flex items-center gap-4 px-4 mt-3">
          <span className="text-[12px] text-white">粉丝 {author.fansWan}万</span>
          <span className="text-[12px] text-white">获赞 {author.likesWan}万</span>
          <span className="text-[12px] text-white">拯救书荒 {author.saved}</span>
        </div>
      </div>

      {/* 作品列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="author-body" data-scroll-direction="vertical">
        <div className="bg-(--app-c-bg-card) mt-2 px-4 py-3">
          <div className="text-[15px] font-bold text-(--app-c-text-primary) mb-2">{s.works} {works.length}</div>
          {works.map((b) => (
            <div
              key={b.id}
              {...bindTap('author.bookdetail-open', { params: { id: b.id } })}
              className="flex gap-3 py-2.5 border-t border-(--app-c-divider) cursor-pointer"
            >
              <BookCover book={b} className="w-[54px] h-[72px] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-(--app-c-text-primary) truncate">{b.title}</div>
                <div className="text-[12px] text-(--app-c-text-tertiary) mt-1 line-clamp-2 leading-4">{b.intro}</div>
                <div className="text-[11px] text-(--app-c-text-quaternary) mt-1">{b.category}·{b.status}·{b.words}万字</div>
              </div>
            </div>
          ))}
          {works.length === 0 && <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-8">暂无作品</div>}
        </div>
      </div>
    </div>
  );
}
