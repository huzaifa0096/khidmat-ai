/**
 * Convenience hook — returns the current theme palette + radii/spacing/etc.
 * Use this in any screen/component that needs to respect the dark/light toggle.
 */
import { useApp } from '../state/AppContext';
import { radii, spacing, typography, shadows } from '../theme/themes';

export const useTheme = () => {
  const { colors, theme } = useApp();
  return { colors, theme, radii, spacing, typography, shadows, isDark: theme === 'dark' };
};
