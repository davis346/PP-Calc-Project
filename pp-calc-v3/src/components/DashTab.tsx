import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../utils/colors';
import { HistoryItem } from '../utils/types';

interface Props {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
}

export default function DashTab({ history, setHistory }: Props) {
  const totalPP = history.reduce((s, h) => s + h.pp, 0);
  const totalCost = history.reduce((s, h) => s + h.price, 0);
  const prog = Math.min((totalPP / 50000) * 100, 100);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Progress Card */}
      <View style={s.card}>
        <Text style={s.progressLabel}>SFC達成度</Text>
        <View style={s.progressValueRow}>
          <Text style={s.progressValue}>{Math.round(prog)}</Text>
          <Text style={s.progressPercent}>%</Text>
        </View>

        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${prog}%` }]} />
          <View style={s.bronzeLine} />
        </View>
        <View style={s.barLabels}>
          <Text style={s.barLabelText}>0</Text>
          <Text style={[s.barLabelText, { color: C.acc, fontWeight: '600' }]}>ブロンズ 30,000</Text>
          <Text style={s.barLabelText}>50,000PP</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        {[
          { l: "残りPP", v: Math.max(0, 50000 - totalPP).toLocaleString(), u: "PP", i: "🎯" },
          { l: "搭乗回数", v: String(history.length), u: "回", i: "✈️" },
          { l: "累計費用", v: totalCost > 0 ? `¥${totalCost.toLocaleString()}` : "—", u: "", i: "💰" },
          { l: "平均PP単価", v: totalPP > 0 && totalCost > 0 ? (totalCost / totalPP).toFixed(1) : "—", u: totalPP > 0 && totalCost > 0 ? "円" : "", i: "📊" },
        ].map((stat, i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statLabel}>{stat.i} {stat.l}</Text>
            <Text style={s.statValue}>{stat.v}<Text style={s.statUnit}>{stat.u}</Text></Text>
          </View>
        ))}
      </View>

      {/* History */}
      <View style={s.historyCard}>
        <View style={s.historyHeader}>
          <Text style={s.historyTitle}>搭乗履歴</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => setHistory([])}>
              <Text style={s.deleteAll}>すべて削除</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={s.emptyHistory}>
            <Text style={s.emptyText}>PP計算後に「搭乗履歴に追加」で記録できます</Text>
          </View>
        ) : (
          history.map((h, i) => (
            <View key={h.id} style={[s.historyItem, { backgroundColor: i % 2 === 0 ? C.white : C.bg }]}>
              <View>
                <Text style={s.histRoute}>{h.route}</Text>
                <Text style={s.histSub}>{h.date} {h.price > 0 ? `¥${h.price.toLocaleString()}` : ""}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.histPP}>+{h.pp.toLocaleString()}</Text>
                {h.ppUnit > 0 && <Text style={s.histUnit}>単価{h.ppUnit.toFixed(1)}円</Text>}
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
  card: { backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, alignItems: 'center' },
  progressLabel: { fontSize: 10, color: C.sub, letterSpacing: 1, marginBottom: 4 },
  progressValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  progressValue: { fontSize: 46, fontWeight: '900', color: C.pri },
  progressPercent: { fontSize: 18, fontWeight: '500', color: C.pri },
  barBg: { width: '100%', height: 16, backgroundColor: C.bg, borderRadius: 10, overflow: 'hidden', marginTop: 14, position: 'relative' },
  barFill: { height: '100%', borderRadius: 10, backgroundColor: C.acc },
  bronzeLine: { position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, backgroundColor: `${C.acc}60` },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 },
  barLabelText: { fontSize: 9, color: C.sub },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '48%', backgroundColor: C.card, borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  statLabel: { fontSize: 9, color: C.sub, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: C.pri },
  statUnit: { fontSize: 10, fontWeight: '400', color: C.sub },
  historyCard: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.bdr },
  historyTitle: { fontSize: 12, fontWeight: '700', color: C.text },
  deleteAll: { fontSize: 10, color: C.danger },
  emptyHistory: { padding: 28, alignItems: 'center' },
  emptyText: { fontSize: 12, color: C.sub, textAlign: 'center' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: C.bdr },
  histRoute: { fontSize: 12, fontWeight: '600', color: C.text },
  histSub: { fontSize: 9, color: C.sub, marginTop: 2 },
  histPP: { fontSize: 15, fontWeight: '700', color: C.pri },
  histUnit: { fontSize: 9, color: C.sub },
});
