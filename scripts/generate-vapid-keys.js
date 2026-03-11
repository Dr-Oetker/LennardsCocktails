// Script zum Generieren von VAPID Keys für Web Push
const webpush = require("web-push");

console.log("Generiere VAPID Keys für Web Push...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("VAPID Keys generiert!\n");
console.log("Füge diese in deine .env Datei ein:\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey);
console.log("VAPID_SUBJECT=mailto:deine-email@example.com\n");
console.log("Wichtig: NEXT_PUBLIC_VAPID_PUBLIC_KEY muss mit NEXT_PUBLIC_ beginnen,");
console.log("damit es im Client verfügbar ist!");
