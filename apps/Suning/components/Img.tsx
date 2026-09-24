import React from 'react';

/**
 * 商品图(assets/products/ 批量生成中):加载失败时隐藏 img 自身,
 * 由父容器的浅灰底充当占位(spec 保真注记:onError 隐藏兜底)。
 */
export default function Img({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}
