import { google } from 'googleapis';

const androidpublisher = google.androidpublisher('v3');

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_PLAY_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_PLAY_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  return auth.getClient();
}

export interface VerifyResult {
  valid: boolean;
  expiresAt: Date | null;
  orderId: string | null;
}

export async function verifyPlayStorePurchase(
  purchaseToken: string,
  productId: string
): Promise<VerifyResult> {
  try {
    const authClient = await getAuthClient();
    google.options({ auth: authClient as any });

    const response = await androidpublisher.purchases.subscriptions.get({
      packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME!,
      subscriptionId: productId,
      token: purchaseToken,
    });

    const sub = response.data;

    // Check payment state: 1 = Payment received, 2 = Free trial
    const paymentState = sub.paymentState;
    if (paymentState !== 1 && paymentState !== 2) {
      return { valid: false, expiresAt: null, orderId: null };
    }

    const expiryMs = parseInt(sub.expiryTimeMillis ?? '0', 10);
    const expiresAt = expiryMs ? new Date(expiryMs) : null;

    // Check not expired
    if (expiresAt && expiresAt < new Date()) {
      return { valid: false, expiresAt, orderId: sub.orderId ?? null };
    }

    return {
      valid: true,
      expiresAt,
      orderId: sub.orderId ?? null,
    };
  } catch (err) {
    console.error('Play Store verification error:', err);
    return { valid: false, expiresAt: null, orderId: null };
  }
}
