// apps/GoogleDrive/components/PreviewBody.tsx — 预览正文渲染
//
// 阶段⑥反馈：「这些文件点进去后，应该有一些内容，你可以生成一点，模拟就行，但最好有内容」。
// 正文是模拟数据（在 data/defaults.json 里），但呈现方式必须和文件类型对得上：
// 文档分段、表格画表、幻灯片一页一屏、notebook 用等宽字体。
import React from 'react';
import { GD } from '../res/colors';
import { PDF_PAGE_COUNT } from '../constants';
import type { PreviewBody as Body } from '../types';

/** 没有正文数据时的兜底：至少给出文件名，不画一堆无意义的灰条 */
const Fallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="px-5 py-6">
    <div className="text-[17px] mb-3" style={{ color: GD.text }}>{name}</div>
    <div className="text-[14px] leading-relaxed" style={{ color: GD.textSecondary }}>
      这是模拟版中的示例文件，暂无正文内容。
    </div>
  </div>
);

const Paragraphs: React.FC<{ title: string; paragraphs: string[] }> = ({ title, paragraphs }) => (
  <>
    <div className="text-[19px] leading-snug mb-4" style={{ color: GD.text }}>{title}</div>
    {paragraphs.map((t, i) => (
      <p key={i} className="text-[14px] leading-[1.9] mb-4" style={{ color: GD.text }}>{t}</p>
    ))}
  </>
);

const SheetTable: React.FC<{ title: string; columns: string[]; rows: string[][] }> = ({ title, columns, rows }) => (
  <>
    <div className="text-[17px] mb-4" style={{ color: GD.text }}>{title}</div>
    <div className="overflow-x-auto" data-scroll-container="table" data-scroll-direction="horizontal">
      <table className="text-[13px]" style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c}
                className="px-3 py-2 text-left whitespace-nowrap"
                style={{ background: GD.cardBg, border: `1px solid ${GD.divider}`, color: GD.textSecondary, fontWeight: 500 }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td
                  key={j}
                  className="px-3 py-2 whitespace-nowrap"
                  style={{ border: `1px solid ${GD.divider}`, color: GD.text }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const Slides: React.FC<{ slides: Array<{ heading: string; bullets: string[] }> }> = ({ slides }) => (
  <div className="flex flex-col gap-4">
    {slides.map((sl, i) => (
      <div
        key={i}
        className="p-4"
        style={{ border: `1px solid ${GD.divider}`, borderRadius: 4, background: '#fff', aspectRatio: '4 / 3' }}
      >
        <div className="text-[16px] mb-3" style={{ color: GD.text }}>{sl.heading}</div>
        <ul className="flex flex-col gap-2">
          {sl.bullets.map((b, k) => (
            <li key={k} className="text-[13px] leading-relaxed flex gap-2" style={{ color: GD.textSecondary }}>
              <span>·</span><span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="text-[11px] mt-3" style={{ color: GD.textSecondary }}>{i + 1} / {slides.length}</div>
      </div>
    ))}
  </div>
);

const CodeLines: React.FC<{ lines: string[] }> = ({ lines }) => (
  <pre
    className="text-[12px] leading-[1.7] whitespace-pre-wrap"
    style={{ color: GD.text, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
  >
    {lines.join('\n')}
  </pre>
);

const Inner: React.FC<{ body: Body }> = ({ body }) => {
  if (body.kind === 'sheet') return <SheetTable title={body.title} columns={body.columns} rows={body.rows} />;
  if (body.kind === 'slide') return <Slides slides={body.slides} />;
  if (body.kind === 'code') return <CodeLines lines={body.lines} />;
  return <Paragraphs title={body.title} paragraphs={body.paragraphs} />;
};

/** gdoc / unsupported 态：单页白底铺正文 */
export const FlowBody: React.FC<{ name: string; body?: Body }> = ({ name, body }) => (
  <div className="px-5 py-4">{body ? <Inner body={body} /> : <Fallback name={name} />}</div>
);

/**
 * pdf 态：把正文切成多页，页间留 #ECECF1 间隔（IMG_2275 的连续竖向滚动）。
 * 段落不够铺满时页数相应变少 —— 与其画空白页，不如少画一页。
 */
export const PagedBody: React.FC<{ name: string; body?: Body }> = ({ name, body }) => {
  if (!body || body.kind !== 'doc') {
    return <div className="bg-white mx-2 my-2"><FlowBody name={name} body={body} /></div>;
  }
  const perPage = Math.max(1, Math.ceil(body.paragraphs.length / PDF_PAGE_COUNT));
  const pages: string[][] = [];
  for (let i = 0; i < body.paragraphs.length; i += perPage) pages.push(body.paragraphs.slice(i, i + perPage));

  return (
    <>
      {pages.map((paras, idx) => (
        <div key={idx} className="bg-white mx-2 my-2 px-5 py-6" style={{ minHeight: 420 }}>
          {idx === 0 && (
            <div className="text-[19px] leading-snug mb-4" style={{ color: GD.text }}>{body.title}</div>
          )}
          {paras.map((t, i) => (
            <p key={i} className="text-[14px] leading-[1.9] mb-4" style={{ color: GD.text }}>{t}</p>
          ))}
          <div className="text-[11px] mt-4 text-center" style={{ color: GD.textSecondary }}>
            {idx + 1} / {pages.length}
          </div>
        </div>
      ))}
    </>
  );
};
