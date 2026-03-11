import webpush from "web-push";

// VAPID Keys aus Umgebungsvariablen
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

// VAPID Details konfigurieren
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Sendet eine Push-Benachrichtigung
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; data?: any }
): Promise<void> {
  if (!publicKey || !privateKey) {
    console.warn("VAPID Keys nicht konfiguriert. Push-Benachrichtigung wird nicht gesendet.");
    return;
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: payload.data,
      })
    );
  } catch (error: any) {
    console.error("Fehler beim Senden der Push-Benachrichtigung:", error);
    
    // Wenn Subscription ungültig ist (410), sollte sie aus der DB entfernt werden
    if (error.statusCode === 410) {
      throw new Error("SUBSCRIPTION_EXPIRED");
    }
    throw error;
  }
}

export { publicKey as vapidPublicKey };
