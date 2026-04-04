import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useSettings } from '../utils/SettingsContext';

export default function SettingsTab() {
  const { settings, updateSettings, C } = useSettings();

  return (
    <View style={[s.container, { backgroundColor: C.bg }]}>
      <Text style={[s.sectionTitle, { color: C.sub }]}>表示設定</Text>
      <View style={[s.card, { backgroundColor: C.card }]}>
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
});
