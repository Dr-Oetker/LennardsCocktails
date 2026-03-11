# 🍺 Bestell-App – Projektkonzept

## Überblick

Eine private Web-App, mit der Gäste bei einer Party per QR-Code oder Link Getränke bestellen können. Der Gastgeber erhält eine Web-Push-Benachrichtigung und sieht alle Bestellungen live in einer Admin-Übersicht.

---

## Zielgruppe & Kontext

- **Gastgeber:** Einziger Nutzer des Admin-Bereichs, bedient die App von seinem iPhone
- **Gäste:** Privater Freundeskreis, scannen einen QR-Code oder öffnen einen Link
- **Nutzungskontext:** Zuhause, privat – kein kommerzieller Einsatz

---

## Zwei Bereiche

### 1. Gäste-Bereich (öffentlich)
- Aufruf per einzigartiger URL oder QR-Code
- Getränkekarte mit allen verfügbaren Getränken (Name + Zutaten ohne Mengenangabe, kein Preis, kein Rezept)
- Mehrere Getränke gleichzeitig auswählbar
- Name des Gastes eingeben
- Bestellung absenden → einfache Bestätigungsseite ("Deine Bestellung wurde aufgegeben!")
- Keine Einschränkung: Gäste können beliebig oft bestellen
- Sprache: **Deutsch**

### 2. Admin-Bereich (nur Gastgeber)
- Erreichbar unter einer festen URL (z. B. `/admin`)
- Geschützt durch ein **einfaches Passwort**
- Sprache: Deutsch

---

## Features im Detail

### Party-Verwaltung
- Neue Party anlegen (Name, z. B. "Sommerparty 2025")
- Jede Party bekommt eine **eindeutige URL** (z. B. `/party/sommerparty-2025`)
- Automatische **QR-Code-Generierung** pro Party (anzeigbar & downloadbar)
- Party kann als **aktiv/inaktiv** markiert werden
- **Archiv:** Liste aller vergangenen Partys mit deren Bestellungen einsehbar

### Globale Getränke-Datenbank (Admin)
- Zentrales Menü, das unabhängig von Partys gepflegt wird
- Pro Getränk: **Name** + **Zutaten-Liste** (z. B. Cola, Rum, Limette) + **Rezept** (nur für Admin sichtbar)
- Getränke können jederzeit hinzugefügt, bearbeitet oder entfernt werden
- Dient als "Vorlage" für alle Partys

### Menü-Auswahl (pro Party)
- Beim Anlegen einer neuen Party wählt der Admin aus der globalen Datenbank aus, welche Getränke verfügbar sein sollen
- Keine party-spezifischen Anpassungen – es gelten immer die globalen Angaben
- Getränkeliste kann nachträglich im Admin angepasst werden (Getränke hinzufügen/entfernen)

### Bestellvorgang (Gast)
1. QR-Code scannen oder Link öffnen
2. Getränke auswählen (Mehrfachauswahl möglich)
3. Namen eingeben
4. Absenden
5. Bestätigungsseite wird angezeigt

### Live-Bestellübersicht (Admin)
- Zeigt alle Bestellungen der aktuell aktiven Party in Echtzeit
- Automatische Aktualisierung ohne manuellen Seitenreload
- Darstellung: Uhrzeit | Gastname | Bestellte Getränke

### Push-Benachrichtigungen
- **Technologie:** Web Push API (PWA)
- Bei jeder neuen Bestellung erhält der Gastgeber eine Push-Benachrichtigung
- Inhalt der Benachrichtigung: Gastname + bestellte Getränke

> ⚠️ **Wichtig für iPhone:** Web Push über Safari erfordert, dass die App einmalig als PWA zum Home-Bildschirm hinzugefügt wird (iOS 16.4+). Danach funktionieren Push-Benachrichtigungen zuverlässig. Die Benachrichtigungen müssen einmalig im Browser erlaubt werden.

---

## Tech-Stack

| Bereich | Technologie | Begründung |
|---|---|---|
| Framework | **Next.js** | Fullstack in einem Projekt, API Routes, SSR |
| Styling | **Tailwind CSS** | Modern, utility-first, schnell |
| Datenbank | **PostgreSQL** | Robust, Coolify-nativ, kein Locking-Problem |
| ORM | **Prisma** | Einfache DB-Anbindung in Next.js |
| Push | **Web Push API** (PWA) | Kein Drittanbieter, funktioniert auf iOS 16.4+ |
| Realtime | **Server-Sent Events** oder **Polling** | Für Live-Übersicht im Admin |
| QR-Code | **qrcode** (npm-Paket) | Einfache QR-Generierung clientseitig |

