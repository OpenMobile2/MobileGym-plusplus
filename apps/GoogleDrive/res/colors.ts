// apps/GoogleDrive/res/colors.ts — 无法用 Tailwind 标准色表达的专用色
// 全部来自 docs/googledrive-replication/design-tokens.md（脚本从真机截图采样，非目测）
export const GD = {
  blue: '#1A73E8',            // 主按钮 / 选中勾 / Docs 图标 / 链接
  blueStrong: '#0B57D0',      // Gemini「New」徽标底
  blueContainer: '#C2E7FF',   // 底部 Tab 选中态药丸底
  blueSurface: '#E8F0FE',     // 多选选中行底 / 图标按钮圆底
  blueOnDark: '#8AB4F8',      // 深色 Toast 上的链接文字
  danger: '#B3261E',          // 不可逆操作（Delete forever）

  surface: '#FFFFFF',
  searchBg: '#E9EEF6',        // 顶部搜索栏胶囊底
  navbarBg: '#F0F4F9',        // 底部 Tab 栏底
  cardBg: '#F9F9F9',          // 网格视图缩略图卡片底
  divider: '#DADCE0',         // 1px 分隔线（仅弹层内部，列表行之间没有）
  scrim: 'rgba(0,0,0,0.52)',  // 弹层 / 对话框遮罩
  previewGap: '#ECECF1',      // PDF 预览页与页之间

  text: '#3C4043',
  textSecondary: '#5F6368',
  textPlaceholder: '#444746',
  toastBg: '#202124',

  // 文件类型色
  typePdf: '#D93025',
  typeDoc: '#1A73E8',
  typeSheet: '#1E8E3E',
  typeSlide: '#F9AB00',
  typeFolder: '#5F6368',

  // Google 品牌四色（存储用量分项、＋按钮十字）
  brandYellow: '#FBBC04',
  brandBlue: '#4285F4',
  brandRed: '#EA4335',
  brandGreen: '#34A853',
} as const;

// Change color 对话框的 24 色（IMG_2296：每行 7 个共 4 行，末行 3 个）
export const FOLDER_COLORS = [
  '#5F6368', '#8D6E63', '#C1665A', '#F03E2F', '#F4523B', '#F97316', '#FBA71B',
  '#FAD165', '#F7E38A', '#B6D96C', '#66BB44', '#0F9D58', '#3ECF8E', '#8FE3C0',
  '#A7E8EE', '#9FC6EA', '#2C77E8', '#8A9BF5', '#B69CF5', '#8E5FD9', '#CE64DE',
  '#F58BB4', '#C99BA6', '#CFC9C6',
] as const;
