import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

const lightTheme = {
    background: '#f8fafc',
    card: '#ffffff',
    text: '#1f2937',
    subtext: '#64748b',
    primary: '#3b82f6',
    border: '#e2e8f0',
    header: '#1e3a8a',
    headerText: '#ffffff',
    tabInactive: '#e2e8f0',
    tabActive: '#dbeafe',
    buttonText: '#ffffff',
};

const darkTheme = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    subtext: '#94a3b8',
    primary: '#60a5fa',
    border: '#334155',
    header: '#1e293b',
    headerText: '#ffffff',
    tabInactive: '#334155',
    tabActive: '#475569',
    buttonText: '#ffffff',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState(systemScheme || 'light');

    const themeData = theme === 'light' ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themeData }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);