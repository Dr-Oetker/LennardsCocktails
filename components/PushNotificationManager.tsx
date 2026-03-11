"use client";

import { useEffect, useState } from "react";

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Prüfe ob Push-Benachrichtigungen unterstützt werden
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      loadPublicKey();
      checkSubscription();
      
      // Service Worker registrieren (für PWA)
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(console.error);
    }
  }, []);

  const loadPublicKey = async () => {
    try {
      const response = await fetch("/api/push/vapid-public-key");
      const data = await response.json();
      
      if (!data.publicKey) {
        console.error("VAPID Public Key nicht verfügbar:", data);
        return;
      }
      
      console.log("VAPID Public Key geladen:", {
        length: data.publicKey.length,
        prefix: data.publicKey.substring(0, 20),
      });
      
      setPublicKey(data.publicKey);
    } catch (error) {
      console.error("Fehler beim Laden des VAPID Public Keys:", error);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Fehler beim Prüfen der Subscription:", error);
    }
  };

  const subscribeToPush = async () => {
    if (!publicKey) {
      alert("VAPID Public Key nicht verfügbar. Bitte konfiguriere VAPID Keys in der .env Datei.");
      return;
    }

    try {
      // Prüfe ob Service Worker bereits registriert ist
      let registration = await navigator.serviceWorker.getRegistration("/");
      
      if (!registration) {
        // Service Worker registrieren
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        
        // Warten bis Service Worker aktiv ist
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Service Worker konnte nicht aktiviert werden"));
          }, 10000); // 10 Sekunden Timeout
          
          if (registration!.installing) {
            registration!.installing.addEventListener("statechange", function () {
              if (this.state === "installed" || this.state === "activated") {
                clearTimeout(timeout);
                resolve();
              }
            });
          } else if (registration!.waiting) {
            // Service Worker wartet - aktiviere ihn
            registration!.waiting.postMessage({ type: "SKIP_WAITING" });
            clearTimeout(timeout);
            resolve();
          } else if (registration!.active) {
            clearTimeout(timeout);
            resolve();
          } else {
            clearTimeout(timeout);
            resolve();
          }
        });
      }

      // Warte auf ready (stellt sicher, dass Service Worker aktiv ist)
      const activeRegistration = await navigator.serviceWorker.ready;
      
      console.log("Service Worker Status:", {
        installing: activeRegistration.installing?.state,
        waiting: activeRegistration.waiting?.state,
        active: activeRegistration.active?.state,
      });

      // Validiere Public Key Format
      if (!publicKey || publicKey.length < 80) {
        throw new Error("VAPID Public Key scheint ungültig zu sein. Bitte generiere neue Keys mit 'npm run generate-vapid-keys'");
      }

      // Prüfe ob bereits eine Subscription existiert
      let subscription = await activeRegistration.pushManager.getSubscription();
      
      if (subscription) {
        console.log("Bestehende Subscription gefunden");
        // Verwende bestehende Subscription
      } else {
        // Push-Subscription erstellen
        console.log("Erstelle neue Push-Subscription...");
        console.log("Public Key Details:", {
          length: publicKey.length,
          firstChars: publicKey.substring(0, 20),
          lastChars: publicKey.substring(publicKey.length - 10),
        });
        
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        
        // Prüfe ob PushManager verfügbar ist
        if (!activeRegistration.pushManager) {
          throw new Error("PushManager nicht verfügbar. Browser unterstützt möglicherweise keine Push-Benachrichtigungen.");
        }
        
        try {
          subscription = await activeRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          });
          
          console.log("Push-Subscription erfolgreich erstellt:", {
            endpoint: subscription.endpoint.substring(0, 50) + "...",
            hasKeys: !!(subscription.getKey && subscription.getKey("p256dh")),
          });
        } catch (subscribeError: any) {
          console.error("Fehler bei pushManager.subscribe:", subscribeError);
          throw subscribeError;
        }
      }

      if (!subscription) {
        throw new Error("Subscription konnte nicht erstellt werden");
      }

      // Subscription an Server senden
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        alert("Push-Benachrichtigungen aktiviert! Du wirst nun über neue Bestellungen benachrichtigt.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Fehler beim Speichern der Subscription");
      }
    } catch (error: any) {
      console.error("Fehler beim Abonnieren von Push-Benachrichtigungen:", error);
      
      let errorMessage = "Fehler beim Aktivieren von Push-Benachrichtigungen.";
      
      if (error.name === "NotAllowedError") {
        errorMessage = "Push-Benachrichtigungen wurden blockiert. Bitte erlaube sie in den Browser-Einstellungen.";
      } else if (error.name === "AbortError") {
        if (error.message.includes("push service error")) {
          errorMessage = "Push-Service Fehler. Stelle sicher, dass:\n- Du HTTPS verwendest (oder localhost)\n- Die VAPID Keys korrekt konfiguriert sind\n- Dein Browser Push-Benachrichtigungen unterstützt";
        } else {
          errorMessage = `Service Worker Fehler: ${error.message}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("Details:", {
        name: error.name,
        message: error.message,
        publicKey: publicKey ? `${publicKey.substring(0, 20)}...` : "nicht gesetzt",
      });
      
      alert(errorMessage);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        alert("Push-Benachrichtigungen deaktiviert.");
      }
    } catch (error) {
      console.error("Fehler beim Deabonnieren von Push-Benachrichtigungen:", error);
    }
  };

  // Helper: Konvertiere VAPID Public Key von Base64 URL zu Uint8Array
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    try {
      // Entferne mögliche Leerzeichen
      const cleaned = base64String.trim();
      
      // Base64 URL zu Standard Base64 konvertieren
      const padding = "=".repeat((4 - (cleaned.length % 4)) % 4);
      const base64 = (cleaned + padding).replace(/-/g, "+").replace(/_/g, "/");
      
      // Base64 zu Binary konvertieren
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      
      console.log("VAPID Key konvertiert:", {
        originalLength: cleaned.length,
        convertedLength: outputArray.length,
        firstBytes: Array.from(outputArray.slice(0, 5)),
      });
      
      return outputArray;
    } catch (error) {
      console.error("Fehler bei VAPID Key Konvertierung:", error);
      throw new Error("VAPID Public Key Format ungültig");
    }
  }

  if (!isSupported) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6 p-4 sm:p-5 bg-white border border-[#e5e3e0] rounded-lg">
      <h3 className="font-semibold text-[#1a1a1a] mb-3 text-sm sm:text-base">Push-Benachrichtigungen</h3>
      {!publicKey ? (
        <p className="text-sm text-[#6b6b6b]">
          VAPID Keys nicht konfiguriert. Bitte setze VAPID_PUBLIC_KEY und VAPID_PRIVATE_KEY in der .env Datei.
        </p>
      ) : isSubscribed ? (
        <div>
          <p className="text-sm text-[#6b6b6b] mb-3">
            Push-Benachrichtigungen sind aktiviert. Du wirst über neue Bestellungen benachrichtigt.
          </p>
          <button
            onClick={unsubscribeFromPush}
            className="px-4 py-2 bg-white border border-[#e5e3e0] text-[#1a1a1a] rounded-lg hover:bg-[#faf9f7] transition-colors text-sm font-medium"
          >
            Deaktivieren
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#6b6b6b] mb-3">
            Aktiviere Push-Benachrichtigungen, um sofort über neue Bestellungen informiert zu werden.
          </p>
          <button
            onClick={subscribeToPush}
            className="px-4 py-2 bg-[#c9732f] text-white rounded-lg hover:bg-[#b86528] transition-colors text-sm font-medium"
          >
            Aktivieren
          </button>
        </div>
      )}
    </div>
  );
}
