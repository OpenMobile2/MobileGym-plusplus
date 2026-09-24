import defaults from './defaults.json';
import type { PddState } from '../types';

// 构建时种子数据。资源路径已是 /@app-assets/Pinduoduo/... 绝对虚拟 URL(见 vite serveAppAssetsPlugin)。
export const PDD_CONFIG = defaults as unknown as PddState;
