import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProducts, purchasePro, restorePurchases, setPurchaseListener, initIAP, disconnectIAP } from '../utils/iapManager';
import { useSettings } from '../utils/SettingsContext';

interface Props {
  onClose: () => void;
  onPurchased: () => void;
  isPro: boolean;
}

const features = [
  { icon: "🚫", title: "広告を削除", desc: "アプリ内の広告を完全に非表示" },
  { icon: "🏠", title: "ホーム空港の設定", desc: "PP計算の出発地をデフォルト設定" },
  { icon: "💳", title: "デフォルト運賃の設定", desc: "よく使う運賃を初期値として保存" },
  { icon: "📤", title: "データをCSVで出力", desc: "搭乗履歴・お気に入りをエクスポート" },
  { icon: "✨", title: "今後のPro限定機能", desc: "アップデートで随時追加" },
];

const comparison = [
  { feature: "PP計算", free: "✓", pro: "✓" },
  { feature: "新旧運賃対応", free: "✓", pro: "✓" },
  { feature: "運賃ヘルプ", free: "✓", pro: "✓" },
  { feature: "広告なし", free: "—", pro: "✓" },
  { feature: "ホーム空港設定", free: "—", pro: "✓" },
  { feature: "デフォルト運賃設定", free: "—", pro: "✓" },
  { feature: "CSVエクスポート", free: "—", pro: "✓" },
];

export default function ProUpgradeScreen({ onClose, onPurchased, isPro }: Props) {
  const { C } = useSettings();
  const insets = useSafeAreaInsets();
  const [price, setPrice] = useState("¥100");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    (async () => {
      await initIAP();
      const products = await getProducts();
      if (products && products.length > 0) setPrice(products[0].displayPrice || "¥100");
    })();

    // Listener for native IAP (real device / App Store)
    const cleanup = setPurchaseListener((success) => {
      setLoading(false);
      if (success) {
        setShowThankYou(true);
      }
    });

    return () => {
      cleanup?.();
      disconnectIAP();
    };
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    const result = await purchasePro();
    // In Expo Go / dev, purchasePro() returns true immediately (mock).
    // On a real device, the listener handles the result instead.
    if (result) {
      setLoading(false);
      setShowThankYou(true);
    } else {
      // Purchase was cancelled or failed — stop loading
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const restored = await restorePurchases();
    setRestoring(false);
    if (restored) {
      setShowThankYou(true);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    // Wait for the thank you modal to fully dismiss before closing the parent modal
    setTimeout(() => onPurchased(), 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.sky }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Close */}
        <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: C.white, top: insets.top + 16 }]}>
          <Text style={[s.closeText, { color: C.text }]}>✕</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.appName, { color: C.pri }]}>PP計算機</Text>
          <View style={[s.proBadge, { backgroundColor: C.pri }]}>
            <Text style={[s.proBadgeText, { color: C.acc }]}>👑 Pro</Text>
          </View>
        </View>

        {/* Features */}
        <View style={s.featureList}>
          {features.map((f, i) => (
            <View key={i} style={[s.featureRow, i < features.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.bdr }]}>
              <View style={[s.featureIcon, { backgroundColor: C.skyDp }]}>
                <Text style={{ fontSize: 20 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.featureTitle, { color: C.text }]}>{f.title}</Text>
                <Text style={[s.featureDesc, { color: C.sub }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={s.pricing}>
          <View style={s.priceRow}>
            <Text style={[s.priceNew, { color: C.text }]}>{price}</Text>
          </View>
          <Text style={[s.priceSub, { color: C.sub }]}>買い切り・サブスクなし</Text>
        </View>

        {/* CTA */}
        {isPro ? (
          <View style={[s.ctaBtn, { backgroundColor: C.sub }]}>
            <Text style={[s.ctaText, { color: C.white }]}>✓ アップグレード済み</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePurchase} style={[s.ctaBtn, { backgroundColor: C.pri }]} activeOpacity={0.8} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[s.ctaText, { color: C.white }]}>アップグレードする</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Restore */}
        {!isPro && (
          <TouchableOpacity onPress={handleRestore} style={s.restoreBtn} disabled={restoring}>
            <Text style={[s.restoreText, { color: C.sub }]}>{restoring ? "復元中..." : "購入を復元"}</Text>
          </TouchableOpacity>
        )}

        {/* Comparison table */}
        <View style={[s.table, { borderColor: C.bdr }]}>
          <View style={[s.tableHeader, { backgroundColor: C.sky }]}>
            <Text style={[s.tableHeaderCell, { flex: 1, textAlign: 'left', color: C.text }]}>機能</Text>
            <Text style={[s.tableHeaderCell, { width: 65, color: C.text }]}>無料</Text>
            <Text style={[s.tableHeaderCell, { width: 65, color: C.acc }]}>Pro</Text>
          </View>
          {comparison.map((row, i) => (
            <View key={i} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? C.white : C.bg, borderTopColor: C.bdr }]}>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'left', color: C.text }]}>{row.feature}</Text>
              <Text style={[s.tableCell, { width: 65, color: C.sub }]}>{row.free}</Text>
              <Text style={[s.tableCell, { width: 65, color: C.pri, fontWeight: '600' }]}>{row.pro}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Thank You Modal */}
      <Modal visible={showThankYou} transparent animationType="fade">
        <View style={s.thankYouOverlay}>
          <View style={[s.thankYouCard, { backgroundColor: C.white }]}>
            <Text style={s.thankYouEmoji}>🎉</Text>
            <Text style={[s.thankYouTitle, { color: C.pri }]}>ありがとうございます！</Text>
            <Text style={[s.thankYouMsg, { color: C.sub }]}>
              Proへのアップグレードありがとうございます。{'\n'}
              引き続きSFC修行を全力でサポートします！
            </Text>
            <TouchableOpacity
              onPress={handleThankYouClose}
              style={[s.thankYouBtn, { backgroundColor: C.pri }]}
              activeOpacity={0.8}
            >
              <Text style={[s.thankYouBtnText, { color: C.white }]}>はじめる 👑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  closeBtn: { position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  closeText: { fontSize: 18 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 10 },
  appName: { fontSize: 28, fontWeight: '900' },
  proBadge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  proBadgeText: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  featureList: { marginHorizontal: 28, marginTop: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '700' },
  featureDesc: { fontSize: 12, marginTop: 2 },
  pricing: { alignItems: 'center', marginTop: 32 },
  pricingLabel: { fontSize: 13 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8 },
  priceOld: { fontSize: 18, textDecorationLine: 'line-through' },
  priceNew: { fontSize: 48, fontWeight: '800' },
  priceSub: { fontSize: 13, marginTop: 4 },
  ctaBtn: { marginHorizontal: 28, marginTop: 24, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  ctaText: { fontSize: 17, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', marginTop: 12, padding: 8 },
  restoreText: { fontSize: 13 },
  table: { marginHorizontal: 28, marginTop: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  tableHeader: { flexDirection: 'row', padding: 12 },
  tableHeaderCell: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 11, paddingHorizontal: 12, borderTopWidth: 1 },
  tableCell: { fontSize: 13, textAlign: 'center' },
  // Thank You Modal
  thankYouOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  thankYouCard: { borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 8, width: '100%' },
  thankYouEmoji: { fontSize: 56, marginBottom: 12 },
  thankYouTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  thankYouMsg: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  thankYouBtn: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 },
  thankYouBtnText: { fontSize: 16, fontWeight: '700' },
});
