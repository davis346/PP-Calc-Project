import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, Keyboard, Platform } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { AIRPORTS, OLD_DOMESTIC_FARES, NEW_DOMESTIC_FARES, INTL_FARES, FARE_HELP, Fare } from '../data/masterData';
import { getBaseMileage, isDomestic, getRouteMultiplier, calcPP, getAirportName, buildAirportSelectorOptions } from '../utils/ppCalc';
import { CalcResult, BookmarkItem, HistoryItem } from '../utils/types';
import { useSettings } from '../utils/SettingsContext';
import { usePro } from '../utils/ProContext';

interface Props {
  history: HistoryItem[];
  setHistory: (h: HistoryItem[]) => void;
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: BookmarkItem) => void;
  isBookmarked: (dep: string, arr: string, fareId: string) => boolean;
  onShowPro: () => void;
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

const airportOptions = buildAirportSelectorOptions();

const INPUT_ACCESSORY_ID = 'priceInput';
const MAX_PRICE = 1_000_000;

export default function CalcTab({ history, setHistory, bookmarks, toggleBookmark, isBookmarked, onShowPro }: Props) {
  const { C, settings } = useSettings();
  const { isPro } = usePro();
  const [dep, setDep] = useState(settings.homeAirport || "HND");
  const [arr, setArr] = useState("OKA");
  const userChangedDep = React.useRef(false);

  // When homeAirport loads from AsyncStorage or user changes it in Settings,
  // update dep — but only if the user hasn't manually picked a different airport.
  useEffect(() => {
    if (!userChangedDep.current) {
      setDep(settings.homeAirport || "HND");
    }
  }, [settings.homeAirport]);

  const handleSetDep = (code: string) => {
    userChangedDep.current = true;
    setDep(code);
    setResult(null);
  };
  const [fareMode, setFareMode] = useState<"old" | "new">("new");
  const [fareId, setFareId] = useState(settings.defaultFare || "new-e-std");
  const userChangedFare = React.useRef(false);

  // Sync fareId with defaultFare setting on load or change,
  // unless the user has manually picked a fare this session.
  useEffect(() => {
    if (!userChangedFare.current) {
      setFareId(settings.defaultFare || "new-e-std");
    }
  }, [settings.defaultFare]);

  const handleSetFareId = (id: string) => {
    userChangedFare.current = true;
    setFareId(id);
    setResult(null);
  };

  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isRound, setIsRound] = useState(true);
  const [result, setResult] = useState<CalcResult | null>(null);

  const domestic = isDomestic(dep, arr);
  const fares: Fare[] = domestic ? (fareMode === "old" ? OLD_DOMESTIC_FARES : NEW_DOMESTIC_FARES) : INTL_FARES;
  const fareOptions = buildFareOptions(fares, domestic, fareMode);

  useEffect(() => {
    // When route type or fare mode changes, reset to default fare unless user overrode it
    userChangedFare.current = false;
    if (domestic) setFareId(fareMode === "old" ? "old-6" : (settings.defaultFare || "new-e-std"));
    else setFareId("Y/B/M");
    setResult(null);
  }, [domestic, fareMode]);

  const swap = () => { const t = dep; handleSetDep(arr); setArr(t); setResult(null); };

  const handlePriceChange = (t: string) => {
    setPrice(t);
    setResult(null);
    if (t === '') { setPriceError(null); return; }
    if (/[^0-9]/.test(t)) { setPriceError("数字のみ入力できます（記号・文字は使用不可）"); return; }
    const num = parseInt(t, 10);
    if (num > MAX_PRICE) { setPriceError(`金額が大きすぎます（上限は${MAX_PRICE.toLocaleString()}円）`); return; }
    setPriceError(null);
  };

  const doCalc = useCallback(() => {
    if (priceError) return;
    const bm = getBaseMileage(dep, arr);
    if (!bm) { Alert.alert("エラー", "この路線のデータがありません"); return; }
    const fare = fares.find(f => f.id === fareId);
    if (!fare) return;
    const mult = getRouteMultiplier(dep, arr);
    const { flightMile, pp } = calcPP(bm, fare.rate, mult, fare.boarding);
    const totalPP = isRound ? pp * 2 : pp;
    const numPrice = price === '' ? 0 : parseInt(price, 10);
    const ppUnit = numPrice > 0 ? Math.round((numPrice / totalPP) * 100) / 100 : null;
    const trips = Math.ceil(50000 / (pp * 2));
    setResult({ bm, fare, mult, flightMile, pp, totalPP, ppUnit, trips, isRound });
  }, [dep, arr, fareId, price, priceError, isRound, fares]);

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
    <ScrollView style={{ flex: 1, backgroundColor: C.bg, padding: 14 }} contentContainerStyle={{ paddingBottom: 40 }}>
      {domestic && (
        <View style={[s.card, { backgroundColor: C.card }]}>
          <View style={[s.toggleRow, { backgroundColor: C.sky }]}>
            {(["old", "new"] as const).map(k => (
              <TouchableOpacity key={k} onPress={() => setFareMode(k)}
                style={[s.toggleBtn, fareMode === k && { backgroundColor: C.pri }]}>
                <Text style={[s.toggleText, { color: fareMode === k ? C.white : C.sub }]}>
                  {k === "old" ? "旧運賃（〜5/18）" : "新運賃（5/19〜）"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.modeDesc, { color: C.sub }]}>
            {fareMode === "old" ? "2026年5月18日搭乗分まで適用" : "2026年5月19日搭乗分から適用"}
          </Text>
        </View>
      )}

      <View style={[s.card, { backgroundColor: C.card }]}>
        <View style={s.airportRow}>
          <View style={s.airportCol}>
            <Text style={[s.label, { color: C.sub }]}>🛫 出発地</Text>
            <ModalSelector
              data={airportOptions}
              onChange={(o) => handleSetDep(o.key)}
              style={{ borderWidth: 0 }}
              selectStyle={{ borderWidth: 0, padding: 0 }}
              selectTextStyle={{ display: 'none' }}
              sectionTextStyle={[s.sectionText, { color: C.pri }]}
              optionTextStyle={[s.optionText, { color: C.text }]}
              cancelText="キャンセル"
              overlayStyle={s.overlay}
              optionContainerStyle={[s.optionContainer, { backgroundColor: C.white }]}
            >
              <View style={[s.singleBorder, { borderColor: C.bdr, backgroundColor: C.white }]}>
                <Text style={[s.selectorText, { color: C.text }]}>{depAP ? `${depAP.name}（${depAP.code}）` : dep}</Text>
              </View>
            </ModalSelector>
          </View>

          <TouchableOpacity onPress={swap} style={[s.swapBtn, { borderColor: C.bdr, backgroundColor: C.white }]}>
            <Text style={[s.swapText, { color: C.pri }]}>⇄</Text>
          </TouchableOpacity>

          <View style={s.airportCol}>
            <Text style={[s.label, { color: C.sub }]}>🛬 到着地</Text>
            <ModalSelector
              data={airportOptions}
              onChange={(o) => { setArr(o.key); setResult(null); }}
              style={{ borderWidth: 0 }}
              selectStyle={{ borderWidth: 0, padding: 0 }}
              selectTextStyle={{ display: 'none' }}
              sectionTextStyle={[s.sectionText, { color: C.pri }]}
              optionTextStyle={[s.optionText, { color: C.text }]}
              cancelText="キャンセル"
              overlayStyle={s.overlay}
              optionContainerStyle={[s.optionContainer, { backgroundColor: C.white }]}
            >
              <View style={[s.singleBorder, { borderColor: C.bdr, backgroundColor: C.white }]}>
                <Text style={[s.selectorText, { color: C.text }]}>{arrAP ? `${arrAP.name}（${arrAP.code}）` : arr}</Text>
              </View>
            </ModalSelector>
          </View>
        </View>

        <Text style={[s.label, { color: C.sub }]}>{domestic ? "💳 運賃種別" : "💳 予約クラス"}</Text>
        <ModalSelector
          data={fareOptions}
          onChange={(o) => handleSetFareId(o.key)}
          style={{ borderWidth: 0 }}
          selectStyle={{ borderWidth: 0, padding: 0 }}
          selectTextStyle={{ display: 'none' }}
          sectionTextStyle={[s.sectionText, { color: C.pri }]}
          optionTextStyle={[s.optionText, { color: C.text }]}
          cancelText="キャンセル"
          overlayStyle={s.overlay}
          optionContainerStyle={[s.optionContainer, { backgroundColor: C.white }]}
        >
          <View style={[s.singleBorder, { borderColor: C.bdr, backgroundColor: C.white }]}>
            <Text style={[s.selectorText, { color: C.text }]}>{fareObj ? `${fareObj.name}（${Math.round(fareObj.rate * 100)}%）` : fareId}</Text>
          </View>
        </ModalSelector>

        {helpTexts && (
          <View style={[s.helpBox, { backgroundColor: `${C.pri}10`, borderColor: `${C.pri}30` }]}>
            <Text style={[s.helpTitle, { color: C.pri }]}>{domestic ? "💡 この区分に含まれる運賃：" : "💡 この予約クラスの詳細："}</Text>
            <Text style={[s.helpText, { color: C.sub }]}>{helpTexts.join("、")}</Text>
          </View>
        )}

        <View style={[s.toggleRow, { backgroundColor: C.sky, marginTop: 12 }]}>
          {["往復", "片道"].map(l => (
            <TouchableOpacity key={l} onPress={() => { setIsRound(l === "往復"); setResult(null); }}
              style={[s.toggleBtn, (l === "往復" ? isRound : !isRound) && { backgroundColor: C.pri }]}>
              <Text style={[s.toggleText, { color: (l === "往復" ? isRound : !isRound) ? C.white : C.sub }]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { color: C.sub, marginTop: 14 }]}>💰 航空券価格（{isRound ? "往復" : "片道"}合計・任意）</Text>
        <View style={[s.inputWrap, { borderColor: priceError ? C.danger : C.bdr, backgroundColor: C.white }]}>
          <TextInput
            style={[s.input, { color: C.text }]}
            value={price}
            onChangeText={handlePriceChange}
            placeholder="例: 25300"
            keyboardType="numeric"
            placeholderTextColor={C.sub}
            maxLength={7}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
          />
          <Text style={[s.inputSuffix, { color: C.sub }]}>円</Text>
        </View>
        {priceError && <Text style={s.priceError}>{priceError}</Text>}

        <TouchableOpacity onPress={doCalc} style={[s.calcBtn, { backgroundColor: priceError ? C.sub : C.pri }, priceError ? s.calcBtnDisabled : null]} activeOpacity={0.8}>
          <Text style={[s.calcBtnText, { color: C.white }]}>PP を計算する</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <>
          <View style={s.resultCard}>
            <View style={[s.resultHeader, { backgroundColor: C.priDk }]}>
              <Text style={[s.resultLabel, { color: C.accLt }]}>
                獲得プレミアムポイント（{result.isRound ? "往復" : "片道"}）
                {domestic && ` [${fareMode === "old" ? "旧運賃" : "新運賃"}]`}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                <Text style={[s.resultPP, { color: C.acc }]}>{result.totalPP.toLocaleString()}</Text>
                <Text style={[s.resultPPUnit, { color: C.accLt }]}> PP</Text>
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
                <Text style={[s.bookmarkText, { color: C.white }]}>{curBookmarked ? "★ ブックマーク済み" : "☆ ブックマークに追加"}</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.detailSection, { backgroundColor: C.card }]}>
              {[
                ["区間基本マイル", `${result.bm.toLocaleString()} マイル`],
                ["積算率", `${Math.round(result.fare.rate * 100)}%（${result.fare.name}）`],
                ["フライトマイル", `${result.flightMile.toLocaleString()}`],
                ["路線倍率", `×${result.mult}（${result.mult === 2 ? "国内線" : result.mult === 1.5 ? "アジア・オセアニア" : "その他"}）`],
                ["搭乗ポイント", `+${result.fare.boarding} PP`],
                ["片道PP", `${result.pp.toLocaleString()} PP`],
              ].map(([label, value], i) => (
                <View key={i} style={[s.detailRow, i < 5 && { borderBottomWidth: 1, borderBottomColor: C.bdr }]}>
                  <Text style={[s.detailLabel, { color: C.sub }]}>{label}</Text>
                  <Text style={[s.detailValue, { color: C.text }]}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={[s.tripsRow, { backgroundColor: C.sky }]}>
              <Text style={[s.tripsText, { color: C.pri }]}>🎯 この路線の往復で <Text style={{ fontWeight: '700' }}>{result.trips}往復</Text> で50,000PP達成</Text>
            </View>
            <TouchableOpacity onPress={addHistory} style={[s.addHistoryBtn, { backgroundColor: C.acc }]} activeOpacity={0.8}>
              <Text style={[s.addHistoryText, { color: C.priDk }]}>＋ 搭乗履歴に追加する</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  airportRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  airportCol: { flex: 1 },
  singleBorder: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 4 },
  selectorText: { fontSize: 14 },
  sectionText: { fontSize: 13, fontWeight: '700', paddingVertical: 8, paddingLeft: 16, textAlign: 'left' },
  optionText: { fontSize: 15, textAlign: 'left', paddingLeft: 16 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
  optionContainer: { borderRadius: 16, maxHeight: '70%' },
  swapBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, marginBottom: 8 },
  swapText: { fontWeight: '700', fontSize: 15 },
  toggleRow: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontSize: 13, fontWeight: '600' },
  modeDesc: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  helpBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 4, marginTop: 4 },
  helpTitle: { fontSize: 10, fontWeight: '700', marginBottom: 3 },
  helpText: { fontSize: 11, lineHeight: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, marginBottom: 4 },
  input: { flex: 1, padding: 12, fontSize: 15 },
  inputSuffix: { paddingRight: 14, fontSize: 14 },
  priceError: { fontSize: 11, color: '#D63031', marginBottom: 10, marginLeft: 4 },
  calcBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', shadowOpacity: 0.2, shadowRadius: 8, elevation: 3, marginTop: 10 },
  calcBtnDisabled: { shadowOpacity: 0 },
  calcBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  resultCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultHeader: { padding: 20, alignItems: 'center' },
  resultLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 4, textAlign: 'center' },
  resultPP: { fontSize: 44, fontWeight: '900' },
  resultPPUnit: { fontSize: 16 },
  ppUnitBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 10 },
  ppUnitText: { fontSize: 13, fontWeight: '700' },
  bookmarkBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7, marginTop: 10 },
  bookmarkText: { fontSize: 12, fontWeight: '600' },
  detailSection: { paddingHorizontal: 16, paddingVertical: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 12, fontWeight: '600' },
  tripsRow: { paddingVertical: 12, paddingHorizontal: 16 },
  tripsText: { fontSize: 12, fontWeight: '500' },
  addHistoryBtn: { paddingVertical: 13, alignItems: 'center' },
  addHistoryText: { fontSize: 13, fontWeight: '700' },
});
