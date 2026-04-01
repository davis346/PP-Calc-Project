import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Keyboard, Platform, InputAccessoryView } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { C } from '../utils/colors';
import { AIRPORTS, OLD_DOMESTIC_FARES, NEW_DOMESTIC_FARES, INTL_FARES, FARE_HELP, Fare } from '../data/masterData';
import { getBaseMileage, isDomestic, getRouteMultiplier, calcPP, getAirportName, getDomesticAirports, getInternationalRegions, getAirportsByRegion } from '../utils/ppCalc';
import { CalcResult, BookmarkItem, HistoryItem } from '../utils/types';

interface Props {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  isBookmarked: (dep: string, arr: string, fareId: string) => boolean;
}

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

function buildFareOptions(fares: Fare[], domestic: boolean, fareMode: string) {
  const data: any[] = [];
  if (domestic && fareMode === "new") {
    data.push({ key: 'sec-first', section: true, label: '── ファーストクラス ──' });
    fares.filter(f => f.cls === "first").forEach(f =>
      data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` }));
    data.push({ key: 'sec-eco', section: true, label: '── エコノミークラス ──' });
    fares.filter(f => f.cls === "economy").forEach(f =>
      data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` }));
  } else if (domestic && fareMode === "old") {
    data.push({ key: 'sec-prem', section: true, label: '── プレミアムクラス ──' });
    fares.filter(f => f.cls === "premium").forEach(f =>
      data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` }));
    data.push({ key: 'sec-eco', section: true, label: '── 普通席 ──' });
    fares.filter(f => f.cls === "economy").forEach(f =>
      data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}% / +${f.boarding}PP）` }));
  } else {
    fares.forEach(f =>
      data.push({ key: f.id, label: `${f.name}（${Math.round(f.rate * 100)}%）` }));
  }
  return data;
}

const airportOptions = buildAirportOptions();

const INPUT_ACCESSORY_ID = 'priceInput';

function AdBanner() {
  return (
    <View style={s.adBanner}>
      <Text style={s.adText}>広告</Text>
    </View>
  );
}

