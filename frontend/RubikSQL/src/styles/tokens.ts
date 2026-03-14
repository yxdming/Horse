// Design tokens following Ollama's minimalist principles
export const tokens = {
  colors: {
    // Core - Pure White Theme
    white: '#FFFFFF',
    offWhite: '#F0EEE9', // Pantone 11-4201
    gray: {
      50: '#F9FAFB',   // Barely gray
      100: '#F3F4F6',  // Very light gray
      200: '#E5E7EB',  // Light gray - default border
      300: '#D1D5DB',  // Medium light gray
      400: '#9CA3AF',  // Medium gray
      500: '#6B7280',  // Text secondary
      900: '#1A1A1A',  // Text primary - near black
    },
    // Single accent color - blue only
    accent: {
      50: '#EFF6FF',   // Blue 50 - hover background
      500: '#3B82F6',  // Blue 500 - primary actions
      600: '#2563EB',  // Blue 600 - hover state
    },
    // Semantic - used sparingly
    success: '#22C55E',
    successBg: '#F0FDF4',
    warning: '#F59E0B',
    error: '#EF4444',
    // Button primary - dark
    btnPrimary: '#2D2D2D',
  },
  spacing: {
    // 8-point grid system
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px - default padding
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px - sections
    12: '3rem',    // 48px - generous spacing
  },
  borderRadius: {
    sm: '0.25rem',  // 4px - Subtle, not rounded
    md: '0.375rem', // 6px - Default
    lg: '0.5rem',   // 8px - Cards
    xl: '0.75rem',  // 12px - Rarely used
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',    // Almost invisible
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',  // Subtle elevation
  },
  // Typography - Inter for text, JetBrains Mono for code
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
  },
  transition: {
    fast: '150ms ease',   // Brief, subtle
    normal: '200ms ease',
    slow: '300ms ease',   // Page transitions
    slower: '500ms ease', // Success flash
  },
  sizing: {
    // All in rem for scalability
    inputHeight: '2.5rem',  // 40px - Relative to font
    btnHeightSm: '2rem',    // 32px
    btnHeightMd: '2.5rem',  // 40px
    btnHeightLg: '3rem',    // 48px
  },
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    tooltip: 1300,
    notification: 1400,
  },
};