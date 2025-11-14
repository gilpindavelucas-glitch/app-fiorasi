
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Theme, ThemeColors } from '../types';

const defaultColors: ThemeColors = {
    primary: '#003399',      // Ford Blue
    secondary: '#E9EEF6',    // Light Silver-Blue
    background: '#F8F9FA',   // Very light gray
    text: '#121212',         // Dark Gray
    primaryLight: '#D2D9E6', // Lighter shade for hover
    border: '#DEE2E6',       // Standard border color
};

const defaultTheme: Theme = {
    colors: defaultColors,
    fontSize: 16,
};

interface ThemeContextType {
    theme: Theme;
    setTheme: React.Dispatch<React.SetStateAction<Theme>>;
    themeStyles: string;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const savedTheme = localStorage.getItem('app-theme');
            return savedTheme ? JSON.parse(savedTheme) : defaultTheme;
        } catch (error) {
            return defaultTheme;
        }
    });

    useEffect(() => {
        localStorage.setItem('app-theme', JSON.stringify(theme));
    }, [theme]);

    const themeStyles = useMemo(() => {
        return `
      :root {
        --primary-color: ${theme.colors.primary};
        --primary-color-light: ${theme.colors.primaryLight};
        --secondary-color: ${theme.colors.secondary};
        --background-color: ${theme.colors.background};
        --text-color: ${theme.colors.text};
        --border-color: ${theme.colors.border};
        --base-font-size: ${theme.fontSize}px;
      }
      body {
        font-size: var(--base-font-size);
      }
    `;
    }, [theme]);

    const resetTheme = useCallback(() => {
        setTheme(defaultTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themeStyles, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
