# EasyDoc – Projektdokumentation

**Modul:** Web Technologies  
**Semester:** 4. Semester  
**Hochschule:** HTWG Konstanz  
**Abgabedatum:** Sommersemester 2026

---

## Inhaltsverzeichnis

1. [Spezifikation und Design](#1-spezifikation-und-design)
   - 1.1 Projektbeschreibung
   - 1.2 Benutzergruppen und Rollen
   - 1.3 Use Cases
   - 1.4 Nicht-funktionale Anforderungen
   - 1.5 Systemarchitektur
   - 1.6 Datenmodell
   - 1.7 UI-Design / Wireframes
2. [Implementierung](#2-implementierung)
   - 2.1 Technologiestack
   - 2.2 Projektstruktur
   - 2.3 Authentifizierung
   - 2.4 UC01 – Arztsuche (Liste & Karte)
   - 2.5 UC02 – Terminbuchung
   - 2.6 UC03 – Symptomanalyse
   - 2.7 UC04 – Profil verwalten
   - 2.8 UC05 – Admin-Nutzerverwaltung
   - 2.9 UC06 – Umsatzauswertung
   - 2.10 UC07 – Arzt-Dashboard
3. [Bereitstellung](#3-bereitstellung)
4. [Hardcodierte Werte – Begründung](#4-hardcodierte-werte--begründung)

---

## 1. Spezifikation und Design

### 1.1 Projektbeschreibung

EasyDoc ist eine webbasierte Plattform zur Arztsuche und Terminbuchung im Raum Konstanz. Patienten können Ärzte nach Fachrichtung und Ort filtern, Termine direkt online buchen und sich über eine Symptomanalyse passende Fachrichtungen empfehlen lassen. Ärzte verwalten ihre Verfügbarkeiten und Dienstleistungen über ein eigenes Dashboard. Administratoren überwachen Benutzer und den Plattformumsatz.

Das System besteht aus einer Single-Page-Applikation (Vue.js) als Frontend und einer REST-API (Spring Boot) als Backend, die über Auth0 abgesichert ist.

---

### 1.2 Benutzergruppen und Rollen

| Rolle | Beschreibung |
|-------|-------------|
| **Patient (USER)** | Kann Ärzte suchen, Termine buchen und das eigene Profil verwalten. |
| **Arzt (DOCTOR)** | Kann das eigene Profil und Praxisdaten bearbeiten sowie Verfügbarkeiten und Dienstleistungen pflegen. |
| **Admin (ADMIN)** | Hat vollständigen Zugriff auf alle Benutzer, kann Arztprofile anlegen/bearbeiten und sieht die Umsatzauswertung. |

---

### 1.3 Use Cases

#### UC01 – Arzt suchen
**Akteur:** Patient, nicht eingeloggter Besucher  
**Vorbedingung:** –  
**Beschreibung:** Der Benutzer öffnet die Arztliste oder Kartenansicht und kann nach Fachrichtung, Ort und Verfügbarkeit filtern. Jede Arztkarte zeigt Name, Fachrichtung, Bewertung und Entfernung.  
**Nachbedingung:** Der Benutzer sieht gefilterte Arztliste oder Karte mit Markern.

#### UC02 – Termin buchen
**Akteur:** Patient (eingeloggt)  
**Vorbedingung:** Benutzer ist als Patient angemeldet.  
**Beschreibung:** Der Patient wählt einen Arzt, öffnet den Kalender, wählt einen freien Tag und eine Uhrzeit, wählt optional eine Dienstleistung und bestätigt die Buchung.  
**Nachbedingung:** Termin ist in der Datenbank gespeichert, Bestätigungsseite erscheint.

#### UC03 – Symptomanalyse
**Akteur:** Patient, nicht eingeloggter Besucher  
**Vorbedingung:** –  
**Beschreibung:** Der Benutzer wählt ein oder mehrere Symptome aus einer Liste. Das System analysiert die Auswahl und empfiehlt passende Fachrichtungen sowie konkrete Ärzte mit Relevanzprozentsatz.  
**Nachbedingung:** Ergebnisliste mit Fachrichtungen und Ärzten wird angezeigt.

#### UC04 – Profil verwalten
**Akteur:** Patient, Arzt  
**Vorbedingung:** Benutzer ist eingeloggt.  
**Beschreibung:** Der Benutzer kann persönliche Daten (Name, Adresse, Versicherung, Bild) einsehen und bearbeiten. Ärzte sehen zusätzlich Praxisname, Fachrichtung, Honorar und Website.  
**Nachbedingung:** Profildaten sind aktualisiert.

#### UC05 – Admin-Nutzerverwaltung
**Akteur:** Admin  
**Vorbedingung:** Benutzer ist als Admin angemeldet.  
**Beschreibung:** Der Admin sieht eine tabellarische Übersicht aller Benutzer, kann jeden einzelnen öffnen, bearbeiten, die Rolle ändern oder löschen. Neue Ärzte können direkt angelegt werden.  
**Nachbedingung:** Benutzerdaten sind aktualisiert oder neuer Benutzer ist in der Datenbank.

#### UC06 – Umsatzauswertung
**Akteur:** Admin  
**Vorbedingung:** Benutzer ist als Admin angemeldet.  
**Beschreibung:** Der Admin sieht eine Übersicht über den monatlichen Umsatz je Arzt (10 % der Termingebühren). Filterbar nach Arztname, Fachrichtung und Jahr. Monatsverlauf als Balkendiagramm.  
**Nachbedingung:** Umsatzdaten werden gefiltert und visualisiert.

#### UC07 – Arzt-Dashboard
**Akteur:** Arzt  
**Vorbedingung:** Benutzer ist als Arzt angemeldet.  
**Beschreibung:** Der Arzt sieht seine kommenden Termine, kann Verfügbarkeiten (Regeln) und Dienstleistungen verwalten.  
**Nachbedingung:** Verfügbarkeiten und Dienstleistungen sind aktualisiert.

---

### 1.4 Nicht-funktionale Anforderungen

| Anforderung | Beschreibung |
|------------|-------------|
| **Responsiveness** | Alle Seiten sind für Desktop (>900 px), Tablet (640–900 px) und Mobilgeräte (<640 px) optimiert. Auf kleinen Bildschirmen kollabiert die Navigation in ein Dropdown-Menü hinter dem Profilicon. |
| **Sicherheit** | Alle schreibenden API-Endpunkte sowie alle authentifizierten Bereiche sind durch Auth0-JWT-Bearer-Token abgesichert. Rollenprüfung erfolgt serverseitig. |
| **Verfügbarkeit** | Frontend und Backend sind auf Render.com bzw. GitHub Pages bereitgestellt und dauerhaft erreichbar. |
| **Performance** | Die Arztliste lädt schrittweise (10 Einträge, „Mehr laden"). Geocoding für die Kartenansicht wird im Hintergrund asynchron durchgeführt und im SessionStorage gecacht. |

---

### 1.5 Systemarchitektur

```
┌─────────────────────────────────┐
│        Browser (Vue SPA)        │
│   GitHub Pages / Render CDN     │
└────────────┬────────────────────┘
             │ HTTPS / REST (JSON)
             │ Bearer Token (Auth0 JWT)
┌────────────▼────────────────────┐
│     Spring Boot REST-API        │
│     Render.com (Docker)         │
└────────────┬────────────────────┘
             │ JDBC / JPA
┌────────────▼────────────────────┐
│     MariaDB (Render Managed)    │
└─────────────────────────────────┘

         Auth0 (Okta)
  ┌───────────────────────┐
  │  Authentifizierung    │
  │  JWT-Ausstellung      │
  │  Rollenzuweisung      │
  └───────────────────────┘
```

**Kommunikation:**  
- Das Frontend spricht ausschließlich über die REST-API mit der Datenbank.
- Auth0 übernimmt Authentifizierung und Tokenvergabe. Das Backend validiert den JWT bei jedem geschützten Request.
- Die API-Basis-URL wird über die Umgebungsvariable `VITE_API_BASE_URL` zur Build-Zeit eingebettet.

---

### 1.6 Datenmodell

**Zentrale Entitäten:**

| Entität | Wichtige Felder | Beziehungen |
|---------|----------------|-------------|
| `User` | id, auth0Id, firstName, lastName, email, role (USER/DOCTOR/ADMIN), status, birthday, insurance, street, postcode, city, country, practiceName, consultationFee, rating, imageUrl | → Specialization (n:1), → DoctorAvailabilityRule (1:n), → Appointment (1:n) |
| `Appointment` | id, startDateTime, endDateTime, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), reason, rating | → User doctor (n:1), → User patient (n:1), → Dienstleistung (n:1) |
| `Specialization` | id, name | → SpecializationSymptom (1:n) |
| `Symptom` | id, bezeichnung, beschreibung | → SpecializationSymptom (1:n) |
| `SpecializationSymptom` | weight | → Specialization (n:1), → Symptom (n:1) |
| `DoctorAvailabilityRule` | id, dayOfWeek, startTime, endTime, slotDurationMinutes | → User (n:1) |
| `Dienstleistung` | id, bezeichnung, preis, scope | → User doctor (n:1) |
| `City` | id, name | – |

**Rollenlogik:** Das Feld `role` im `User`-Objekt bestimmt, welche Felder und Endpunkte zugänglich sind. `DOCTOR`-Nutzer haben zusätzlich Praxisdaten und Verfügbarkeitsregeln. `ADMIN`-Nutzer haben Zugriff auf alle Endpunkte.

---

### 1.7 UI-Design / Wireframes

Die ursprünglichen Wireframes und Mockups aus den Aufgabenblättern 1–3 wurden im Verlauf der Implementierung als Orientierung verwendet. Die tatsächliche Oberfläche weicht in Details ab (z. B. Farbschema, Layout der Karten, Navigationsstruktur), da während der Entwicklung Usability-Anpassungen vorgenommen wurden. Die Wireframes selbst wurden nicht nachträglich angepasst.

---

## 2. Implementierung

### 2.1 Technologiestack

| Bereich | Technologie | Version |
|---------|------------|---------|
| Frontend Framework | Vue 3 (Composition API) | 3.5 |
| Build-Tool | Vite | 8.0 |
| UI-Bibliothek | Vuetify 4 | 4.x |
| State Management | Pinia | 2.x |
| Routing | Vue Router 4 | 4.x |
| Authentifizierung (Frontend) | @auth0/auth0-vue | 2.x |
| Kartenansicht | Leaflet.js | 1.9 |
| Diagramme | Chart.js + vue-chartjs | 4.x |
| Sprache | TypeScript | 5.x |
| Backend Framework | Spring Boot | 3.5.5 |
| Sprache | Java | 21 |
| ORM | Spring Data JPA / Hibernate | – |
| Datenbank | MariaDB | – |
| Authentifizierung (Backend) | Okta Spring Boot Starter (Auth0) | 3.x |
| Containerisierung | Docker | – |
| Deployment Frontend | GitHub Pages | – |
| Deployment Backend | Render.com | – |

---

### 2.2 Projektstruktur

**Frontend (`easydocvue/src/`):**

```
assets/          Globale CSS-Stile, Bilder
components/      Wiederverwendbare Komponenten
  AppFooter.vue       Seitenfu&szlig;
  ContactForm.vue     Kontaktformular (Startseite)
  DoctorCard.vue      Arztkarte in der Listenansicht
  DoctorFilter.vue    Filterleiste (Fachrichtung, Ort, Sortierung)
  GoalsSection.vue    KPI-Abschnitt (Startseite)
  HeroSection.vue     Hero-Bereich mit Suchmaske (Startseite)
  MainPopup.vue       Globales Bestätigungs-/Fehlerdialogfenster
  MultiSelectDropdown.vue  Mehrfachauswahl-Dropdown
  NavBar.vue          Hauptnavigation mit mobilem Dropdown
views/           Seitenkomponenten (eine pro Route)
stores/          Pinia Stores (doctors, profile, revenue, services, symptoms, popup)
router/          Vue Router Konfiguration
utils/           Hilfsfunktionen (doctorContact, doctorFilters, userFields)
```

**Backend (`src/main/java/.../`):**

```
controller/      REST-Controller (11 Dateien)
model/           JPA-Entitäten (16 Dateien)
repository/      Spring Data JPA Repositories
service/         Geschäftslogik (AppointmentService, AvailabilityService, SymptomAnalysisService)
config/          WebConfig (CORS), SecurityConfig, DataLoader
```

---

### 2.3 Authentifizierung

Die Authentifizierung basiert vollständig auf **Auth0** (Okta):

- **Frontend:** `@auth0/auth0-vue` leitet den Benutzer bei Login-Anfragen an Auth0 weiter (Redirect-Flow). Nach erfolgreicher Anmeldung wird ein JWT-Token ausgestellt. Der Token wird bei jedem API-Call als `Authorization: Bearer <token>` mitgesendet.
- **Backend:** Der Okta Spring Boot Starter validiert den JWT bei jedem Endpunkt-Aufruf anhand des Auth0-Tenants und der konfigurierten Audience. Endpunkte ohne `@PreAuthorize` sind öffentlich zugänglich (z. B. Arztliste, Symptome).
- **Rollenweiterleitung:** Nach dem Login landet der Benutzer auf `/auth/redirect` (`RoleRedirect.vue`). Dort wird das Profil vom Backend geladen und der Benutzer je nach Rolle weitergeleitet (Patient → `/doctors`, Arzt → `/doctor/dashboard`, Admin → `/admin/users`).

---

### 2.4 UC01 – Arztsuche (Liste & Karte)

**Frontend-Dateien:** `DoctorCatalog.vue`, `MapDoctors.vue`, `DoctorCard.vue`, `DoctorFilter.vue`  
**Backend:** `DoctorController.java`, `UserRepository`  
**Store:** `doctors`

Die Arztliste (`/doctors`) zeigt Ärzte in einem 3-spaltigen Grid an. Die `DoctorFilter`-Komponente erlaubt Filterung nach Fachrichtung, Ort, maximalem Honorar, Mindestbewertung, Verfügbarkeit und frühestem Termin. Filter werden als Query-Parameter in die URL geschrieben, sodass die Suche per Link teilbar ist.

Die Kartenansicht (`/doctors/map`) nutzt **Leaflet.js** mit OpenStreetMap-Kacheln. Marker werden zunächst deterministisch um den Stadtmittelpunkt verteilt (Hash-basierter Offset) und dann asynchron über die **Nominatim Geocoding API** auf die exakte Adresse gesetzt. Geocoding-Ergebnisse werden im `sessionStorage` gecacht, um die API-Anfragen zu minimieren.

---

### 2.5 UC02 – Terminbuchung

**Frontend-Dateien:** `Booking.vue`, `SlotSelection.vue`, `BookingConfirmation.vue`  
**Backend:** `AppointmentController.java`, `DoctorAvailabilityController.java`, `AvailabilityService.java`  
**Store:** `doctors`, `services`

Der Buchungsfluss verläuft in zwei Stufen:

1. **`Booking.vue`** zeigt die Arztdetails und leitet mit einem Button zu `SlotSelection` weiter.
2. **`SlotSelection.vue`** zeigt einen monatlichen Kalender. Freie Slots werden pro Monat vom Backend geladen (`GET /api/doctors/{id}/availability`). Der Benutzer wählt einen Tag, dann eine Uhrzeit. Optional kann eine angebotene Dienstleistung ausgewählt werden. Nach Klick auf „Termin bestätigen" wird der Termin per `POST /api/appointments` gebucht.

`AvailabilityService` berechnet serverseitig aus den `DoctorAvailabilityRule`-Einträgen die freien Slots (unter Abzug bereits gebuchter Termine).

Nach erfolgreicher Buchung wird `BookingConfirmation.vue` mit Arztname und Terminzeit als Query-Parameter aufgerufen.

---

### 2.6 UC03 – Symptomanalyse

**Frontend-Datei:** `SymptomAnalysis.vue`  
**Backend:** `SymptomAnalysisController.java`, `SymptomAnalysisService.java`  
**Store:** `symptoms`

Der Benutzer wählt beliebig viele Symptome aus einer durchsuchbaren Chip-Liste. Nach Klick auf „Symptome analysieren" sendet das Frontend die gewählten Symptom-IDs an `POST /api/symptom-analysis`. Der `SymptomAnalysisService` berechnet je Fachrichtung einen Relevanzprozentsatz auf Basis der gewichteten `SpecializationSymptom`-Verknüpfungen. Das Ergebnis enthält eine geordnete Liste von Fachrichtungen und passenden Ärzten (mit frühestem freiem Termin).

Die Auswahl sowie der Analysezustand werden als URL-Query-Parameter persistiert (`?symptoms=1,4,7&analyzed=1`), sodass Ergebnisse direkt verlinkt werden können.

---

### 2.7 UC04 – Profil verwalten

**Frontend-Dateien:** `Profile.vue`, `UserOverview.vue`, `EditUser.vue`  
**Backend:** `ProfileController.java`, `UserController.java`  
**Store:** `profile`

`Profile.vue` lädt das eigene Profil über `GET /api/profile` und zeigt je nach Rolle unterschiedliche Felder. Über den Button „Profil bearbeiten" gelangt der Benutzer zu `EditUser.vue` (dieselbe Komponente wird für Admin-Bearbeitungen und Selbstbearbeitung genutzt).

`EditUser.vue` unterscheidet drei Betriebsmodi: Selbstbearbeitung (Patient/Arzt), Admin-Bearbeitung eines fremden Nutzers und Neuanlage. Die Rollenauswahl zeigt drei klickbare Karten (USER / DOCTOR / ADMIN); bei Auswahl von DOCTOR werden zusätzliche Arztfelder eingeblendet.

---

### 2.8 UC05 – Admin-Nutzerverwaltung

**Frontend-Dateien:** `AdminUsers.vue`, `UserOverview.vue`, `EditUser.vue`, `CreateDoctor.vue`  
**Backend:** `UserController.java`

Die Admin-Benutzerliste (`/admin/users`) zeigt alle Benutzer mit Suchfunktion und Rollenfilter. Jeder Eintrag ist anklickbar und öffnet `UserOverview.vue` mit vollständigen Profildetails. Von dort kann der Admin zur Bearbeitungsmaske navigieren.

`CreateDoctor.vue` ist ein vereinfachtes Formular (gegenüber `EditUser.vue`) speziell für die Neuanlage von Arzt-Profilen durch Admins.

---

### 2.9 UC06 – Umsatzauswertung

**Frontend-Datei:** `AdminRevenue.vue`  
**Backend:** `AdminRevenueController.java`  
**Store:** `revenue`

`GET /api/admin/revenue?year={year}` liefert je Arzt und Monat: Anzahl abgerechneter Termine und den Plattformanteil (10 % des Honorars). Das Frontend aggregiert die Einträge clientseitig nach Arzt und stellt den Monatsverlauf als Balkendiagramm (Chart.js) dar. Die Tabelle ist nach Umsatz sortierbar. Filterung nach Arztname und Fachrichtung erfolgt ebenfalls clientseitig.

---

### 2.10 UC07 – Arzt-Dashboard

**Frontend-Datei:** `DoctorDashboard.vue`  
**Backend:** `DoctorAvailabilityController.java`, `DienstleistungController.java`, `AppointmentController.java`

Das Dashboard zeigt dem Arzt seine kommenden Termine sowie seine Verfügbarkeitsregeln (Wochentag, Start-/Endzeit, Slot-Dauer). Regeln können hinzugefügt und gelöscht werden. Ebenso können Dienstleistungen (Name + Preis) verwaltet werden, die Patienten bei der Buchung auswählen können.

---

## 3. Bereitstellung

### URLs

| Komponente | URL |
|-----------|-----|
| **Frontend** | `https://htwg-in-schneider.github.io/frontend-easydoc/` |
| **Backend API** | `https://easydoc-backend.onrender.com` |

> **Hinweis:** Das Backend läuft auf dem kostenlosen Render-Tier. Bei Inaktivität wird der Container nach 15 Minuten in den Schlafmodus versetzt. Der erste Request nach einer Pause kann bis zu 30 Sekunden dauern.

---

### Zugangsdaten

Alle Benutzer melden sich über Auth0 an (Klick auf „Mit Auth0 einloggen" auf der Login-Seite).

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| **Patient** | `[patient-email@example.com]` | `[Passwort]` |
| **Arzt** | `[arzt-email@example.com]` | `[Passwort]` |
| **Admin** | `admin@easydoc.com` | `[Passwort]` |

> **Hinweis:** Die konkreten Passwörter sind in Auth0 hinterlegt und müssen hier manuell eingetragen werden.

---

## 4. Hardcodierte Werte – Begründung

Während der Entwicklung wurde angestrebt, sensible Konfigurationswerte über Umgebungsvariablen zu injizieren. Einige Werte wurden jedoch bewusst fest eingetragen. Diese Entscheidungen werden im Folgenden begründet.

### Übersicht

| Wert | Datei | Typ |
|------|-------|-----|
| Auth0 Issuer-URL | `application.properties` | Konfiguration |
| Auth0 Audience | `application.properties` | Konfiguration |
| CORS-Ursprungs-URL | `WebConfig.java` | Konfiguration |
| Auth0 Subject-IDs der Testnutzer | `DataLoader.java` | Testdaten |
| Seed-Daten (Fachrichtungen, Symptome) | `DataLoader.java` | Initialdaten |

---

### Auth0 Issuer-URL (`https://dev-82ivehau8nyx88ek.us.auth0.com/`)

**Datei:** `src/main/resources/application.properties`

Die Issuer-URL identifiziert den Auth0-Tenant (Mandanten) des Projekts. Sie ist kein Geheimnis – sie ist in jedem ausgestellten JWT öffentlich sichtbar. Eine Auslagerung in eine Umgebungsvariable würde keinen Sicherheitsvorteil bringen.

Der Tenant wurde eigens für dieses Projekt angelegt. Die URL ändert sich nicht, solange dasselbe Auth0-Konto verwendet wird. Eine Parametrisierung wäre nur sinnvoll, wenn das Projekt zwischen mehreren Auth0-Tenants wechseln müsste (z. B. Dev / Staging / Prod) – was im Rahmen dieses Studienprojekts nicht der Fall ist.

---

### Auth0 Audience (`https://easydoc.api`)

**Datei:** `src/main/resources/application.properties`

Die Audience ist ein frei gewählter Bezeichner, der die API innerhalb von Auth0 identifiziert. Er ist in der Auth0-Konfiguration fest hinterlegt und muss mit dem Frontend übereinstimmen. Auch dieser Wert ist kein Geheimnis und ändert sich nicht. Eine Parametrisierung wäre nur bei einem Multi-Tenant-Setup notwendig.

---

### CORS-Ursprungs-URL (WebConfig)

**Datei:** `src/main/java/.../config/WebConfig.java`

Die erlaubte CORS-Herkunft wurde vom betreuenden Dozenten vorgegeben und soll unverändert bleiben. Da es sich um eine feste Projektvorgabe handelt, wurde dieser Wert nicht in eine Umgebungsvariable ausgelagert.

---

### Auth0 Subject-IDs der Testnutzer (DataLoader)

**Datei:** `src/main/java/.../config/DataLoader.java`

Der `DataLoader` befüllt die Datenbank beim ersten Start mit Testnutzern. Die `auth0Id`-Felder dieser Nutzer (z. B. `auth0|6a1422a2dafc1c6a975c067a`) sind fest eingetragen, weil sie echten Auth0-Accounts entsprechen, die eigens für Demo- und Testzwecke in unserem Auth0-Tenant angelegt wurden.

Diese IDs können nicht generisch sein – Auth0 verknüpft einen eingehenden JWT über die `sub`-Claim mit dem passenden Datenbankdatensatz. Würden die IDs bei jedem Deployment neu generiert, wäre kein Login dieser Testnutzer mehr möglich. Die Hardcodierung ist daher **absichtlich und notwendig**.

---

### Seed-Daten (Fachrichtungen, Symptome, Terminbeispiele)

**Datei:** `src/main/java/.../config/DataLoader.java`

Fachrichtungen (z. B. „Kardiologie", „Allgemeinmedizin"), Symptome und deren Gewichtungen sind fest hinterlegt, da sie die fachliche Grundlage der Symptomanalyse bilden. Ohne diese Daten wäre die Anwendung nicht demonstrationsfähig. Es handelt sich um inhaltliche Initialdaten ohne Sicherheitsrelevanz – vergleichbar mit Migrations-Seed-Daten in produktiven Projekten.
