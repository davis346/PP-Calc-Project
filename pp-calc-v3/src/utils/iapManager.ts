import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_PRODUCT_ID = 'com.minor7.ppcalc.pro';
const PRO_KEY = '@ppcalc_pro';

let InAppPurchases: any = null;

// Try to load native module, fallback to mock for Expo Go
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch {
  InAppPurchases = null;
}

const isNativeAvailable = () => InAppPurchases !== null;

export async function initIAP(): Promise<void> {
  if (!isNativeAvailable()) return;
  try {
    await InAppPurchases.connectAsync();
  } catch {}
}

export async function getProducts() {
  if (!isNativeAvailable()) return [{ productId: PRO_PRODUCT_ID, price: '¥480', title: 'PP計算機 Pro' }];
  try {
    const { results } = await InAppPurchases.getProductsAsync([PRO_PRODUCT_ID]);
    return results;
  } catch {
    return [];
  }
}

export async function purchasePro(): Promise<boolean> {
  if (!isNativeAvailable()) {
    // Mock purchase for dev
    await AsyncStorage.setItem(PRO_KEY, 'true');
    return true;
  }
  try {
    await InAppPurchases.purchaseItemAsync(PRO_PRODUCT_ID);
    return true;
  } catch {
    return false;
  }
}

export function setPurchaseListener(onPurchase: (success: boolean) => void) {
  if (!isNativeAvailable()) return;
  InAppPurchases.setPurchaseListener(async ({ responseCode, results }: any) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          await InAppPurchases.finishTransactionAsync(purchase, false);
        }
      }
      await AsyncStorage.setItem(PRO_KEY, 'true');
      onPurchase(true);
    } else {
      onPurchase(false);
    }
  });
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNativeAvailable()) {
    const val = await AsyncStorage.getItem(PRO_KEY);
    return val === 'true';
  }
  try {
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();
    if (results && results.some((p: any) => p.productId === PRO_PRODUCT_ID)) {
      await AsyncStorage.setItem(PRO_KEY, 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function isProUser(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(PRO_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function disconnectIAP(): Promise<void> {
  if (!isNativeAvailable()) return;
  try {
    await InAppPurchases.disconnectAsync();
  } catch {}
}
