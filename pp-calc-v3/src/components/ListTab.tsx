import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AIRPORTS, NEW_DOMESTIC_FARES, INTL_FARES } from '../data/masterData';
import { getBaseMileage, isDomestic, getRouteMultiplier, calcPP } from '../utils/ppCalc';
import { BookmarkItem } from '../utils/types';
import { useSettings } from '../utils/SettingsContext';

interface Props {
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  isBookmarked: (dep: string, arr: string, fareId: string) => boolean;
}

type SortKey = 'route' | 'fare' | 'ppRound' | 'trips';
type SortDir = 'asc' | 'desc';

export default function ListTab({ bookmarks, toggleBookmark, isBookmarked }: Props) {
  const { C } = useSettings();
  const [filter, setFilter] = useState<"all" | "domestic" | "intl">("all");
  const [sortKey, setSortKey] = useState<SortKey>('ppRound');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'route' || key === 'fare' ? 'asc' : 'desc');
    }
  };

  const ranking = useMemo(() => {
    const res: any[] = [];
    ["HND", "ITM", "CTS", "NGO", "FUK"].forEach(d => {
      ["OKA", "ISG", "MMY", "CTS", "FUK", "SIN", "KUL", "BKK", "SYD", "HNL", "HAN", "SGN", "GMP", "ICN", "HKG", "TPE"].forEach(a => {
        if (d === a) return;
        const bm = getBaseMileage(d, a);
        if (!bm) return;
        const dom = isDomestic(d, a);
        const mult = getRouteMultiplier(d, a);
        const faresToCalc = dom
          ? NEW_DOMESTIC_FARES.filter(f => ["new-e-flex", "new-e-std", "new-e-sim"].includes(f.id))
          : INTL_FARES.filter(f => ["C/D", "E", "Y/B/M", "V/W/S/T"].includes(f.id));
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
    return res;
  }, []);

  const sorted = useMemo(() => {
    const base = filter === "all" ? ranking : filter === "domestic" ? ranking.filter(r => r.domestic) : ranking.filter(r => !r.domestic);
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'route' || sortKey === 'fare') {
        cmp = a[sortKey].localeCompare(b[sortKey], 'ja');
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [ranking, filter, sortKey, sortDir]);

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 14 }}>
      <View style={s.filterRow}>
        {([["all", "すべて"], ["domestic", "国内線"], ["intl", "国際線"]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} onPress={() => setFilter(k)}
            style={[s.filterBtn, { backgroundColor: filter === k ? C.pri : C.white }]}>
            <Text style={[s.filterText, { color: filter === k ? C.white : C.sub }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[s.note, { color: C.sub }]}>※新運賃（2026/5/19〜）で計算　タップでソート</Text>

      <View style={[s.card, { backgroundColor: C.card }]}>
        <View style={[s.headerRow, { backgroundColor: C.pri }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => handleSort('route')}>
            <Text style={[s.headerCell, { color: C.accLt }]}>路線{arrow('route')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: 72 }} onPress={() => handleSort('fare')}>
            <Text style={[s.headerCell, { color: C.accLt }]}>運賃{arrow('fare')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: 65 }} onPress={() => handleSort('ppRound')}>
            <Text style={[s.headerCell, { color: C.accLt }]}>往復PP{arrow('ppRound')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: 46 }} onPress={() => handleSort('trips')}>
            <Text style={[s.headerCell, { color: C.accLt }]}>回数{arrow('trips')}</Text>
          </TouchableOpacity>
          <View style={{ width: 30 }} />
        </View>
        <ScrollView style={{ maxHeight: 500 }}>
          {sorted.slice(0, 60).map((r, i) => (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 0 ? C.white : C.bg, borderBottomColor: C.bdr }]}>
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
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 11, fontWeight: '600' },
  note: { fontSize: 9, textAlign: 'right', marginBottom: 8 },
  card: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12 },
  headerCell: { fontSize: 9, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  cell: { fontSize: 11 },
});
