import { useState, useEffect } from 'react';

const THEME_KEY = 'cmc-manager-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === DARK_THEME;
    // Default to dark (business) theme
    return true;
  });

  useEffect(() => {
    const theme = isDark ? DARK_THEME : LIGHT_THEME;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, toggleTheme, theme: isDark ? DARK_THEME : LIGHT_THEME };
};