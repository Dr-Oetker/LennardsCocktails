# 🍹 Lennards Cocktails - Bestell-App

Eine private Web-App, mit der Gäste bei einer Party per QR-Code oder Link Getränke bestellen können.

## 🚀 Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Supabase einrichten

1. **Supabase-Projekt erstellen:**
   - Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
   - Erstelle ein neues Projekt
   - Warte, bis das Projekt bereit ist

2. **Datenbank-URL kopieren:**
   - Gehe in dein Supabase-Projekt → Settings → Database
   - Kopiere die "Connection string" unter "Connection pooling" (Session mode)
   - Die URL sieht so aus: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`

3. **`.env` Datei erstellen:**
   ```bash
   cp .env.example .env
   ```

4. **DATABASE_URL in `.env` setzen:**
   ```env
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   
   **Wichtig:** Verwende die Connection Pooling URL (Port 6543) für bessere Performance in Production.

5. **Migrationen ausführen:**
   ```bash
   npx prisma migrate dev --name init
   ```
   
   Dies erstellt alle Tabellen in deiner Supabase-Datenbank.

6. **VAPID Keys für Push-Benachrichtigungen generieren (optional):**
   ```bash
   npm run generate-vapid-keys
   ```
   
   Kopiere die generierten Keys in deine `.env` Datei:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   VAPID_SUBJECT="mailto:deine-email@example.com"
   ```
   
   **Wichtig:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` muss mit `NEXT_PUBLIC_` beginnen, damit es im Client verfügbar ist.

### 3. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## 📁 Projektstruktur

- `app/` - Next.js App Router Seiten
- `app/api/` - API Routes
- `components/` - React Komponenten
- `lib/` - Utilities (Prisma Client, Push Notifications)
- `prisma/` - Prisma Schema und Migrationen

## 🔐 Admin-Zugang

Standardmäßig ist der Admin-Bereich unter `/admin` erreichbar. Das Passwort wird über die Umgebungsvariable `ADMIN_PASSWORD` gesetzt.

## 🔔 Push-Benachrichtigungen

Die App unterstützt Web Push-Benachrichtigungen, um den Gastgeber über neue Bestellungen zu informieren.

**Setup:**
1. Generiere VAPID Keys mit `npm run generate-vapid-keys`
2. Füge die Keys in deine `.env` Datei ein
3. Im Admin-Dashboard kannst du Push-Benachrichtigungen aktivieren
4. **Für iOS:** Die App muss als PWA zum Home-Bildschirm hinzugefügt werden (iOS 16.4+)

**Hinweis:** Push-Benachrichtigungen funktionieren nur über HTTPS (oder localhost für Entwicklung).

## 📱 PWA (Progressive Web App)

Die App kann als PWA installiert werden, besonders wichtig für iOS-Geräte.

### Icons erstellen

Für die PWA benötigst du Icons:
- `/public/icon-192x192.png` (192x192 Pixel)
- `/public/icon-512x512.png` (512x512 Pixel)

**Optionen:**
1. Verwende ein Online-Tool wie [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Erstelle die Icons in einem Design-Tool (Figma, Canva, etc.)
3. Verwende das SVG-Icon (`/public/icon.svg`) als Basis

**Wichtig für iOS:**
- Icon sollte quadratisch sein
- Keine Transparenz (iOS fügt automatisch abgerundete Ecken hinzu)
- Mindestens 192x192 Pixel

### iOS Installation

1. Öffne die App in Safari auf deinem iPhone
2. Tippe auf das "Teilen"-Symbol (Quadrat mit Pfeil nach oben)
3. Wähle "Zum Home-Bildschirm"
4. Die App wird als Icon auf dem Home-Bildschirm installiert
5. **Wichtig:** Push-Benachrichtigungen funktionieren nur, wenn die App vom Home-Bildschirm geöffnet wird (nicht aus Safari)

### Android Installation

1. Öffne die App in Chrome
2. Tippe auf das Menü (3 Punkte)
3. Wähle "Zur Startseite hinzufügen" oder "App installieren"
4. Die App wird als PWA installiert

## 🐳 Deployment mit Coolify

Siehe die ausführliche Anleitung in [COOLIFY.md](./COOLIFY.md)

**Kurzfassung:**
1. Erstelle die `.env` Datei mit deiner Supabase `DATABASE_URL`
2. Setze alle Umgebungsvariablen in Coolify (DATABASE_URL, ADMIN_PASSWORD, VAPID Keys, etc.)
3. Verbinde dein Git-Repository mit Coolify
4. Deploye die App (Dockerfile wird automatisch verwendet)
5. Nach dem ersten Deployment führe die Migrationen aus:
   ```bash
   npx prisma migrate deploy
   ```

**Hinweis:** Supabase funktioniert sowohl lokal als auch in Production - du kannst die gleiche Datenbank verwenden oder separate Projekte für Dev/Prod anlegen.