---

## Hosting & Deployment

- **Server:** Eigener Cloud-Server mit **Coolify**
- **Deployment:** Docker-Container via Coolify
- **Datenbank:** PostgreSQL-Instanz direkt in Coolify anlegen (ein Klick)
- **Dockerfile** wird im Projekt mitgeliefert
- Empfohlene Projektstruktur für Coolify: Monorepo (eine Next.js App, eine Postgres-Instanz)

---

## Projektstruktur (Next.js)

```
/
├── app/
│   ├── page.tsx                    # Weiterleitung zu /admin
│   ├── admin/
│   │   ├── page.tsx                # Login
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Party-Übersicht + Archiv
│   │   ├── drinks/
│   │   │   └── page.tsx            # Globale Getränke-Datenbank verwalten
│   │   └── party/[id]/
│   │       └── page.tsx            # Getränke-Auswahl + Live-Bestellübersicht + QR-Code
│   └── party/[slug]/
│       └── page.tsx                # Gäste-Bestellseite
├── app/api/
│   ├── orders/route.ts             # Bestellung aufgeben
│   ├── parties/route.ts            # Partys verwalten
│   └── push/route.ts               # Push-Benachrichtigung senden
├── components/
├── lib/
│   ├── db.ts                       # Prisma Client
│   └── push.ts                     # Web Push Logik
├── prisma/
│   └── schema.prisma               # Datenbankschema
├── public/
│   └── manifest.json               # PWA Manifest
└── Dockerfile
```

---

## Datenbankschema (Prisma)

```prisma
model Drink {
  id          String       @id @default(cuid())
  name        String
  ingredients String[]     // Zutaten-Liste (ohne Mengenangabe)
  recipe      String?      // Rezept (nur Admin sichtbar)
  parties     PartyDrink[]
}

model Party {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  isActive  Boolean      @default(true)
  createdAt DateTime     @default(now())
  drinks    PartyDrink[]
  orders    Order[]
}

// Verknüpfungstabelle: welche Getränke sind bei welcher Party verfügbar
model PartyDrink {
  party   Party  @relation(fields: [partyId], references: [id])
  partyId String
  drink   Drink  @relation(fields: [drinkId], references: [id])
  drinkId String

  @@id([partyId, drinkId])
}

model Order {
  id        String      @id @default(cuid())
  guestName String
  createdAt DateTime    @default(now())
  party     Party       @relation(fields: [partyId], references: [id])
  partyId   String
  items     OrderItem[]
}

model OrderItem {
  id      String @id @default(cuid())
  drink   Drink  @relation(fields: [drinkId], references: [id])
  drinkId String
  order   Order  @relation(fields: [orderId], references: [id])
  orderId String
}
```

---

## Entwicklung mit Cursor – Empfohlene Reihenfolge

1. Next.js Projekt initialisieren (`npx create-next-app`)
2. Prisma + PostgreSQL einrichten (lokal mit Docker oder Coolify-Dev-DB)
3. Globale Getränke-Datenbank: CRUD für Getränke mit Zutaten & Rezept
4. Admin-Bereich: Login, Party anlegen, Getränke aus globalem Menü auswählen
5. Gäste-Seite: Getränkeauswahl (Name + Zutaten), Bestellformular, Bestätigung
6. Push-Benachrichtigungen: VAPID Keys generieren, Service Worker einrichten
7. Live-Übersicht: Server-Sent Events oder Polling implementieren
8. PWA-Manifest + Service Worker für iOS-Kompatibilität
9. Dockerfile erstellen und auf Coolify deployen

---

## Offene Punkte / Mögliche spätere Erweiterungen

- Getränke-Kategorien (Bier, Wein, Softdrinks) – aktuell nicht vorgesehen, leicht nachrüstbar
- Bestellungen als CSV exportieren – aktuell nicht vorgesehen, leicht nachrüstbar
- Mehrere Admin-Nutzer – aktuell nicht nötig
- Dark Mode – optional
