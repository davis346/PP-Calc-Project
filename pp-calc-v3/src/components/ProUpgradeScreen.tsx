import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { C } from '../utils/colors';
import { getProducts, purchasePro, restorePurchases, setPurchaseListener, initIAP, disconnectIAP } from '../utils/iapManager';

interface Props {
  onClose: () => void;
  onPurchased: () => void;
  isPro: boolean;
}

const features = [
  { icon: "🧮", title: "PP計算 無制限", desc: "無料版は1日3回まで → 何度でも計算" },
  { icon: "🗓️", title: "フライト管理 無制限", desc: "無料版は3件まで → 全フライトを管理" },
  { icon: "⭐", title: "お気に入り 無制限", desc: "無料版は3件まで → 好きなだけ保存" },
  { icon: "🌏", title: "国際線PP計算", desc: "40路線以上の国際線に対応" },
  { icon: "📊", title: "路線ランキング全件表示", desc: "無料版は上位5件 → 全路線を比較" },
  { icon: "📈", title: "詳細ダッシュボード", desc: "累計費用・平均PP単価などの詳細統計" },
  { icon: "✨", title: "今後のPro限定機能", desc: "アップデートで随時追加" },
];

const comparison = [
  { feature: "PP計算", free: "1日3回", pro: "無制限" },
  { feature: "新旧運賃対応", free: "✓", pro: "✓" },
  { feature: "運賃ヘルプ", free: "✓", pro: "✓" },
  { feature: "フライト管理", free: "3件", pro: "無制限" },
  { feature: "お気に入り", free: "3件", pro: "無制限" },
  { feature: "国際線計算", free: "—", pro: "✓" },
  { feature: "路線ランキング", free: "5件", pro: "全件" },
  { feature: "詳細統計", free: "—", pro: "✓" },
];

export default function ProUpgradeScreen({ onClose, onPurchased, isPro }: Props) {
  const [price, setPrice] = useState("¥500");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    // Connect to IAP only when this screen is open, not on app startup.
    (async () => {
      await initIAP();
      const products = await getProducts();
      if (products.length > 0) {
        setPrice(products[0].price || "¥500");
      }
    })();

    setPurchaseListener((success) => {
      setLoading(false);
      if (success) {
        Alert.alert("購入完了", "Proにアップグレードしました！");
        onPurchased();
      }
    });

    // Disconnect when screen closes to avoid keeping a live IAP session.
    return () => { disconnectIAP(); };
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    const result = await purchasePro();
    if (!result) setLoading(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    const restored = await restorePurchases();
    setRestoring(false);
    if (restored) {
      Alert.alert("復元完了", "Proが復元されました！");
      onPurchased();
    } else {
      Alert.alert("復元結果", "購入履歴が見つかりませんでした");
    }
  };

  return (
    <View style={s.overlay}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Close */}
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeText}>✕</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.appName}>PP計算機</Text>
          <View style={s.proBadge}>
            <Text style={s.proBadgeText}>👑 Pro</Text>
          </View>
        </View>

        {/* Features */}
        <View style={s.featureList}>
          {features.map((f, i) => (
            <View key={i} style={[s.featureRow, i < features.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bdr }]}>
              <View style={s.featureIcon}><Text style={{ fontSize: 20 }}>{f.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={s.pricing}>
          <Text style={s.pricingLabel}>リリース記念価格</Text>
          <View style={s.priceRow}>
            <Text style={s.priceOld}>¥800</Text>
            <Text style={s.priceNew}>{price}</Text>
          </View>
          <Text style={s.priceSub}>買い切り・サブスクなし</Text>
        </View>

        {/* CTA */}
        {isPro ? (
          <View style={[s.ctaBtn, { backgroundColor: C.sub }]}>
            <Text style={s.ctaText}>✓ アップグレード済み</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePurchase} style={s.ctaBtn} activeOpacity={0.8} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.ctaText}>アップグレードする</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore */}
        {!isPro && (
          <TouchableOpacity onPress={handleRestore} style={s.restoreBtn} disabled={restoring}>
            <Text style={s.restoreText}>{restoring ? "復元中..." : "購入を復元"}</Text>
          </TouchableOpacity>
        )}

        {/* Comparison table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'left' }]}>機能</Text>
            <Text style={[s.tableHeaderCell, { width: 65 }]}>無料</Text>
            <Text style={[s.tableHeaderCell, { width: 65, color: C.acc }]}>Pro</Text>
          </View>
          {comparison.map((row, i) => (
            <View key={i} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? C.white : C.bg }]}>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'left' }]}>{row.feature}</Text>
              <Text style={[s.tableCell, { width: 65, color: C.sub }]}>{row.free}</Text>
              <Text style={[s.tableCell, { width: 65, color: C.pri, fontWeight: '600' }]}>{row.pro}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: C.sky },
  container: { flex: 1 },
  closeBtn: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  closeText: { fontSize: 18, color: C.text },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 10 },
  appName: { fontSize: 28, fontWeight: '900', color: C.pri },
  proBadge: { backgroundColor: C.pri, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  proBadgeText: { fontSize: 14, fontWeight: '700', color: C.acc, letterSpacing: 1 },
  featureList: { marginHorizontal: 28, marginTop: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${C.sky}`, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  featureDesc: { fontSize: 12, color: C.sub, marginTop: 2 },
  pricing: { alignItems: 'center', marginTop: 32 },
  pricingLabel: { fontSize: 13, color: C.sub },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8 },
  priceOld: { fontSize: 18, color: C.sub, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 48, fontWeight: '800', color: C.text },
  priceSub: { fontSize: 13, color: C.sub, marginTop: 4 },
  ctaBtn: { marginHorizontal: 28, marginTop: 24, backgroundColor: C.pri, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: C.pri, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  ctaText: { color: C.white, fontSize: 17, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', marginTop: 12, padding: 8 },
  restoreText: { fontSize: 13, color: C.sub },
  table: { marginHorizontal: 28, marginTop: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.bdr },
  tableHeader: { flexDirection: 'row', padding: 12, backgroundColor: C.sky },
  tableHeaderCell: { fontSize: 13, fontWeight: '700', color: C.text, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: C.bdr },
  tableCell: { fontSize: 13, color: C.text, textAlign: 'center' },
});