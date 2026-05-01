import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  siteName: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  primaryColor: '#1b2838', // steam-bg
  secondaryColor: '#2a475e', // steam-card
  accentColor: '#66c0f4', // steam-blue
  siteName: 'SteamLink Marketplace',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const { profile } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (s) => {
      if (s.exists()) {
        const data = s.data() as SiteSettings;
        setSettings(data);
      }
    });
    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    if (profile?.role !== 'admin') return;
    const updated = { ...settings, ...newSettings };
    await setDoc(doc(db, 'settings', 'site'), updated);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
