import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../utils/colors';
import { AIRPORTS, NEW_DOMESTIC_FARES, INTL_FARES } from '../data/masterData';
import { getBaseMileage, isDomestic, getRouteMultiplier, calcPP } from '../utils/ppCalc';
import { BookmarkItem } from '../utils/types';

interface Props {
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  isBookmarked: (dep: string, arr: string, fareId: string) => boolean;
}

export default function ListTab({ bookmarks, toggleBookmark, isBookmarked }: Props) {
  const [filter, setFilter] = useState<"all" | "domestic" | "intl">("all");

  const ranking = useMemo(() => {
    const res: any[] = [];
    ["HND","ITM","CTS","NGO","FUK"].forEach(d => {
      ["OKA","ISG","MMY","CTS","FUK","SIN","KUL","BKK","SYD","HNL","HAN","SGN","GMP","ICN","HKG","TPE"].forEach(a => {
        if (d === a) return;
        const bm = getBaseMileage(d, a);
        if (!bm) return;
        const dom = isDomestic(d, a);
        const mult = getRouteMultiplier(d, a);
        const faresToCalc = dom
          ? NEW_DOMESTIC_FARES.filter(f => ["new-e-flex","new-e-std","new-e-sim"].includes(f.id))
          : INTL_FARES.filter(f => ["C/D","E","Y/B/M","V/W/S/T"].includes(f.id));
        faresToCalc.forEach(fare => {
          const { pp } = calcPP(bm, fare.rate, mult, fare.boarding);
          const dn = AIRPORTS.find(x => x.code === d)?.name;
          const an = AIRPORTS.find(x => x.code === a)?.name;
          res.push({
            route: `${dn}→${an}`, dep: d, arr: a, fare: fare.name,
            fareShort: dom ? fare.name.replace("エコノミー ", "") : fare.id,
            fareId: fare.id, pp, ppRound: pp * 2,
            trips: Math.ceil(50000 / (pp * 2)), domestic: dom,
          });
        });
      });
    });
    return res.sort((a, b) => b.ppRound - a.ppRound);
  }, []);

  const filtered = filter === "all" ? ranking : filter === "domestic" ? ranking.filter(r => r.domestic) : ranking.filter(r => !r.domestic);

  return (
    <View style={s.container}>
      <View style={s.filterRow}>
        {([["all","すべて"],["domestic","国内線"],["intl","国際線"]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)} style={[s.filterBtn, filter === k && s.filterActive]}>
            <Text style={[s.filterText, filter === k && s.filterTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.note}>※新運賃（2026/5/19〜）で計算</Text>

      <View style={s.card}>
        <View style={s.headerRow}>
          <Text style={[s.headerCell, { flex: 1 }]}>路線</Text>
          <Text style={[s.headerCell, { width: 72 }]}>運賃</Text>
          <Text style={[s.headerCell, { width: 65 }]}>往復PP</Text>
          <Text style={[s.headerCell, { width: 46 }]}>回数</Text>
          <Text style={[s.headerCell, { width: 30 }]}></Text>
        </View>
        <ScrollView style={{ maxHeight: 500 }}>
          {filtered.slice(0, 60).map((r, i) => (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 0 ? C.white : C.bg }]}>
              <Text style={[s.cell, { flex: 1, fontWeight: '500', color: C.text }]}>{r.route}</Text>
              <Text style={[s.cell, { width: 72, fontSize: 9, color: C.sub }]}>{r.fareShort}</Text>
              <Text style={[s.cell, { width: 65, fontWeight: '700', color: C.pri }]}>{r.ppRound.toLocaleString()}</Text>
              <Text style={[s.cell, { width: 46, fontSize: 10, fontWeight: '600', color: r.trips <= 10 ? C.success : r.trips <= 20 ? C.sub : C.danger }]}>{r.trips}往復</Text>
              <TouchableOpacity onPress={() => toggleBookmark(r)} style={{ width: 30, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: isBookmarked(r.dep, r.arr, r.fareId) ? C.bkm : C.bdr }}>
                  {isBookmarked(r.dep, r.arr, r.fareId) ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 14 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: C.white },
  filterActive: { backgroundColor: C.pri },
  filterText: { fontSize: 11, fontWeight: '600', color: C.sub },
  filterTextActive: { color: C.white },
  note: { fontSize: 9, color: C.sub, textAlign: 'right', marginBottom: 8 },
  card: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, backgroundColor: C.pri },
  headerCell: { fontSize: 9, fontWeight: '600', color: C.accLt },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.bdr },
  cell: { fontSize: 11 },
});
