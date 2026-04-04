import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { useSettings } from '../utils/SettingsContext';
import { buildAirportSelectorOptions } from '../utils/ppCalc';
import { AIRPORTS, NEW_DOMESTIC_FARES } from '../data/masterData';
import { exportAllCSV } from '../utils/csvExport';
import { HistoryItem, BookmarkItem } from '../utils/types';

const airportOptions = buildAirportSelectorOptions();

const fareOptions = (() => {
  const data: any[] = [];
  data.push({ key: 'sec-first', section: true, label: '── ファーストクラス ──' });
  NEW_DOMESTIC_FARES.filter(f => f.cls === 'first').forEach(f =>
    data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` })
  );
  data.push({ key: 'sec-eco', section: true, label: '── エコノミークラス ──' });
  NEW_DOMESTIC_FARES.filter(f => f.cls === 'economy').forEach(f =>
    data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` })
  );
  return data;
})();

export default function SettingsTab({ history, bookmarks }: { history: HistoryItem[]; bookmarks: BookmarkItem[] }) {
  const { settings, updateSettings, C } = useSettings();

  const homeAP = AIRPORTS.find(a => a.code === settings.homeAirport);
  const defaultFareObj = NEW_DOMESTIC_FARES.find(f => f.id === settings.defaultFare);

  const pickerProps = {
    style: { borderWidth: 0 },
    selectStyle: { borderWidth: 0, padding: 0 },
    selectTextStyle: { display: 'none' as const },
    sectionTextStyle: { fontSize: 13, fontWeight: '700' as const, color: C.pri, paddingVertical: 8, paddingLeft: 16, textAlign: 'left' as const },
    optionTextStyle: { fontSize: 15, color: C.text, textAlign: 'left' as const, paddingLeft: 16 },
    cancelText: 'キャンセル',
    overlayStyle: { backgroundColor: 'rgba(0,0,0,0.5)' },
    optionContainerStyle: { borderRadius: 16, backgroundColor: C.white, maxHeight: '70%' as any },
  };

  return (
    <View style={[s.container, { backgroundColor: C.bg }]}>
      <Text style={[s.sectionTitle, { color: C.sub }]}>表示設定</Text>
      <View style={[s.card, { backgroundColor: C.card }]}>

        {/* Dark mode */}
        <View style={[s.row, { borderBottomColor: C.bdr }]}>
          <View style={s.rowLeft}>
            <Text style={s.rowIcon}>🌙</Text>
            <View>
              <Text style={[s.rowLabel, { color: C.text }]}>ダークモード</Text>
              <Text style={[s.rowSub, { color: C.sub }]}>画面を暗いテーマに切り替えます</Text>
            </View>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={(v) => updateSettings({ darkMode: v })}
            trackColor={{ false: C.bdr, true: C.pri }}
            thumbColor={C.white}
          />
        </View>

        {/* Home airport */}
        <ModalSelector
          {...pickerProps}
          data={airportOptions}
          onChange={(o) => updateSettings({ homeAirport: o.key })}
        >
          <View style={[s.row, { borderBottomColor: C.bdr }]}>
            <View style={s.rowLeft}>
              <Text style={s.rowIcon}>🏠</Text>
              <View>
                <Text style={[s.rowLabel, { color: C.text }]}>ホーム空港</Text>
                <Text style={[s.rowSub, { color: C.sub }]}>PP計算の出発地デフォルト</Text>
              </View>
            </View>
            <View style={[s.badge, { backgroundColor: C.sky, borderColor: C.bdr }]}>
              <Text style={[s.badgeText, { color: C.pri }]}>
                {homeAP ? `${homeAP.name}（${homeAP.code}）` : settings.homeAirport}
              </Text>
              <Text style={[s.chevron, { color: C.sub }]}>›</Text>
            </View>
          </View>
        </ModalSelector>

        {/* Default fare */}
        <ModalSelector
          {...pickerProps}
          data={fareOptions}
          onChange={(o) => updateSettings({ defaultFare: o.key })}
        >
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <View style={s.rowLeft}>
              <Text style={s.rowIcon}>💳</Text>
              <View>
                <Text style={[s.rowLabel, { color: C.text }]}>デフォルト運賃</Text>
                <Text style={[s.rowSub, { color: C.sub }]}>PP計算の運賃デフォルト（国内新運賃）</Text>
              </View>
            </View>
            <View style={[s.badge, { backgroundColor: C.sky, borderColor: C.bdr }]}>
              <Text style={[s.badgeText, { color: C.pri }]}>
                {defaultFareObj
                  ? `${defaultFareObj.cls === 'first' ? 'ファースト' : 'エコノミー'} ${defaultFareObj.name.replace('エコノミー ', '').replace('ファースト ', '')}`
                  : settings.defaultFare}
              </Text>
              <Text style={[s.chevron, { color: C.sub }]}>›</Text>
            </View>
          </View>
        </ModalSelector>

      </View>

      {/* データ管理 */}
      <Text style={[s.sectionTitle, { color: C.sub }]}>データ管理</Text>
      <View style={[s.card, { backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => exportAllCSV(history, bookmarks)} style={[s.row, { borderBottomWidth: 0 }]}>
          <View style={s.rowLeft}>
            <Text style={s.rowIcon}>📦</Text>
            <View>
              <Text style={[s.rowLabel, { color: C.text }]}>まとめてエクスポート</Text>
              <Text style={[s.rowSub, { color: C.sub }]}>搭乗履歴とお気に入りをCSVで出力</Text>
            </View>
          </View>
          <Text style={[s.chevron, { color: C.sub }]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: { fontSize: 20 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 11, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  chevron: { fontSize: 18, fontWeight: '300' },
});
