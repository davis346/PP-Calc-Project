import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HistoryItem } from '../utils/types';
import { useSettings } from '../utils/SettingsContext';
import { exportHistoryCSV } from '../utils/csvExport';

interface Props {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
}

export default function DashTab({ history, setHistory }: Props) {
  const { C } = useSettings();
  const totalPP = history.reduce((s, h) => s + h.pp, 0);
  const totalCost = history.reduce((s, h) => s + h.price, 0);
  const prog = Math.min((totalPP / 50000) * 100, 100);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg, padding: 14 }} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Progress Card */}
      <View style={[s.card, { backgroundColor: C.card, alignItems: 'center' }]}>
        <Text style={[s.progressLabel, { color: C.sub }]}>SFC達成度</Text>
        <View style={s.progressValueRow}>
          <Text style={[s.progressValue, { color: C.pri }]}>{Math.round(prog)}</Text>
          <Text style={[s.progressPercent, { color: C.pri }]}>%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: C.bg, width: '100%' }]}>
          <View style={[s.barFill, { backgroundColor: C.acc, width: `${prog}%` as any }]} />
          <View style={[s.bronzeLine, { backgroundColor: `${C.acc}60` }]} />
        </View>
        <View style={[s.barLabels, { width: '100%' }]}>
          <Text style={[s.barLabelText, { color: C.sub }]}>0</Text>
          <Text style={[s.barLabelText, { color: C.acc, fontWeight: '600' }]}>ブロンズ 30,000</Text>
          <Text style={[s.barLabelText, { color: C.sub }]}>50,000PP</Text>
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
          <View key={i} style={[s.statCard, { backgroundColor: C.card }]}>
            <Text style={[s.statLabel, { color: C.sub }]}>{stat.i} {stat.l}</Text>
            <Text style={[s.statValue, { color: C.pri }]}>{stat.v}<Text style={[s.statUnit, { color: C.sub }]}>{stat.u}</Text></Text>
          </View>
        ))}
      </View>

      {/* History */}
      <View style={[s.historyCard, { backgroundColor: C.card }]}>
        <View style={[s.historyHeader, { borderBottomColor: C.bdr }]}>
          <Text style={[s.historyTitle, { color: C.text }]}>搭乗履歴</Text>
          <View style={s.headerRight}>
            <Text style={[s.headerCount, { color: C.sub }]}>{history.length}件</Text>
            {history.length > 0 && (
              <>
                <TouchableOpacity onPress={() => exportHistoryCSV(history)} style={[s.exportBtn, { borderColor: C.pri }]}>
                  <Text style={[s.exportBtnText, { color: C.pri }]}>CSVで出力</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHistory([])} style={[s.clearBtn, { borderColor: C.danger }]}>
                  <Text style={[s.clearBtnText, { color: C.danger }]}>全削除</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {history.length === 0 ? (
          <View style={s.emptyHistory}>
            <Text style={[s.emptyText, { color: C.sub }]}>PP計算後に「搭乗履歴に追加」で記録できます</Text>
          </View>
        ) : (
          history.map((h, i) => (
            <View key={h.id} style={[s.historyItem, { backgroundColor: i % 2 === 0 ? C.white : C.bg, borderBottomColor: C.bdr }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.histRoute, { color: C.text }]}>{h.route}</Text>
                <Text style={[s.histSub, { color: C.sub }]}>{h.date} {h.price > 0 ? `¥${h.price.toLocaleString()}` : ""}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 8 }}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.histPP, { color: C.pri }]}>+{h.pp.toLocaleString()}</Text>
                  {h.ppUnit > 0 && <Text style={[s.histUnit, { color: C.sub }]}>単価{h.ppUnit.toFixed(1)}円</Text>}
                </View>
                <TouchableOpacity
                  onPress={() => setHistory(history.filter(x => x.id !== h.id))}
                  style={[s.deleteAction, { borderColor: C.danger }]}
                >
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
  card: { borderRadius: 14, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  progressLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 4 },
  progressValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  progressValue: { fontSize: 46, fontWeight: '900' },
  progressPercent: { fontSize: 18, fontWeight: '500' },
  barBg: { height: 16, borderRadius: 10, overflow: 'hidden', marginTop: 14, position: 'relative' },
  barFill: { height: '100%', borderRadius: 10 },
  bronzeLine: { position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  barLabelText: { fontSize: 9 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '48%', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  statLabel: { fontSize: 9, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statUnit: { fontSize: 10, fontWeight: '400' },
  historyCard: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  historyTitle: { fontSize: 13, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCount: { fontSize: 11 },
  clearBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  clearBtnText: { fontSize: 11, fontWeight: '600' },
  exportBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  exportBtnText: { fontSize: 11, fontWeight: '600' },
  emptyHistory: { padding: 28, alignItems: 'center' },
  emptyText: { fontSize: 12, textAlign: 'center' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  histRoute: { fontSize: 12, fontWeight: '600' },
  histSub: { fontSize: 9, marginTop: 2 },
  histPP: { fontSize: 15, fontWeight: '700' },
  histUnit: { fontSize: 9 },
  deleteAction: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 6, borderWidth: 1 },
  deleteActionText: { fontSize: 11, fontWeight: '600' },
});
