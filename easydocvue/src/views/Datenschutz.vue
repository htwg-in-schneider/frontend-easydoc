<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <NavBar />
  <main class="legal-page">
    <div class="legal-container">
      <h1>Datenschutzerklärung</h1>

      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          EasyDoc GmbH, Musterstraße 123, 10115 Berlin<br />
          E-Mail: info@easydoc.de | Telefon: +49 30 12345678
        </p>
      </section>

      <section>
        <h2>2. Erhobene Daten</h2>
        <p>Wir verarbeiten folgende personenbezogene Daten:</p>
        <ul>
          <li>Registrierungsdaten (Name, E-Mail-Adresse, Passwort)</li>
          <li>Profildaten (Geburtsdatum, Adresse, Versicherungsinformationen)</li>
          <li>Terminbuchungsdaten (Arzt, Datum, Uhrzeit, Beschwerden)</li>
          <li>Nutzungsdaten (IP-Adresse, Browser, Seitenaufrufe)</li>
        </ul>
      </section>

      <section>
        <h2>3. Zweck der Verarbeitung</h2>
        <p>Ihre Daten werden ausschließlich für folgende Zwecke genutzt:</p>
        <ul>
          <li>Bereitstellung und Verwaltung Ihres Nutzerkontos</li>
          <li>Vermittlung und Verwaltung von Arztterminen</li>
          <li>Kommunikation (Terminbestätigungen, Erinnerungen)</li>
          <li>Verbesserung unserer Dienste (anonymisierte Auswertungen)</li>
        </ul>
      </section>

      <section>
        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          Gesundheitsbezogene Daten werden nur mit Ihrer ausdrücklichen Einwilligung gemäß
          Art. 9 Abs. 2 lit. a DSGVO verarbeitet.
        </p>
      </section>

      <section>
        <h2>5. Datenweitergabe</h2>
        <p>
          Ihre Daten werden nur an die von Ihnen ausgewählten Ärzte sowie technische
          Dienstleister (Hosting, Authentifizierung) weitergegeben, die vertraglich zur
          Einhaltung des Datenschutzes verpflichtet sind. Eine Weitergabe an Dritte zu
          Werbezwecken findet nicht statt.
        </p>
      </section>

      <section>
        <h2>6. Speicherdauer</h2>
        <p>
          Ihre Daten werden gelöscht, sobald sie für den Verarbeitungszweck nicht mehr
          benötigt werden. Kontodaten werden spätestens 30 Tage nach Löschung Ihres Kontos
          entfernt. Gesetzliche Aufbewahrungspflichten bleiben unberührt.
        </p>
      </section>

      <section>
        <h2>7. Ihre Rechte</h2>
        <p>Sie haben jederzeit das Recht auf:</p>
        <ul>
          <li><strong>Auskunft</strong> über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
          <li><strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
          <li><strong>Löschung</strong> Ihrer Daten (Art. 17 DSGVO)</li>
          <li><strong>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
          <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
          <li><strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
        </ul>
        <p>
          Anfragen richten Sie an: info@easydoc.de<br />
          Sie haben zudem das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Diese Website verwendet technisch notwendige Cookies zur Authentifizierung und
          Session-Verwaltung. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.
        </p>
      </section>

      <section>
        <h2>9. Authentifizierung</h2>
        <p>
          Wir nutzen Auth0 (Okta, Inc.) zur sicheren Benutzeranmeldung. Dabei werden
          Authentifizierungsdaten an Server in der EU übertragen. Details entnehmen Sie
          der Datenschutzerklärung von Auth0 unter auth0.com/privacy.
        </p>
      </section>

      <section>
        <h2>10. Änderungen dieser Erklärung</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die
          jeweils aktuelle Version ist auf dieser Seite abrufbar. Stand: Januar 2026.
        </p>
      </section>
    </div>
  </main>
  <AppFooter />
</template>

<style scoped>
.legal-page {
  min-height: calc(100vh - 75px - 180px);
  background: #eef3fb;
  padding: 56px 20px;
}

.legal-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 48px 56px;
  box-shadow: 0 2px 16px rgba(21, 93, 252, 0.07);
}

h1 {
  font-size: 32px;
  color: #155dfc;
  margin: 0 0 36px;
}

section {
  margin-bottom: 32px;
}

h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #d8e3f7;
}

p {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
  margin: 0 0 8px;
}

ul {
  margin: 8px 0 8px 20px;
  padding: 0;
  color: #555;
  font-size: 15px;
  line-height: 1.8;
}

strong {
  color: #333;
}

@media (max-width: 768px) {
  .legal-container {
    padding: 28px 20px;
  }

  h1 {
    font-size: 26px;
  }
}
</style>
