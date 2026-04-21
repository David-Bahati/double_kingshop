// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

// 🎯 Thèmes disponibles avec configuration Tailwind
const THEMES = {
  light: {
    name: 'Clair',
    class: 'light',
    colors: {
      primary: 'blue-600',
      background: 'slate-50',
      surface: 'white',
      text: 'slate-900',
      textMuted: 'slate-500',
      border: 'slate-200'
    }
  },
  dark: {
    name: 'Sombre',
    class: 'dark',
    colors: {
      primary: 'blue-500',
      background: 'slate-900',
      surface: 'slate-800',
      text: 'slate-100',
      textMuted: 'slate-400',
      border: 'slate-700'
    }
  }
};

// 🎯 Clés de stockage
const STORAGE_KEYS = {
  theme: 'dks-theme',
  reducedMotion: 'dks-reduced-motion'
};

export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  // 🎯 État du thème
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      if (saved && THEMES[saved]) return saved;
      
      // Fallback : préférence système
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : defaultTheme;
      }      return defaultTheme;
    } catch (err) {
      console.error('Erreur lecture thème:', err);
      return defaultTheme;
    }
  });

  // 🎯 Préférence "réduire les animations" (accessibilité)
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.reducedMotion);
      if (saved !== null) return saved === 'true';
      return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    } catch {
      return false;
    }
  });

  // 🎯 Appliquer le thème au document
  useEffect(() => {
    const root = document.documentElement;
    const themeClass = THEMES[theme]?.class || theme;
    
    // Retirer toutes les classes de thème possibles
    Object.values(THEMES).forEach(t => root.classList.remove(t.class));
    
    // Ajouter la classe du thème actif
    root.classList.add(themeClass);
    
    // Sauvegarder
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch (err) {
      console.error('Erreur sauvegarde thème:', err);
    }
  }, [theme]);

  // 🎯 Appliquer la préférence de mouvement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.reducedMotion, String(reducedMotion));
      
      // Optionnel : ajouter une classe CSS pour les animations réduites
      const root = document.documentElement;
      if (reducedMotion) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }
    } catch (err) {      console.error('Erreur sauvegarde reducedMotion:', err);
    }
  }, [reducedMotion]);

  // 🎯 Écouter les changements de préférence système
  useEffect(() => {
    if (!window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Ne changer que si l'utilisateur n'a pas défini de préférence manuelle
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    // Listener pour Chrome/Firefox modernes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback pour anciens navigateurs
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 🎯 Actions
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setThemeSafe = useCallback((newTheme) => {
    if (THEMES[newTheme]) {
      setTheme(newTheme);
    }
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion(prev => !prev);
  }, []);
  // 🎯 Valeurs calculées (mémoïsées)
  const themeConfig = useMemo(() => THEMES[theme] || THEMES.light, [theme]);
  
  const colorClasses = useMemo(() => {
    const c = themeConfig.colors;
    return {
      // Classes Tailwind prêtes à l'emploi
      bg: `bg-${c.background}`,
      bgSurface: `bg-${c.surface}`,
      text: `text-${c.text}`,
      textMuted: `text-${c.textMuted}`,
      border: `border-${c.border}`,
      primary: `text-${c.primary}`,
      bgPrimary: `bg-${c.primary}`,
      // Variantes hover/focus
      hoverPrimary: `hover:bg-${c.primary} hover:text-white`,
      focusRing: `focus:ring-${c.primary} focus:ring-2`
    };
  }, [themeConfig]);

  // 🎯 Valeur exposée par le contexte
  const value = useMemo(() => ({
    // États
    theme,
    isDarkMode: theme === 'dark',
    reducedMotion,
    
    // Actions
    toggleTheme,
    setTheme: setThemeSafe,
    toggleReducedMotion,
    
    // Config
    themes: Object.keys(THEMES),
    themeConfig,
    colors: themeConfig.colors,
    colorClasses,
    
    // Helpers
    getThemeClass: (t) => THEMES[t]?.class || t,
    isTheme: (t) => theme === t
  }), [theme, reducedMotion, toggleTheme, setThemeSafe, toggleReducedMotion, themeConfig, colorClasses]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
// 🎯 Hook personnalisé avec vérification
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

// 🎯 Hook utilitaire pour les classes conditionnelles
export const useThemeClasses = () => {
  const { colorClasses, reducedMotion } = useTheme();
  
  return {
    // Classes de base
    ...colorClasses,
    
    // Transitions (désactivées si reducedMotion)
    transition: reducedMotion ? '' : 'transition-colors duration-200',
    
    // Combinaisons utiles
    card: `${colorClasses.bgSurface} ${colorClasses.border} border rounded-2xl shadow-sm`,
    button: `${colorClasses.bgPrimary} text-white font-bold py-3 px-6 rounded-xl hover:opacity-90`,
    input: `${colorClasses.bgSurface} ${colorClasses.border} border rounded-xl px-4 py-3 outline-none focus:ring-2 ${colorClasses.focusRing}`
  };
};

export default ThemeContext;