import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from './src/utils/colors';
import { HistoryItem, BookmarkItem } from './src/utils/types';
import { ProProvider, usePro } from './src/utils/ProContext';
import CalcTab from './src/components/CalcTab';
import ListTab from './src/components/ListTab';
import BookmarkTab from './src/components/BookmarkTab';
import DashTab from './src/components/DashTab';
import ProUpgradeScreen from './src/components/ProUpgradeScreen';

const Tab = createBottomTabNavigator();

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24);

function HeaderBar({ totalPP, prog, onProPress, isPro }: { totalPP: number; prog: number; onProPress: () => void; isPro: boolean }) {
  return (
    <View style={[h.safeArea, { paddingTop: STATUSBAR_HEIGHT }]}>
      <View style={h.container}>
        <View style={h.topRow}>
          <View>
            <View style={h.titleRow}>
              <Text style={h.icon}>✈️</Text>
              <Text style={h.title}>PP Calculator</Text>
              {isPro && (
                <View style={h.proBadgeSmall}>
                  <Text style={h.proBadgeSmallText}>Pro</Text>
                </View>
              )}
            </View>
            <Text style={h.subtitle}>SFC修行サポートツール</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!isPro && (
              <TouchableOpacity onPress={onProPress} style={h.upgradeBtn}>
                <Text style={h.upgradeBtnText}>👑 Pro</Text>
              </TouchableOpacity>
            )}
            <View style={h.ppBox}>
              <Text style={h.ppLabel}>累計PP</Text>
              <Text style={h.ppValue}>{totalPP.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        <View style={h.barBg}>
          <View style={[h.barFill, { width: `${Math.min(prog, 100)}%` }]} />
        </View>
        <View style={h.barLabels}>
          <Text style={h.barText}>0</Text>
          <Text style={h.barText}>残り {Math.max(0, 50000 - totalPP).toLocaleString()}PP</Text>
          <Text style={h.barText}>50,000PP</Text>
        </View>
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  safeArea: { backgroundColor: C.pri },
  container: { paddingBottom: 12, paddingHorizontal: 20, paddingTop: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: '700', color: C.white },
  subtitle: { fontSize: 10, color: C.accLt, marginTop: 2, letterSpacing: 1 },
  proBadgeSmall: { backgroundColor: C.acc, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  proBadgeSmallText: { fontSize: 10, fontWeight: '700', color: C.priDk },
  upgradeBtn: { backgroundColor: 'rgba(212,168,67,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)' },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: C.acc },
  ppBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  ppLabel: { fontSize: 9, color: C.accLt },
  ppValue: { fontSize: 18, fontWeight: '700', color: C.acc },
  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: C.acc },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 },
  barText: { fontSize: 9, color: 'rgba(255,255,255,0.4)' },
});

function AppContent() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showProModal, setShowProModal] = useState(false);
  const navigationRef = useRef<any>(null);
  const { isPro, setIsPro } = usePro();

  useEffect(() => {
    (async () => {
      try {
        const hData = await AsyncStorage.getItem('history');
        const bData = await AsyncStorage.getItem('bookmarks');
        if (hData) setHistory(JSON.parse(hData));
        if (bData) setBookmarks(JSON.parse(bData));
      } catch {}
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem('history', JSON.stringify(history)).catch(() => {}); }, [history]);
  useEffect(() => { AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks)).catch(() => {}); }, [bookmarks]);

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
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.priDk} />
      <HeaderBar totalPP={totalPP} prog={prog} onProPress={() => setShowProModal(true)} isPro={isPro} />
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
            options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>✏️</Text> }}
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
            options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>📊</Text> }}
          >
            {() => <DashTab history={history} setHistory={setHistory} />}
          </Tab.Screen>

          <Tab.Screen
            name="フライト管理"
            options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>🗓️</Text> }}
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
              tabBarIcon: () => <Text style={{ fontSize: 22 }}>⭐</Text>,
              tabBarBadge: bookmarks.length > 0 ? bookmarks.length : undefined,
            }}
          >
            {() => (
              <BookmarkTab
                bookmarks={bookmarks}
                toggleBookmark={toggleBookmark}
                onNavigateCalc={(dep, arr, fareId) => {
                  navigationRef.current?.navigate('PP計算');
                }}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      {/* Pro Upgrade Modal */}
      <Modal visible={showProModal} animationType="slide" presentationStyle="pageSheet">
        <ProUpgradeScreen
          onClose={() => setShowProModal(false)}
          onPurchased={() => { setIsPro(true); setShowProModal(false); }}
          isPro={isPro}
        />
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <ProProvider>
      <AppContent />
    </ProProvider>
  );
}
