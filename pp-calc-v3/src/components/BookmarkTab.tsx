import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { BookmarkItem } from '../utils/types';
import { useSettings } from '../utils/SettingsContext';
import { exportBookmarksCSV } from '../utils/csvExport';

interface Props {
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  onNavigateCalc: (dep: string, arr: string, fareId: string) => void;
  clearBookmarks: () => void;
}

export default function BookmarkTab({ bookmarks, toggleBookmark, onNavigateCalc, clearBookmarks }: Props) {
  const { C } = useSettings();

  const handleClearAll = () => {
    Alert.alert(
      'お気に入りを全削除',
      `${bookmarks.length}件のお気に入りをすべて削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '全削除', style: 'destructive', onPress: clearBookmarks },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg, padding: 14 }}>
      <View style={[s.card, { backgroundColor: C.card }]}>
        <View style={[s.header, { borderBottomColor: C.bdr }]}>
          <Text style={[s.headerTitle, { color: C.text }]}>★ お気に入り路線</Text>
          <View style={s.headerRight}>
            <Text style={[s.headerCount, { color: C.sub }]}>{bookmarks.length}件</Text>
            {bookmarks.length > 0 && (
              <>
                <TouchableOpacity onPress={() => exportBookmarksCSV(bookmarks)} style={[s.exportBtn, { borderColor: C.pri }]}>
                  <Text style={[s.exportBtnText, { color: C.pri }]}>CSVで出力</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearAll} style={[s.clearBtn, { borderColor: C.danger }]}>
                  <Text style={[s.clearBtnText, { color: C.danger }]}>全削除</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {bookmarks.length === 0 ? (
          <View style={s.empty}>
            <Text style={[s.emptyIcon, { color: C.sub }]}>☆</Text>
            <Text style={[s.emptyText, { color: C.sub }]}>PP計算結果や路線一覧から{'\n'}★をタップして追加できます</Text>
          </View>
        ) : (
          bookmarks.map((b, i) => (
            <View key={i} style={[s.item, { backgroundColor: i % 2 === 0 ? C.white : C.bg, borderBottomColor: C.bdr }]}>
              <View style={s.itemTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.route, { color: C.text }]}>{b.route}</Text>
                  <Text style={[s.fare, { color: C.sub }]}>{b.fare}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.ppValue, { color: C.pri }]}>{b.ppRound?.toLocaleString()} <Text style={[s.ppLabel, { color: C.sub }]}>PP/往復</Text></Text>
                  <Text style={[s.subInfo, { color: C.sub }]}>{b.trips}往復で達成{b.ppUnit ? ` ・ 単価${b.ppUnit.toFixed(1)}円` : ""}</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => onNavigateCalc(b.dep, b.arr, b.fareId)} style={[s.calcAction, { borderColor: C.pri }]}>
                  <Text style={[s.calcActionText, { color: C.pri }]}>この条件で計算</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleBookmark(b)} style={[s.deleteAction, { borderColor: C.danger }]}>
                  <Text style={[s.deleteActionText, { color: C.danger }]}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 13, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCount: { fontSize: 11 },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  clearBtnText: { fontSize: 11, fontWeight: '600' },
  exportBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  exportBtnText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  item: { padding: 14, borderBottomWidth: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between' },
  route: { fontSize: 14, fontWeight: '700' },
  fare: { fontSize: 10, marginTop: 2 },
  ppValue: { fontSize: 18, fontWeight: '700' },
  ppLabel: { fontSize: 10, fontWeight: '400' },
  subInfo: { fontSize: 10, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  calcAction: { flex: 1, paddingVertical: 7, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  calcActionText: { fontSize: 11, fontWeight: '600' },
  deleteAction: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1 },
  deleteActionText: { fontSize: 11, fontWeight: '600' },
});
