
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  dark: {
    bg: '#030712',
    bgGradient: `
      radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.06) 0px, transparent 50%)
    `,
    headerBg: 'rgba(11, 15, 25, 0.85)',
    headerBorder: 'rgba(255, 255, 255, 0.08)',
    surface: '#0e1422',
    surfaceSecondary: '#131b2e',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    cardHoverBorder: 'rgba(99, 102, 241, 0.35)',
    textPrimary: '#f9fafb',
    textSecondary: '#9ca3af',
    inputBg: '#131b2e',
    inputBorder: '#1f2937',
    inputFocusBorder: '#6366f1',
    tagBg: 'rgba(255, 255, 255, 0.04)',
    tagBorder: 'rgba(255, 255, 255, 0.08)',
    tagText: '#9ca3af',
    tagActiveBg: 'rgba(99, 102, 241, 0.15)',
    tagActiveBorder: '#6366f1',
    tagActiveText: '#a5b4fc',
    summaryBg: 'rgba(16, 185, 129, 0.06)',
    summaryBorder: 'rgba(16, 185, 129, 0.2)',
    summaryText: '#d1fae5',
    actionBg: 'rgba(59, 130, 246, 0.06)',
    actionBorder: 'rgba(59, 130, 246, 0.2)',
    actionText: '#dbeafe',
    cardShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    creatorShadow: '0 12px 30px rgba(0, 0, 0, 0.3)'
  },
  light: {
    bg: '#f8fafc',
    bgGradient: `
      radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.04) 0px, transparent 50%)
    `,
    headerBg: 'rgba(255, 255, 255, 0.85)',
    headerBorder: '#e2e8f0',
    surface: '#ffffff',
    surfaceSecondary: '#f8fafc',
    cardBorder: '#e2e8f0',
    cardHoverBorder: '#cbd5e1',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    inputFocusBorder: '#4f46e5',
    tagBg: '#f1f5f9',
    tagBorder: '#e2e8f0',
    tagText: '#64748b',
    tagActiveBg: '#e0e7ff',
    tagActiveBorder: '#6366f1',
    tagActiveText: '#4338ca',
    summaryBg: '#f0fdf4',
    summaryBorder: '#bbf7d0',
    summaryText: '#166534',
    actionBg: '#eff6ff',
    actionBorder: '#bfdbfe',
    actionText: '#1e40af',
    cardShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    creatorShadow: '0 4px 20px rgba(15, 23, 42, 0.05)'
  }
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', mode);
    document.body.style.backgroundColor = themes[mode].bg;
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme: themes[mode] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);