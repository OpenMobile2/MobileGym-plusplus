import React from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { saveImageToAlbum, makeTextPosterDataUrl } from '../utils/osCaps';
import { IcClose, IcOverflow } from '../res/icons';
import { formatDayLabel } from '../utils/format';
import AsyncFsImage from '@/os/components/AsyncFsImage';

/** 全屏图片查看器：黑底 + 顶部 ✕ / 标题 / …（不做缩放手势，Q二-8） */
const ImageViewerPage: React.FC = () => {
  const { bindBack, action } = useSlackGestures();
  const { t, locale } = useI18n();
  const { messageId = '' } = useParams();

  const users = useSlackStore((s) => s.users);
  const msg = useSlackStore((s) => s.messages.find((m) => m.id === messageId));
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const image = msg?.attachments.find((a) => a.kind === 'image');
  const author = users.find((u) => u.id === msg?.userId);

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="flex flex-shrink-0 items-center gap-2 px-3 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center border-none bg-transparent text-white"
        >
          <IcClose size={22} />
        </button>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold text-white">
            {image?.name ?? t('viewer.image')}
          </span>
          <span className="block truncate text-[12px] text-white/60">
            {author?.displayName}
            {msg ? ` · ${formatDayLabel(msg.ts, locale)}` : ''}
          </span>
        </span>
        <button
          {...action('slack.viewer.more.toast', () => {
            void (async () => {
              const uri = image?.uri;
              let content: Blob | string | null = null;
              let mimeType = 'image/jpeg';
              let fileName = `slack-${messageId || 'image'}.jpg`;
              // FS path 不能直接 fetch，需经 FileSystem 读成 Blob
              if (uri?.startsWith('/')) {
                const fs = await import('@/os/FileSystemService');
                content = await fs.readFile(uri);
              } else if (uri) {
                content = uri;
                if (uri.startsWith('data:image/svg')) {
                  mimeType = 'image/svg+xml';
                  fileName = `slack-${messageId || 'image'}.svg`;
                }
              } else {
                content = makeTextPosterDataUrl(
                  [image?.name ?? t('viewer.image'), author?.displayName ?? ''],
                  { title: 'Slack' },
                );
                mimeType = 'image/svg+xml';
                fileName = `slack-${messageId || 'image'}.svg`;
              }
              if (!content) {
                notImplemented();
                return;
              }
              const saved = await saveImageToAlbum(content, {
                album: 'Saved',
                fileName,
                mimeType,
              });
              if (saved) showToast(t('common.savedToAlbum'));
              else notImplemented();
            })();
          })}
          aria-label="viewer-more"
          className="flex h-9 w-9 items-center justify-center border-none bg-transparent text-white"
        >
          <IcOverflow size={20} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-10">
        {image?.uri ? (
          image.uri.startsWith('/') ? (
            <AsyncFsImage
              path={image.uri}
              alt={image.name ?? t('viewer.image')}
              className="max-h-full w-full rounded object-contain"
            />
          ) : (
            <img
              src={image.uri}
              alt={image.name ?? t('viewer.image')}
              className="max-h-full w-full rounded object-contain"
            />
          )
        ) : (
          <div
            className="w-full rounded"
            style={{
              backgroundColor: image?.color ?? '#333333',
              aspectRatio: String(image?.ratio ?? 1.5),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ImageViewerPage;
