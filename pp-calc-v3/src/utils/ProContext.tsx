import React, { createContext, useContext, useState, useEffect } from 'react';
import { isProUser } from './iapManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// DEV ONLY: 本番ビルド時は __DEV__ が自動的に false になるので変更不要
const DEBUG_FORCE_PRO = __DEV__ && false; // trueにするとProとして動作

interface ProContextType {
  isPro: boolean;
  setIsPro: (v: boolean) => void;
  dailyCalcCount: number;
  incrementCalcCount: () => void;
  canCalc: () => boolean;
  canAddFlight: (currentCount: number) => boolean;
  canAddBookmark: (currentCount: number) => boolean;
  canUseIntl: () => boolean;
  canSeeFullRanking: () => boolean;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  setIsPro: () => {},
  dailyCalcCount: 0,
  incrementCalcCount: () => {},
  canCalc: () => true,
  canAddFlight: () => true,
  canAddBookmark: () => true,
  canUseIntl: () => true,
  canSeeFullRanking: () => true,
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [dailyCalcCount, setDailyCalcCount] = useState(0);

  useEffect(() => {
    (async () => {
      // isProUser() reads from AsyncStorage only — no IAP connection needed on startup.
      const pro = DEBUG_FORCE_PRO || await isProUser();
      setIsPro(pro);

      // Load daily calc count
      const today = new Date().toISOString().slice(0, 10);
      const stored = await AsyncStorage.getItem('@calc_count');
      if (stored) {
        const { date, count } = JSON.parse(stored);
        if (date === today) {
          setDailyCalcCount(count);
        }
      }
    })();
  }, []);

  const incrementCalcCount = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCount = dailyCalcCount + 1;
    setDailyCalcCount(newCount);
    await AsyncStorage.setItem('@calc_count', JSON.stringify({ date: today, count: newCount }));
  };

  const FREE_CALC_LIMIT = 3;
  const FREE_FLIGHT_LIMIT = 3;
  const FREE_BOOKMARK_LIMIT = 3;

  return (
    <ProContext.Provider value={{
      isPro,
      setIsPro,
      dailyCalcCount,
      incrementCalcCount,
      canCalc: () => isPro || dailyCalcCount < FREE_CALC_LIMIT,
      canAddFlight: (count) => isPro || count < FREE_FLIGHT_LIMIT,
      canAddBookmark: (count) => isPro || count < FREE_BOOKMARK_LIMIT,
      canUseIntl: () => isPro,
      canSeeFullRanking: () => isPro,
    }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  return useContext(ProContext);
}
