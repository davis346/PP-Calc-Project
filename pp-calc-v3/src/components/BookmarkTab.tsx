import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../utils/colors';
import { BookmarkItem } from '../utils/types';

interface Props {
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  onNavigateCalc: (dep: string, arr: string, fareId: string) => void;
}

export default function BookmarkTab({ bookmarks, toggleBookmark, onNavigateCalc }: Props) {
  return (
    <ScrollView style={s.container}>
      <View style={s.card}>
        <View style={s.header}>
          <Text style={s.headerTitle}>★ お気に入り路線</Text>
          <Text style={s.headerCount}>{bookmarks.length}件</Text>
        </View>

        {bookmarks.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>☆</Text>
            <Text style={s.emptyText}>PP計算結果や路線一覧から{'\n'}★をタップして追加できます</Text>
          </View>
        ) : (
          bookmarks.map((b, i) => (
            <View key={i} style={[s.item, { backgroundColor: i % 2 === 0 ? C.white : C.bg }]}>
              <View style={s.itemTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.route}>{b.route}</Text>
                  <Text style={s.fare}>{b.fare}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.ppValue}>{b.ppRound?.toLocaleString()} <Text style={s.ppLabel}>PP/往復</Text></Text>
                  <Text style={s.subInfo}>{b.trips}往復で達成{b.ppUnit ? ` ・ 単価${b.ppUnit.toFixed(1)}円` : ""}</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => onNavigateCalc(b.dep, b.arr, b.fareId)} style={s.calcAction}>
                  <Text style={s.calcActionText}>この条件で計算</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleBookmark(b)} style={s.deleteAction}>
                  <Text style={s.deleteActionText}>削除</Text>
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
  container: { flex: 1, backgroundColor: C.bg, padding: 14 },
  card: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.bdr },
  headerTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  headerCount: { fontSize: 11, color: C.sub },
  empty: { padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 32, color: C.sub, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20 },
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.bdr },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between' },
  route: { fontSize: 14, fontWeight: '700', color: C.text },
  fare: { fontSize: 10, color: C.sub, marginTop: 2 },
  ppValue: { fontSize: 18, fontWeight: '700', color: C.pri },
  ppLabel: { fontSize: 10, fontWeight: '400', color: C.sub },
  subInfo: { fontSize: 10, color: C.sub, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  calcAction: { flex: 1, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: C.pri, alignItems: 'center' },
  calcActionText: { fontSize: 11, fontWeight: '600', color: C.pri },
  deleteAction: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, borderColor: C.danger },
  deleteActionText: { fontSize: 11, fontWeight: '600', color: C.danger },
});
