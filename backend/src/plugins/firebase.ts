import admin from 'firebase-admin';
import 'dotenv/config';

let initialized = false;

export function getFirebaseAdmin(): admin.app.App {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      }),
    });
    initialized = true;
  }
  return admin.app();
}

export function getMessaging(): admin.messaging.Messaging {
  return getFirebaseAdmin().messaging();
}
