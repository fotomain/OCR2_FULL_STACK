import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

export const lightTheme = {
  ...MD3LightTheme,
  isV3: true as const,
  version: 3 as const,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4f46e5',
    onPrimary: '#ffffff',
    primaryContainer: '#e0e7ff',
    onPrimaryContainer: '#1e1b4b',
    secondary: '#0284c7',
    onSecondary: '#ffffff',
    secondaryContainer: '#e0f2fe',
    onSecondaryContainer: '#075985',
    tertiary: '#7c3aed',
    onTertiary: '#ffffff',
    tertiaryContainer: '#ede9fe',
    onTertiaryContainer: '#4c1d95',
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#410002',
    background: '#f8fafc',
    onBackground: '#0f172a',
    surface: '#ffffff',
    onSurface: '#0f172a',
    surfaceVariant: '#f1f5f9',
    onSurfaceVariant: '#475569',
    surfaceDim: '#f1f5f9',
    surfaceBright: '#ffffff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f8fafc',
    surfaceContainer: '#f1f5f9',
    surfaceContainerHigh: '#e2e8f0',
    surfaceContainerHighest: '#cbd5e1',
    outline: '#cbd5e1',
    outlineVariant: '#e2e8f0',
    inverseSurface: '#1e293b',
    inverseOnSurface: '#f8fafc',
    inversePrimary: '#a5b4fc',
    shadow: '#000000',
    scrim: '#000000',
    cardBorder: '#e2e8f0',
    cardBg: '#ffffff',
    cardInnerBg: '#f8fafc',
    textMain: '#0f172a',
    textMuted: '#475569',
    textDim: '#64748b',
    headerBg: '#ffffff',
    metricBoxBg: '#f8fafc',
    heroCardBg: '#ffffff',
    heroCardBorder: '#c7d2fe',
    badgeUserBg: '#f1f5f9',
    badgeUserText: '#334155',
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f8fafc',
      level3: '#f1f5f9',
      level4: '#e2e8f0',
      level5: '#cbd5e1'
    }
  }
};

export const darkTheme = {
  ...MD3DarkTheme,
  isV3: true as const,
  version: 3 as const,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818cf8',
    onPrimary: '#1e1b4b',
    primaryContainer: '#312e81',
    onPrimaryContainer: '#e0e7ff',
    secondary: '#38bdf8',
    onSecondary: '#082f49',
    secondaryContainer: '#0369a1',
    onSecondaryContainer: '#e0f2fe',
    tertiary: '#a78bfa',
    onTertiary: '#2e1065',
    tertiaryContainer: '#5b21b6',
    onTertiaryContainer: '#ede9fe',
    error: '#ffb4ab',
    onError: '#690005',
    errorContainer: '#93000a',
    onErrorContainer: '#ffdad6',
    background: '#0b0f19',
    onBackground: '#f8fafc',
    surface: '#111827',
    onSurface: '#f8fafc',
    surfaceVariant: '#1f2937',
    onSurfaceVariant: '#9ca3af',
    surfaceDim: '#0b0f19',
    surfaceBright: '#1f2937',
    surfaceContainerLowest: '#030712',
    surfaceContainerLow: '#111827',
    surfaceContainer: '#1f2937',
    surfaceContainerHigh: '#374151',
    surfaceContainerHighest: '#4b5563',
    outline: '#4b5563',
    outlineVariant: '#374151',
    inverseSurface: '#f8fafc',
    inverseOnSurface: '#0f172a',
    inversePrimary: '#4f46e5',
    shadow: '#000000',
    scrim: '#000000',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    cardBg: '#111827',
    cardInnerBg: '#1f2937',
    textMain: '#f8fafc',
    textMuted: '#9ca3af',
    textDim: '#6b7280',
    headerBg: '#0b0f19',
    metricBoxBg: '#1f2937',
    heroCardBg: '#111827',
    heroCardBorder: 'rgba(129, 140, 248, 0.3)',
    badgeUserBg: 'rgba(255, 255, 255, 0.08)',
    badgeUserText: '#e2e8f0',
    elevation: {
      level0: 'transparent',
      level1: '#111827',
      level2: '#1f2937',
      level3: '#374151',
      level4: '#4b5563',
      level5: '#6b7280'
    }
  }
};

interface ThemeState {
  themeMode: ThemeMode;
}

const initialState: ThemeState = {
  themeMode: 'light' // Default is Light theme as requested
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    }
  }
});

export const { toggleTheme, setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
