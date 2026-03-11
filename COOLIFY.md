# 🐳 Coolify Deployment Guide

Schritt-für-Schritt Anleitung zum Deployen der App auf Coolify.

## Voraussetzungen

- Coolify installiert und laufend
- Git-Repository mit deinem Code
- Supabase-Projekt erstellt

## Schritt 1: Supabase-Datenbank einrichten

1. Erstelle ein Supabase-Projekt auf [supabase.com](https://supabase.com)
2. Gehe zu Settings → Database
3. Kopiere die **Connection Pooling URL** (Session mode, Port 6543)

## Schritt 2: PostgreSQL in Coolify erstellen (optional)

Alternativ kannst du auch eine PostgreSQL-Instanz direkt in Coolify erstellen:

1. In Coolify: **Resources** → **PostgreSQL**
2. Neue Instanz erstellen
3. Connection String kopieren

## Schritt 3: App in Coolify hinzufügen

1. In Coolify: **Applications** → **New Resource**
2. Wähle **Git Repository**
3. Verbinde dein Git-Repository
4. Wähle den Branch (z.B. `main`)

## Schritt 4: Umgebungsvariablen setzen

In Coolify unter **Environment Variables** folgende Variablen setzen:

```env
# Node.js Version (WICHTIG für Prisma 7.5.0!)
NIXPACKS_NODE_VERSION="20"

# Datenbank
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Admin
ADMIN_PASSWORD="dein-sicheres-passwort"

# VAPID Keys (optional, für Push-Benachrichtigungen)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:deine-email@example.com"

# Node Environment
NODE_ENV="production"
```

**Wichtig:** `NIXPACKS_NODE_VERSION="20"` muss gesetzt werden, damit Prisma 7.5.0 funktioniert (benötigt Node.js 20.19+ oder 22.12+).

**Wichtig:** 
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` muss mit `NEXT_PUBLIC_` beginnen
- Verwende starke Passwörter für `ADMIN_PASSWORD`

## Schritt 5: Build-Konfiguration

In Coolify unter **Build Settings**:

- **Build Pack:** Docker
- **Dockerfile:** `Dockerfile` (sollte automatisch erkannt werden)
- **Build Command:** (leer lassen, Dockerfile übernimmt)
- **Start Command:** (leer lassen, Dockerfile übernimmt)

## Schritt 6: Deployen

1. Klicke auf **Deploy**
2. Warte bis der Build abgeschlossen ist
3. Nach dem ersten Deployment: Migrationen ausführen

## Schritt 7: Migrationen ausführen

Nach dem ersten Deployment musst du die Datenbank-Migrationen ausführen:

**Option 1: Über Coolify Terminal**
1. Öffne das Terminal der App in Coolify
2. Führe aus: `npx prisma migrate deploy`

**Option 2: Lokal**
```bash
# Setze DATABASE_URL temporär
export DATABASE_URL="deine-production-database-url"

# Führe Migrationen aus
npx prisma migrate deploy
```

## Schritt 8: App testen

1. Öffne die App-URL (wird in Coolify angezeigt)
2. Gehe zu `/admin`
3. Logge dich mit deinem `ADMIN_PASSWORD` ein
4. Teste die Funktionalität

## Troubleshooting

### Domain ist nicht erreichbar

**DNS prüfen:**
```bash
nslookup order.lk-datagroup.de
# Sollte die IP-Adresse deines Coolify-Servers zeigen
```

**In Coolify prüfen:**
1. Gehe zu deiner App → **Domains**
2. Stelle sicher, dass `order.lk-datagroup.de` hinzugefügt ist
3. Prüfe, ob SSL-Zertifikat generiert wurde (kann einige Minuten dauern)
4. Prüfe die Logs der App (App → Logs)

**Häufige Probleme:**
- Domain wurde noch nicht in Coolify hinzugefügt
- SSL-Zertifikat wird noch generiert (warte 2-5 Minuten)
- App läuft nicht (prüfe Logs)
- Port 3000 ist nicht exponiert (prüfe Port-Konfiguration in Coolify)

### Migrationen schlagen fehl
- Prüfe ob `DATABASE_URL` korrekt gesetzt ist
- Prüfe ob die Datenbank erreichbar ist
- Führe Migrationen manuell aus (siehe Schritt 7)

### App startet nicht
- Prüfe die Logs in Coolify (App → Logs)
- Stelle sicher, dass alle Umgebungsvariablen gesetzt sind
- Prüfe ob der Port 3000 verfügbar ist
- Prüfe ob die App erfolgreich deployed wurde (Build-Logs)

### Push-Benachrichtigungen funktionieren nicht
- Stelle sicher, dass die App über HTTPS läuft
- Prüfe ob VAPID Keys korrekt gesetzt sind
- Für iOS: App muss als PWA installiert sein

## Nach dem Deployment

- **Backup:** Stelle sicher, dass Supabase automatische Backups aktiviert hat
- **Monitoring:** Überwache die Logs in Coolify
- **Updates:** Bei Code-Änderungen wird automatisch neu deployed (wenn Git-Hook aktiviert)

## Wichtige Hinweise

- Die App läuft im `standalone` Modus für optimale Performance
- Prisma Client wird beim Build generiert
- Service Worker wird automatisch registriert
- Push-Benachrichtigungen benötigen HTTPS
