import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { pickImages } from '@/os/albumBridge';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, useToast, Stars, fmtTime, Avatar, BookCover } from '../components/ui';
import { IcBack } from '../res/icons';

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [toastNode, showToast] = useToast();

  const user = useFanqieStore((st) => st.user);
  const setAvatar = useFanqieStore((st) => st.setAvatar);
  const books = useFanqieStore((st) => st.books);
  const shelf = useFanqieStore((st) => st.shelf);
  const reviews = useFanqieStore((st) => st.reviews);

  const tab = searchParams.get('tab') || 'shelf';
  const myReviews = reviews.filter((r) => r.mine);
  const shelfBooks = shelf.map((e) => books.find((b) => b.id === e.bookId)).filter(Boolean);

  /** 换头像:走系统相册选图(albumBridge.pickImages → MediaService/ContentResolver) */
  const pickAvatar = () => {
    void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
      if (r.cancelled || !r.selected.length) return;
      const picked = r.selected[0];
      if (!picked) return;
      setAvatar(picked.path || picked.uri);
      showToast(s.avatarUpdated);
    });
  };

  const TABS = [
    { v: 'shelf', label: `书架${shelfBooks.length}` },
    { v: 'talk', label: `讨论${myReviews.length}` },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      {/* 绿色头图 */}
      <div className="shrink-0 bg-gradient-to-b from-[#8FBF7A] to-[#B8D9A6] pb-3">
        <div className="flex items-center h-11 px-1">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
            <IcBack size={22} className="text-white" />
          </button>
        </div>
        <div className="flex items-center px-4">
          <button
            {...bindTap({ kind: 'action', id: 'profile.avatar.pick' }, { onTrigger: pickAvatar })}
            className="shrink-0 bg-transparent border-none cursor-pointer p-0"
            aria-label={s.changeAvatar}
          >
            <Avatar src={user.avatar} className="w-16 h-16 border-2 border-white/70" />
          </button>
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-[18px] font-bold text-white truncate">{user.name}</div>
            <div className="text-[12px] text-white/85 mt-1">阅读 {user.readBooks} 本书 · {Math.floor(user.readMinutes / 60)} 时 {user.readMinutes % 60} 分</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'profile.misc.disabled' }, { onTrigger: showNotOpen })}
            className="shrink-0 text-[12px] text-white border border-white/70 rounded-full px-3 py-1 bg-transparent cursor-pointer"
          >
            {s.profileEdit}
          </button>
        </div>
        <div className="flex items-center gap-4 px-4 mt-3">
          <span className="text-[12px] text-white">关注 {user.follows}</span>
          <span className="text-[12px] text-white">粉丝 {user.fans}</span>
          <span className="text-[12px] text-white">获赞 {user.likes}</span>
          <span className="text-[12px] text-white">拯救书荒 {user.rescued}</span>
        </div>
      </div>

      {/* tab */}
      <div className="flex items-center gap-6 px-4 h-10 bg-(--app-c-bg-card) shrink-0 border-b border-(--app-c-divider)">
        {TABS.map((t) => {
          const on = tab === t.v;
          return (
            <button
              key={t.v}
              {...bindTap({ kind: 'action', id: 'profile.tab.select.target' }, {
                params: { target: t.v },
                onTrigger: () => setSearchParams((p) => { p.set('tab', t.v); return p; }, { replace: true }),
              })}
              className={`relative h-10 bg-transparent border-none cursor-pointer p-0 ${on ? 'text-[14px] font-semibold text-(--app-c-text-primary)' : 'text-[14px] text-(--app-c-text-secondary)'}`}
            >
              {t.label}
              {on && <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-5 h-0.5 bg-(--app-c-brand) rounded-full" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="profile-body" data-scroll-direction="vertical">
        {tab === 'shelf' ? (
          shelfBooks.length === 0 ? (
            <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-16">{s.emptyShelf}</div>
          ) : (
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              {shelfBooks.map((b) => b && (
                <div key={b.id}>
                  <BookCover book={b} className="w-full aspect-[3/4]" />
                  <div className="text-[12px] text-(--app-c-text-primary) mt-1 line-clamp-1">{b.title}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          myReviews.length === 0 ? (
            <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-16">还没有发表过书评</div>
          ) : (
            myReviews.map((r) => {
              const b = books.find((x) => x.id === r.bookId);
              return (
                <div key={r.id} className="bg-(--app-c-bg-card) rounded-xl px-4 py-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={user.avatar} className="w-7 h-7 shrink-0" />
                    <span className="text-[13px] text-(--app-c-text-primary)">{user.name}</span>
                    <span className="text-[11px] text-(--app-c-text-disabled) ml-1">{fmtTime(r.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Stars value={r.stars} size={12} />
                    <span className="text-[11px] text-(--app-c-text-disabled)">{r.readNote}</span>
                  </div>
                  <div className="text-[14px] text-(--app-c-text-primary) leading-5 mt-1.5">{r.text}</div>
                  {b && (
                    <div className="flex items-center gap-2 bg-(--app-c-bg-fill-weak) rounded-lg px-2 py-1.5 mt-2">
                      <BookCover book={b} className="w-7 h-9" />
                      <div className="min-w-0">
                        <div className="text-[12px] text-(--app-c-text-primary) truncate">{b.title}</div>
                        <div className="text-[11px] text-(--app-c-text-tertiary)">{b.rating}分·{b.category}·{b.status}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
      {notOpenNode}
      {toastNode}
    </div>
  );
}
