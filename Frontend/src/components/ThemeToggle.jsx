
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { mode, toggleTheme, theme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 10,
        border: `1px solid ${theme.cardBorder}`,
        background: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
        color: theme.textSecondary,
        cursor: 'pointer',
        boxShadow: mode === 'dark' ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s ease',
        outline: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = theme.cardBorder;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {mode === 'dark' ? (
        <Sun size={17} color="#fbbf24" strokeWidth={2.2} />
      ) : (
        <Moon size={17} color="#6366f1" strokeWidth={2.2} />
      )}
    </button>
  );
}