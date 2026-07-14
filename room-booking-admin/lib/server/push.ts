import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

export interface PushNotificationInput {
  token: string;
  title: string;
  body: string;
}

function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return undefined;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function sendPushNotification(input: PushNotificationInput): Promise<boolean> {
  const app = getFirebaseApp();
  if (!app) {
    return false;
  }

  try {
    await getMessaging(app).send({
      token: input.token,
      notification: {
        title: input.title,
        body: input.body,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "room_booking_updates",
        },
      },
    });
    return true;
  } catch (error) {
    console.error("Unable to send push notification", error);
    return false;
  }
}
