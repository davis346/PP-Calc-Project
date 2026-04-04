import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchProducts as iapFetchProducts,
  requestPurchase,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  initConnection,
  endConnection,
  ErrorCode,
} from 'expo-iap';

const PRO_PRODUCT_ID = 'com.minor7.ppcalc.pro';
const PRO_KEY = '@ppcalc_pro';
const PRO_KEY_MOCK = '@ppcalc_pro_mock'; // Dev only — separate from real purchase key

let _connected = false;

// ─── Internal only. Connect lazily when the upgrade screen opens. ───────────
async function connectIAP(): Promise<void> {
  if (_connected) return;
  try {
    await initConnection();
    _connected = true;
  } catch {}
}

// Call when the Pro upgrade screen OPENS.
export async function initIAP(): Promise<void> {
  await connectIAP();
}

export async function getProducts() {
  if (!_connected) return [{ id: PRO_PRODUCT_ID, displayPrice: '¥100', title: 'PP計算機 Pro' }];
  try {
    const products = await iapFetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' });
    return products;
  } catch {
    return [];
  }
}

export async function purchasePro(): Promise<boolean> {
  if (!_connected) {
    // Mock purchase for dev — uses separate key so restore doesn't find it
    await AsyncStorage.setItem(PRO_KEY_MOCK, 'true');
    return true;
  }
  try {
    await requestPurchase({
      request: {
        apple: { sku: PRO_PRODUCT_ID },
        google: { skus: [PRO_PRODUCT_ID] },
      },
      type: 'in-app',
    });
    // Actual result comes via purchaseUpdatedListener
    return true;
  } catch (e: any) {
    if (e?.code === ErrorCode.UserCancelled) return false;
    return false;
  }
}

export function setPurchaseListener(onPurchase: (success: boolean) => void) {
  if (!_connected) return () => {};

  const successSub = purchaseUpdatedListener(async (purchase) => {
    if (purchase.purchaseState === 'purchased') {
      try {
        await finishTransaction({ purchase, isConsumable: false });
        await AsyncStorage.setItem(PRO_KEY, 'true');
        onPurchase(true);
      } catch {
        onPurchase(false);
      }
    }
  });

  const errorSub = purchaseErrorListener((error) => {
    if (error.code !== ErrorCode.UserCancelled) {
      onPurchase(false);
    }
  });

  // Return cleanup function
  return () => {
    successSub.remove();
    errorSub.remove();
  };
}

export async function restorePurchases(): Promise<boolean> {
  if (!_connected) {
    // In dev/Expo Go there's no real store to restore from — always return false
    return false;
  }
  try {
    const purchases = await getAvailablePurchases();
    const hasPro = purchases.some((p) => p.productId === PRO_PRODUCT_ID);
    if (hasPro) {
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

// DEV ONLY — clears both real and mock purchase keys
export async function devResetPro(): Promise<void> {
  await AsyncStorage.removeItem(PRO_KEY);
  await AsyncStorage.removeItem(PRO_KEY_MOCK);
}

export async function disconnectIAP(): Promise<void> {
  if (!_connected) return;
  try {
    await endConnection();
    _connected = false;
  } catch {}
}
