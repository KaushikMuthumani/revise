import { useState, useCallback } from 'react';
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  getAvailablePurchases,
  Purchase,
} from 'react-native-iap';
import { verifyPurchase, restorePurchase } from '../api/billing';
import { useProfileStore } from '../store/useProfileStore';
import { PLAY_SKU } from '../utils/constants';

export function useBilling() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchProfile } = useProfileStore();

  const initBilling = useCallback(async () => {
    try {
      await initConnection();
    } catch (e) {
      console.log('IAP init failed (expected on simulator):', e);
    }
  }, []);

  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await initConnection();
      const subs = await getSubscriptions({ skus: [PLAY_SKU] });
      if (!subs.length) throw new Error('Subscription product not found');

      const purchase = await requestSubscription({ sku: PLAY_SKU }) as Purchase;
      if (!purchase?.purchaseToken) throw new Error('Purchase token not received');

      // Verify server-side
      await verifyPurchase(purchase.purchaseToken, PLAY_SKU);
      await finishTransaction({ purchase, isConsumable: false });
      await fetchProfile();
    } catch (e: any) {
      setError(e.message ?? 'Purchase failed');
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const restore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await restorePurchase();
      if (result.success) await fetchProfile();
      else setError('No active subscription found');
    } catch (e: any) {
      setError(e.message ?? 'Restore failed');
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  return { subscribe, restore, initBilling, isLoading, error };
}