export default function CalcTab({ history, setHistory, bookmarks, toggleBookmark, isBookmarked }: Props) {
  const [dep, setDep] = useState("HND");
  const [arr, setArr] = useState("OKA");
  const [fareMode, setFareMode] = useState<"old" | "new">("new");
  const [fareId, setFareId] = useState("new-e-std");
  const [price, setPrice] = useState("");
  const [isRound, setIsRound] = useState(true);
  const [result, setResult] = useState<CalcResult | null>(null);

  const domestic = isDomestic(dep, arr);
  const fares: Fare[] = domestic ? (fareMode === "old" ? OLD_DOMESTIC_FARES : NEW_DOMESTIC_FARES) : INTL_FARES;
  const fareOptions = buildFareOptions(fares, domestic, fareMode);

  useEffect(() => {
    if (domestic) setFareId(fareMode === "old" ? "old-6" : "new-e-std");
    else setFareId("Y/B/M");
    setResult(null);
  }, [domestic, fareMode]);

  const swap = () => { const t = dep; setDep(arr); setArr(t); setResult(null); };

  const doCalc = useCallback(() => {
    const bm = getBaseMileage(dep, arr);
    if (!bm) { Alert.alert("エラー", "この路線のデータがありません"); return; }
    const fare = fares.find(f => f.id === fareId);
    if (!fare) return;
    const mult = getRouteMultiplier(dep, arr);
    const { flightMile, pp } = calcPP(bm, fare.rate, mult, fare.boarding);
    const totalPP = isRound ? pp * 2 : pp;
    const numPrice = Number(price.replace(/[^0-9]/g, ""));
    const ppUnit = numPrice > 0 ? Math.round((numPrice / totalPP) * 100) / 100 : null;    const trips = Math.ceil(50000 / (pp * 2));
    setResult({ bm, fare, mult, flightMile, pp, totalPP, ppUnit, trips, isRound });
  }, [dep, arr, fareId, price, isRound, fares]);

  const addHistory = () => {
    if (!result) return;
    const route = `${getAirportName(dep)}→${getAirportName(arr)}`;
    setHistory([...history, {
      id: Date.now(), date: new Date().toLocaleDateString("ja-JP"),
      route, pp: result.totalPP, price: price ? Number(price) : 0, ppUnit: result.ppUnit || 0,
    }]);
    Alert.alert("追加しました", `${route} (${result.totalPP.toLocaleString()}PP) を搭乗履歴に追加しました`);
  };

  const curBookmarked = result ? isBookmarked(dep, arr, fareId) : false;
  const depAP = AIRPORTS.find(a => a.code === dep);
  const arrAP = AIRPORTS.find(a => a.code === arr);
  const fareObj = fares.find(f => f.id === fareId);
  const helpTexts = FARE_HELP[fareId];

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {domestic && (
          <View style={s.card}>
            <View style={s.toggleRow}>
              {(["old", "new"] as const).map(k => (
                <TouchableOpacity key={k} onPress={() => setFareMode(k)}
                  style={[s.toggleBtn, fareMode === k && s.toggleActive]}>
                  <Text style={[s.toggleText, fareMode === k && s.toggleTextActive]}>
                    {k === "old" ? "旧運賃（〜5/18）" : "新運賃（5/19〜）"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.modeDesc}>
              {fareMode === "old" ? "2026年5月18日搭乗分まで適用" : "2026年5月19日搭乗分から適用"}
            </Text>
          </View>
        )}

        <View style={s.card}>
          <View style={s.airportRow}>
            <View style={s.airportCol}>
              <Text style={s.label}>🛫 出発地</Text>
              <ModalSelector
                data={airportOptions}
                onChange={(o) => { setDep(o.key); setResult(null); }}
                style={{ borderWidth: 0 }}
                selectStyle={{ borderWidth: 0, padding: 0 }}
                selectTextStyle={{ display: 'none' }}
                sectionTextStyle={s.sectionText}
                optionTextStyle={s.optionText}
                cancelText="キャンセル"
                overlayStyle={s.overlay}
                optionContainerStyle={s.optionContainer}
              >
                <View style={s.singleBorder}>
                  <Text style={s.selectorText}>{depAP ? `${depAP.name}（${depAP.code}）` : dep}</Text>
                </View>
              </ModalSelector>
            </View>

            <TouchableOpacity onPress={swap} style={s.swapBtn}>
              <Text style={s.swapText}>⇄</Text>
            </TouchableOpacity>

            <View style={s.airportCol}>
              <Text style={s.label}>🛬 到着地</Text>
              <ModalSelector
                data={airportOptions}
                onChange={(o) => { setArr(o.key); setResult(null); }}
                style={{ borderWidth: 0 }}
                selectStyle={{ borderWidth: 0, padding: 0 }}
                selectTextStyle={{ display: 'none' }}
                sectionTextStyle={s.sectionText}
                optionTextStyle={s.optionText}
                cancelText="キャンセル"
                overlayStyle={s.overlay}
                optionContainerStyle={s.optionContainer}
              >
                <View style={s.singleBorder}>
                  <Text style={s.selectorText}>{arrAP ? `${arrAP.name}（${arrAP.code}）` : arr}</Text>
                </View>
              </ModalSelector>
            </View>
          </View>

          <Text style={s.label}>{domestic ? "💳 運賃種別" : "💳 予約クラス"}</Text>
          <ModalSelector
            data={fareOptions}
            onChange={(o) => { setFareId(o.key); setResult(null); }}
            style={{ borderWidth: 0 }}
            selectStyle={{ borderWidth: 0, padding: 0 }}
            selectTextStyle={{ display: 'none' }}
            sectionTextStyle={s.sectionText}
            optionTextStyle={s.optionText}
            cancelText="キャンセル"
            overlayStyle={s.overlay}
            optionContainerStyle={s.optionContainer}
          >
            <View style={s.singleBorder}>
              <Text style={s.selectorText}>{fareObj ? `${fareObj.name}（${Math.round(fareObj.rate * 100)}%）` : fareId}</Text>
            </View>
          </ModalSelector>

          {helpTexts && (
            <View style={s.helpBox}>
              <Text style={s.helpTitle}>{domestic ? "💡 この区分に含まれる運賃：" : "💡 この予約クラスの詳細："}</Text>
              <Text style={s.helpText}>{helpTexts.join("、")}</Text>
            </View>
          )}

          <View style={[s.toggleRow, { marginTop: 12 }]}>
            {["往復", "片道"].map(l => (
              <TouchableOpacity key={l} onPress={() => { setIsRound(l === "往復"); setResult(null); }}
                style={[s.toggleBtn, (l === "往復" ? isRound : !isRound) && s.toggleActive]}>
                <Text style={[s.toggleText, (l === "往復" ? isRound : !isRound) && s.toggleTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 14 }]}>💰 航空券価格（{isRound ? "往復" : "片道"}合計・任意）</Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={price}
              onChangeText={t => { setPrice(t); setResult(null); }}
              placeholder="例: 25300"
              keyboardType="numeric"
              placeholderTextColor="#A0AAB4"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
            />
            <Text style={s.inputSuffix}>円</Text>
          </View>

          <TouchableOpacity onPress={doCalc} style={s.calcBtn} activeOpacity={0.8}>
            <Text style={s.calcBtnText}>PP を計算する</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <>
            <View style={s.resultCard}>
              <View style={s.resultHeader}>
                <Text style={s.resultLabel}>
                  獲得プレミアムポイント（{result.isRound ? "往復" : "片道"}）
                  {domestic && ` [${fareMode === "old" ? "旧運賃" : "新運賃"}]`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                  <Text style={s.resultPP}>{result.totalPP.toLocaleString()}</Text>
                  <Text style={s.resultPPUnit}> PP</Text>
                </View>
                {result.ppUnit !== null && (
                  <View style={[s.ppUnitBadge, {
                    backgroundColor: result.ppUnit <= 10 ? "rgba(39,174,96,0.3)" : result.ppUnit <= 15 ? "rgba(241,196,15,0.3)" : "rgba(214,48,49,0.3)"
                  }]}>
                    <Text style={[s.ppUnitText, {
                      color: result.ppUnit <= 10 ? "#81C784" : result.ppUnit <= 15 ? "#F1C40F" : "#EF9A9A"
                    }]}>
                      PP単価 {result.ppUnit.toFixed(1)}円 {result.ppUnit <= 10 ? "🎉 優秀！" : result.ppUnit <= 15 ? "👍 まずまず" : "⚠️ やや高め"}
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => {
                  const route = `${getAirportName(dep)}→${getAirportName(arr)}`;
                  toggleBookmark({ dep, arr, fareId, route, fare: result.fare.name, pp: result.pp, ppRound: result.pp * 2, trips: result.trips, ppUnit: result.ppUnit });
                }} style={[s.bookmarkBtn, curBookmarked && { backgroundColor: C.bkm }]}>
                  <Text style={s.bookmarkText}>{curBookmarked ? "★ ブックマーク済み" : "☆ ブックマークに追加"}</Text>
                </TouchableOpacity>
              </View>
              <View style={s.detailSection}>
                {[
                  ["区間基本マイル", `${result.bm.toLocaleString()} マイル`],
                  ["積算率", `${Math.round(result.fare.rate * 100)}%（${result.fare.name}）`],
                  ["フライトマイル", `${result.flightMile.toLocaleString()}`],
                  ["路線倍率", `×${result.mult}（${result.mult === 2 ? "国内線" : result.mult === 1.5 ? "アジア・オセアニア" : "その他"}）`],
                  ["搭乗ポイント", `+${result.fare.boarding} PP`],
                  ["片道PP", `${result.pp.toLocaleString()} PP`],
                ].map(([label, value], i) => (
                  <View key={i} style={[s.detailRow, i < 5 && { borderBottomWidth: 1, borderBottomColor: C.bdr }]}>
                    <Text style={s.detailLabel}>{label}</Text>
                    <Text style={s.detailValue}>{value}</Text>
                  </View>
                ))}
              </View>
              <View style={s.tripsRow}>
                <Text style={s.tripsText}>🎯 この路線の往復で <Text style={{ fontWeight: '700' }}>{result.trips}往復</Text> で50,000PP達成</Text>
              </View>
              <TouchableOpacity onPress={addHistory} style={s.addHistoryBtn} activeOpacity={0.8}>
                <Text style={s.addHistoryText}>＋ 搭乗履歴に追加する</Text>
              </TouchableOpacity>
            </View>
            <AdBanner />
          </>
        )}
      </ScrollView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={s.accessoryBar}>
            <TouchableOpacity onPress={() => Keyboard.dismiss()} style={s.accessoryBtn}>
              <Text style={s.accessoryText}>完了</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 14 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 12, fontWeight: '600', color: C.sub, marginBottom: 5 },
  airportRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  airportCol: { flex: 1 },
  singleBorder: { borderWidth: 1.5, borderColor: C.bdr, borderRadius: 10, backgroundColor: C.white, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 4 },
  selectorText: { fontSize: 14, color: C.text },
  sectionText: { fontSize: 13, fontWeight: '700', color: C.pri, paddingVertical: 8, paddingLeft: 16, textAlign: 'left' },
  optionText: { fontSize: 15, color: C.text, textAlign: 'left', paddingLeft: 16 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
  optionContainer: { borderRadius: 16, backgroundColor: C.white, maxHeight: '70%' },
  swapBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.bdr, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, marginBottom: 8 },
  swapText: { color: C.pri, fontWeight: '700', fontSize: 15 },
  toggleRow: { flexDirection: 'row', backgroundColor: C.sky, borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: C.pri },
  toggleText: { fontSize: 13, fontWeight: '600', color: C.sub },
  toggleTextActive: { color: C.white },
  modeDesc: { fontSize: 11, color: C.sub, textAlign: 'center', marginTop: 8 },
  helpBox: { backgroundColor: `${C.pri}10`, borderWidth: 1, borderColor: `${C.pri}30`, borderRadius: 8, padding: 10, marginBottom: 4, marginTop: 4 },
  helpTitle: { fontSize: 10, fontWeight: '700', color: C.pri, marginBottom: 3 },
  helpText: { fontSize: 11, color: C.sub, lineHeight: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: C.bdr, borderRadius: 10, backgroundColor: C.white, marginBottom: 14 },
  input: { flex: 1, padding: 12, fontSize: 15, color: C.text },
  inputSuffix: { paddingRight: 14, color: C.sub, fontSize: 14 },
  calcBtn: { backgroundColor: C.pri, borderRadius: 12, paddingVertical: 15, alignItems: 'center', shadowColor: C.pri, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  calcBtnText: { color: C.white, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  resultCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultHeader: { backgroundColor: C.priDk, padding: 20, alignItems: 'center' },
  resultLabel: { fontSize: 11, color: C.accLt, letterSpacing: 1, marginBottom: 4, textAlign: 'center' },
  resultPP: { fontSize: 44, fontWeight: '900', color: C.acc },
  resultPPUnit: { fontSize: 16, color: C.accLt },
  ppUnitBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  ppUnitText: { fontSize: 13, fontWeight: '700' },
  bookmarkBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginTop: 10 },
  bookmarkText: { color: C.white, fontSize: 12, fontWeight: '600' },
  detailSection: { backgroundColor: C.card, paddingHorizontal: 16, paddingVertical: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  detailLabel: { fontSize: 12, color: C.sub },
  detailValue: { fontSize: 12, fontWeight: '600', color: C.text },
  tripsRow: { backgroundColor: C.sky, paddingVertical: 12, paddingHorizontal: 16 },
  tripsText: { fontSize: 12, color: C.pri, fontWeight: '500' },
  addHistoryBtn: { backgroundColor: C.acc, paddingVertical: 13, alignItems: 'center' },
  addHistoryText: { color: C.priDk, fontSize: 13, fontWeight: '700' },
  adBanner: { backgroundColor: '#E8ECF0', borderRadius: 8, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  adText: { fontSize: 11, color: '#A0AAB4' },
  accessoryBar: { backgroundColor: '#F8F8F8', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'flex-end' },
  accessoryBtn: { paddingHorizontal: 16, paddingVertical: 4 },
  accessoryText: { fontSize: 16, fontWeight: '600', color: C.pri },
});
