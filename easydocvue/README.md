# EasyDoc Frontend

Vue 3 + Vuetify + TypeScript Frontend für EasyDoc.

## Voraussetzungen

- Node.js 18+
- npm
- **Backend muss bereits laufen** (siehe `backend_easydoc/README.md`)

## Starten

1. Terminal öffnen und ins Projektverzeichnis wechseln:

   ```bash
   cd frontend_easydoc/easydocvue
   ```

2. Abhängigkeiten installieren (nur beim ersten Mal oder nach Änderungen in `package.json`):

   ```bash
   npm install
   ```

3. Dev-Server starten:

   ```bash
   npm run dev
   ```

4. Warten bis in der Konsole erscheint:

   ```
   VITE ready in XXX ms
   ➜  Local: http://localhost:3000/easydocvue/
   ```

   > Falls Port 3000 belegt ist, wählt Vite automatisch den nächsten freien Port.

## Verfügbare Scripts

| Script               | Beschreibung                  |
|----------------------|-------------------------------|
| `npm run dev`        | Dev-Server starten            |
| `npm run build`      | Produktions-Build erstellen   |
| `npm run preview`    | Build lokal voranschauen      |
| `npm run type-check` | TypeScript-Typen prüfen       |

## Projektstruktur

- `src/main.ts` — Einstiegspunkt
- `src/App.vue` — Root-Komponente
- `src/components/` — Wiederverwendbare Komponenten
- `src/plugins/` — Plugin-Setup (Vuetify, Router, etc.)
- `src/styles/` — Globale Styles und Theme

## Stack

- Framework: Vue 3 + Vite
- UI Library: Vuetify
- Sprache: TypeScript
- Package Manager: npm
