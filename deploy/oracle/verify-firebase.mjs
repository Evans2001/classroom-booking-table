import { cert } from '/opt/room-booking/room-booking-admin/node_modules/firebase-admin/lib/app/index.js';

try {
  const credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  });
  await credential.getAccessToken();
  console.log('Firebase service-account authentication verified. No notification sent.');
} catch {
  console.error('Firebase authentication failed. Check credentials, account permissions, and connectivity.');
  process.exitCode = 1;
}
