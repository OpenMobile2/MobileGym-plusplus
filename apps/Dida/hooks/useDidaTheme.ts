import { useOsStateStore } from '@/os/OsStateStore';
import { ACCENT_HEX, DARK, LIGHT } from '../res/colors';
import { useDidaStore } from '../state';

/** 解析外观设置 → 是否深色、强调色、色板 token */
export function useDidaTheme() {
  const theme = useDidaStore((s) => s.settings.theme);
  const osDark = useOsStateStore((s) => s.settings.global.darkModeEnabled);

  const isDark = theme === 'system' ? osDark : theme === 'dark';
  const palette = isDark ? DARK : LIGHT;
  const accentHex = ACCENT_HEX.orange;

  return {
    isDark,
    theme,
    accentHex,
    colors: palette,
    /** 挂在 App 根上的 CSS 变量 */
    cssVars: {
      ['--dida-bg' as string]: palette.base,
      ['--dida-card' as string]: palette.card,
      ['--dida-sheet' as string]: palette.sheet,
      ['--dida-drawer' as string]: palette.drawer,
      ['--dida-elevated' as string]: palette.elevated,
      ['--dida-day' as string]: palette.dayCell,
      ['--dida-chip-off' as string]: palette.chipOff,
      ['--dida-row-selected' as string]: palette.rowSelected,
      ['--dida-period-selected' as string]: palette.periodSelected,
      ['--dida-text' as string]: palette.textPrimary,
      ['--dida-muted' as string]: palette.textSecondary,
      ['--dida-tertiary' as string]: palette.textTertiary,
      ['--dida-divider' as string]: palette.divider,
      ['--dida-border' as string]: palette.border,
      ['--dida-accent' as string]: accentHex,
    } as Record<string, string>,
  };
}
