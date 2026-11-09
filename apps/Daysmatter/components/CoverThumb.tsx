import { coverUrl } from '../assets';
import { NOTEBOOK_COVERS } from '../constants';

interface Props {
  cover: string;
  icon?: string;
  className?: string;
  rounded?: string;
}

/** 本子封面缩略图:有生成图用图,否则回落配置纯色 + emoji */
export default function CoverThumb({ cover, icon, className = '', rounded = 'rounded-xl' }: Props) {
  const url = coverUrl(cover);
  const fallbackColor = NOTEBOOK_COVERS.find((c) => c.id === cover)?.color ?? '#3E7CB1';
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${rounded} ${className}`}
      style={url ? undefined : { backgroundColor: fallbackColor }}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        icon && <span className="text-2xl drop-shadow">{icon}</span>
      )}
    </div>
  );
}
