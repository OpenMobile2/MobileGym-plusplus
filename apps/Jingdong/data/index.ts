import defaults from './defaults.json';
import type { JdState } from '../types';

// 构建时种子数据。资源路径已是 /@app-assets/Jingdong/... 绝对虚拟 URL(见 vite serveAppAssetsPlugin)。
export const JD_CONFIG = defaults as unknown as JdState;
