import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Modal, KeyboardAvoidingView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from './src/utils/colors';
import { HistoryItem, BookmarkItem } from './src/utils/types';
import { ProProvider, usePro } from './src/utils/ProContext';
import { SettingsProvider, useSettings } from './src/utils/SettingsContext';
import CalcTab from './src/components/CalcTab';
import ListTab from './src/components/ListTab';
import BookmarkTab from './src/components/BookmarkTab';
import DashTab from './src/components/DashTab';
import ProUpgradeScreen from './src/components/ProUpgradeScreen';
import SettingsTab from './src/components/SettingsTab';

const Tab = createBottomTabNavigator();

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24);

function HeaderBar({ totalPP, prog, onProPress, isPro, C }: { totalPP: number; prog: number; onProPress: () => void; isPro: boolean; C: typeof import('./src/utils/colors').C }) {
  return (
    <View style={{ backgroundColor: C.pri, paddingTop: STATUSBAR_HEIGHT }}>
      <View style={{ paddingBottom: 12, paddingHorizontal: 20, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 22 }}>✈️</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.white }}>PP Calculator</Text>
              {isPro && (
                <View style={{ backgroundColor: C.acc, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.priDk }}>Pro</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10, color: C.accLt, marginTop: 2, letterSpacing: 1 }}>SFC修行サポートツール</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!isPro && (
              <TouchableOpacity onPress={onProPress} style={{ backgroundColor: 'rgba(212,168,67,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.acc }}>👑 Proにアップグレード</Text>
              </TouchableOpacity>
            )}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: C.accLt }}>累計PP</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: C.acc }}>{totalPP.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
          <View style={{ height: '100%', borderRadius: 4, backgroundColor: C.acc, width: `${Math.min(prog, 100)}%` as any }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>0</Text>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>残り {Math.max(0, 50000 - totalPP).toLocaleString()}PP</Text>
          <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>50,000PP</Text>
        </View>
      </View>
    </View>
  );
}

function TabIcon({ emoji, focused, C }: { emoji: string; focused: boolean; C: typeof import('./src/utils/colors').C }) {
  return (
    <View style={[ti.wrap, focused && { backgroundColor: C.pri }]}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  );
}

const ti = StyleSheet.create({
  wrap: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});

function AppContent() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showProModal, setShowProModal] = useState(false);
  const navigationRef = useRef<any>(null);
  const { isPro, setIsPro } = usePro();
  const { settings, C } = useSettings();

  const loadedRef = useRef({ history: false, bookmarks: false });

  useEffect(() => {
    (async () => {
      try {
        const hData = await AsyncStorage.getItem('history');
        const bData = await AsyncStorage.getItem('bookmarks');
        if (hData) setHistory(JSON.parse(hData));
        if (bData) setBookmarks(JSON.parse(bData));
      } catch {}
      loadedRef.current = { history: true, bookmarks: true };
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current.history) return;
    AsyncStorage.setItem('history', JSON.stringify(history)).catch(() => {});
  }, [history]);

  useEffect(() => {
    if (!loadedRef.current.bookmarks) return;
    AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks)).catch(() => {});
  }, [bookmarks]);

  const toggleBookmark = useCallback((item: BookmarkItem) => {
    setBookmarks(prev => {
      const key = `${item.dep}-${item.arr}-${item.fareId}`;
      const exists = prev.find(b => `${b.dep}-${b.arr}-${b.fareId}` === key);
      if (exists) return prev.filter(b => `${b.dep}-${b.arr}-${b.fareId}` !== key);
      return [...prev, item];
    });
  }, []);

  const isBookmarked = useCallback((dep: string, arr: string, fareId: string) => {
    return bookmarks.some(b => b.dep === dep && b.arr === arr && b.fareId === fareId);
  }, [bookmarks]);

  const totalPP = history.reduce((s, item) => s + item.pp, 0);
  const prog = Math.min((totalPP / 50000) * 100, 100);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={C.priDk}
      />
      <HeaderBar totalPP={totalPP} prog={prog} onProPress={() => setShowProModal(true)} isPro={isPro} C={C} />
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: C.pri,
            tabBarInactiveTintColor: C.sub,
            tabBarStyle: {
              backgroundColor: C.white,
              borderTopColor: C.bdr,
              paddingBottom: Platform.OS === 'ios' ? 28 : 6,
              paddingTop: 6,
              height: Platform.OS === 'ios' ? 88 : 60,
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="PP計算"
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✏️" focused={focused} C={C} /> }}
          >
            {() => (
              <CalcTab
                history={history}
                setHistory={setHistory}
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                isBookmarked={isBookmarked}
                onShowPro={() => setShowProModal(true)}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="ダッシュボード"
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} C={C} /> }}
          >
            {() => <DashTab history={history} setHistory={setHistory} />}
          </Tab.Screen>

          <Tab.Screen
            name="フライト管理"
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🗓️" focused={focused} C={C} /> }}
          >
            {() => (
              <ListTab
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                isBookmarked={isBookmarked}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="お気に入り"
            options={{
              tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} C={C} />,
              tabBarBadge: bookmarks.length > 0 ? bookmarks.length : undefined,
            }}
          >
            {() => (
              <BookmarkTab
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                clearBookmarks={() => setBookmarks([])}
                onNavigateCalc={(dep, arr, fareId) => {
                  navigationRef.current?.navigate('PP計算');
                }}
              />
            )}
          </Tab.Screen>

          <Tab.Screen
            name="設定"
            options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} C={C} /> }}
          >
            {() => <SettingsTab history={history} bookmarks={bookmarks} onShowPro={() => setShowProModal(true)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      <Modal visible={showProModal} animationType="slide" presentationStyle="pageSheet">
        <ProUpgradeScreen
          onClose={() => setShowProModal(false)}
          onPurchased={() => { setIsPro(true); setShowProModal(false); }}
          isPro={isPro}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ProProvider>
        <AppContent />
      </ProProvider>
    </SettingsProvider>
  );
}
