import { getApiClient } from './client';

export async function verifyPurchase(purchaseToken: string, productId: string) {
  const res = await getApiClient().post('/billing/verify', { purchaseToken, productId });
  return res.data;
}

export async function restorePurchase() {
  const res = await getApiClient().post('/billing/restore');
  return res.data;
}
