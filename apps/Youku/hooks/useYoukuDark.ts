import { useDarkMode } from '@/os/hooks/useDarkMode';
import { useYoukuStore } from '../state';

/** App 外观:默认深色;仅 light 强制亮、system 跟 OS,其余一律深色 */
export function useYoukuDark(): boolean {
  const appearanceMode = useYoukuStore((s) => s.appearanceMode) ?? 'dark';
  const { isDark: osDark } = useDarkMode();
  if (appearanceMode === 'light') return false;
  if (appearanceMode === 'system') return osDark;
  return true;
}
