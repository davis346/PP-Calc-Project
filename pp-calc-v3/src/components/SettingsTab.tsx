import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { useSettings } from '../utils/SettingsContext';
import { getDomesticAirports, getInternationalRegions, getAirportsByRegion } from '../utils/ppCalc';
import { AIRPORTS } from '../data/masterData';

function buildAirportOptions() {
  const data: any[] = [];
  const domAirports = getDomesticAirports();
  const intlRegions = getInternationalRegions();
  data.push({ key: 'sec-dom', section: true, label: '── 国内 ──' });
  domAirports.forEach(a => data.push({ key: a.code, label: `${a.name}（${a.code}）` }));
  intlRegions.forEach(r => {
    data.push({ key: `sec-${r}`, section: true, label: `── ${r} ──` });
    getAirportsByRegion(r).forEach(a => data.push({ key: a.code, label: `${a.name}（${a.code}）` }));
  });
  return data;
}

const airportOptions = buildAirportOptions();

export default function SettingsTab() {
  const { settings, updateSettings, C } = useSettings();
  const homeAP = AIRPORTS.find(a => a.code === settings.homeAirport);

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
          data={airportOptions}
          onChange={(o) => updateSettings({ homeAirport: o.key })}
          style={{ borderWidth: 0 }}
          selectStyle={{ borderWidth: 0, padding: 0 }}
          selectTextStyle={{ display: 'none' }}
          sectionTextStyle={{ fontSize: 13, fontWeight: '700', color: C.pri, paddingVertical: 8, paddingLeft: 16, textAlign: 'left' }}
          optionTextStyle={{ fontSize: 15, color: C.text, textAlign: 'left', paddingLeft: 16 }}
          cancelText="キャンセル"
          overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          optionContainerStyle={{ borderRadius: 16, backgroundColor: C.white, maxHeight: '70%' }}
        >
          <View style={[s.row, { borderBottomWidth: 0 }]}>
            <View style={s.rowLeft}>
              <Text style={s.rowIcon}>🏠</Text>
              <View>
                <Text style={[s.rowLabel, { color: C.text }]}>ホーム空港</Text>
                <Text style={[s.rowSub, { color: C.sub }]}>PP計算の出発地デフォルト</Text>
              </View>
            </View>
            <View style={[s.airportBadge, { backgroundColor: C.sky, borderColor: C.bdr }]}>
              <Text style={[s.airportBadgeText, { color: C.pri }]}>
                {homeAP ? `${homeAP.name}（${homeAP.code}）` : settings.homeAirport}
              </Text>
              <Text style={[s.airportChevron, { color: C.sub }]}>›</Text>
            </View>
          </View>
        </ModalSelector>
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
  airportBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  airportBadgeText: { fontSize: 13, fontWeight: '600' },
  airportChevron: { fontSize: 18, fontWeight: '300' },
});
