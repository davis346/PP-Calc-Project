import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorPalette } from './colors';

const SETTINGS_KEY = '@ppcalc_settings';

interface Settings {
  darkMode: boolean;
  homeAirport: string;
  defaultFare: string;
}

const defaultSettings: Settings = {
  darkMode: false,
  homeAirport: 'HND',
  defaultFare: 'new-e-std',
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  C: ColorPalette;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  C: lightColors,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {}
    })();
  }, []);

  const updateSettings = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {}
  };

  const C = settings.darkMode ? darkColors : lightColors;

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, C }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
