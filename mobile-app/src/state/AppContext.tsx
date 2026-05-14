/**
 * Global app state — language, user, auth, current trace/booking.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { strings, Lang, Strings } from '../theme/strings';
import { themes, ThemeName } from '../theme/themes';

export type AppMode = 'customer' | 'provider';

export type ProviderProfile = {
  provider_id: string;
  business_name: string;
  primary_service: string;
  price_range: string;
  description: string;
  is_active: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  phone: string;
  city: string;
  sector?: string;
  email?: string;
  avatarSeed: string;
  joinedAt: string;
  provider?: ProviderProfile | null;
};

type AppState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
  isSignedIn: boolean;
  setSignedIn: (b: boolean) => void;
  signOut: () => void;
  currentTrace: any | null;
  setCurrentTrace: (t: any | null) => void;
  currentBooking: any | null;
  setCurrentBooking: (b: any | null) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  isProvider: boolean;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  colors: typeof themes.dark;
  hydrated: boolean;
};

const DEFAULT_USER: UserProfile = {
  id: 'U001',
  name: 'Huzaifa',
  phone: '0300-1234567',
  city: 'islamabad',
  sector: 'G-13',
  email: 'huzaifanaeem.work@gmail.com',
  avatarSeed: 'U001',
  joinedAt: '2026-05-12',
};

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('ur');
  const [isSignedIn, setSignedInState] = useState(false);
  const [currentTrace, setCurrentTrace] = useState<any | null>(null);
  const [currentBooking, setCurrentBooking] = useState<any | null>(null);
  const [user, setUserState] = useState<UserProfile>(DEFAULT_USER);
  const [mode, setModeState] = useState<AppMode>('customer');
  const [theme, setThemeState] = useState<ThemeName>('dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedLang, storedSignedIn, storedUser, storedMode, storedTheme] = await Promise.all([
          AsyncStorage.getItem('lang'),
          AsyncStorage.getItem('signedIn'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('mode'),
          AsyncStorage.getItem('theme'),
        ]);
        if (storedLang === 'ur' || storedLang === 'en') setLangState(storedLang);
        if (storedSignedIn === '1') setSignedInState(true);
        if (storedUser) {
          try {
            setUserState({ ...DEFAULT_USER, ...JSON.parse(storedUser) });
          } catch {}
        }
        if (storedMode === 'provider' || storedMode === 'customer') setModeState(storedMode);
        if (storedTheme === 'light' || storedTheme === 'dark') setThemeState(storedTheme);
      } catch {}
      setHydrated(true);
    })();
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    AsyncStorage.setItem('mode', m).catch(() => {});
  };

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.setItem('theme', t).catch(() => {});
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem('lang', l).catch(() => {});
  };

  const setSignedIn = (b: boolean) => {
    setSignedInState(b);
    AsyncStorage.setItem('signedIn', b ? '1' : '0').catch(() => {});
  };

  const setUser = (u: UserProfile) => {
    setUserState(u);
    AsyncStorage.setItem('user', JSON.stringify(u)).catch(() => {});
  };

  const signOut = () => {
    setSignedInState(false);
    setUserState(DEFAULT_USER);
    setModeState('customer');
    AsyncStorage.multiRemove(['signedIn', 'user', 'mode']).catch(() => {});
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: strings[lang],
        isSignedIn,
        setSignedIn,
        signOut,
        currentTrace,
        setCurrentTrace,
        currentBooking,
        setCurrentBooking,
        user,
        setUser,
        mode,
        setMode,
        isProvider: !!user.provider,
        theme,
        setTheme,
        colors: themes[theme],
        hydrated,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
