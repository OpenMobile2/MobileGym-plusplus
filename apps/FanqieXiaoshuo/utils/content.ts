/**
 * 章节内容确定性合成:正文不入 defaults.json,由段落库按 (bookId, chapterIdx) 生成。
 * 无随机(合同禁 Math.random),同一输入永远同一输出 → 判题/走查可复现。
 */
import type { FanqieBook, FanqieState } from '../types';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function bankOf(state: Pick<FanqieState, 'paraBank'>, book: FanqieBook): string[] {
  return state.paraBank[book.category] ?? state.paraBank[Object.keys(state.paraBank)[0]] ?? [];
}

export function chapterTitle(state: Pick<FanqieState, 'chapterTitleBank'>, book: FanqieBook, chapterIdx: number): string {
  const bank = state.chapterTitleBank[book.category] ?? [];
  if (bank.length === 0) return `第${chapterIdx + 1}章`;
  const t = bank[(hashStr(book.id) + chapterIdx) % bank.length];
  return `第${chapterIdx + 1}章 ${t}`;
}

/** 合成一章正文段落(14~18 段,首段随章节号变化) */
export function chapterParagraphs(
  state: Pick<FanqieState, 'paraBank'>,
  book: FanqieBook,
  chapterIdx: number,
): string[] {
  const bank = bankOf(state, book);
  if (bank.length === 0) return [book.intro];
  const seed = hashStr(book.id) + chapterIdx * 7;
  const count = 14 + (seed % 5);
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(bank[(seed + i * 3 + Math.floor(i / bank.length)) % bank.length]);
  }
  return out;
}

/** 章节字数(展示用,确定性) */
export function chapterWordCount(book: FanqieBook, chapterIdx: number): number {
  return 1900 + ((hashStr(book.id) + chapterIdx * 13) % 1400);
}

/** 覆盖翻页模式分页:按字号估算每页字符数,把段落切成页 */
export function paginate(paragraphs: string[], fontSize: number, isFirstChapterPage: boolean): string[][] {
  // 阅读区 ~328×620(360 视口 - 边距 - 顶/底信息条);行高 1.8
  const px = Math.round(fontSize * 0.78); // 显示档 23 ≈ 18px
  const charsPerLine = Math.max(8, Math.floor(328 / px));
  const linesPerPage = Math.max(6, Math.floor(620 / (px * 1.8)));
  const pageChars = charsPerLine * linesPerPage;
  const firstPageChars = isFirstChapterPage ? Math.floor(pageChars * 0.82) : pageChars; // 章首标题占位
  const pages: string[][] = [];
  let cur: string[] = [];
  let used = 0;
  let budget = firstPageChars;
  for (const p of paragraphs) {
    const cost = p.length + charsPerLine; // 段间距按一行折算
    if (used + cost > budget && cur.length > 0) {
      pages.push(cur);
      cur = [];
      used = 0;
      budget = pageChars;
    }
    cur.push(p);
    used += cost;
  }
  if (cur.length > 0) pages.push(cur);
  return pages;
}

/** 全书总页数(阅读器页脚 x/总数;随字号重排,只按当前章折算展示) */
export function bookTotalPages(book: FanqieBook, pagesInChapter: number): number {
  return Math.max(1, book.chapters * pagesInChapter);
}

export function fmtWan(n: number): string {
  return n >= 1 ? `${n}万` : `${Math.round(n * 10000)}`;
}
