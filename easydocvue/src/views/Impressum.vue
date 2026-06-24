<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <NavBar />
  <main class="legal-page">
    <div class="legal-container">
      <h1>Impressum</h1>

      <section>
        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          EasyDoc GmbH<br />
          Musterstraße 123<br />
          10115 Berlin<br />
          Deutschland
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          Telefon: +49 30 12345678<br />
          E-Mail: info@easydoc.de
        </p>
      </section>

      <section>
        <h2>Vertreten durch</h2>
        <p>Max Mustermann (Geschäftsführer)</p>
      </section>

      <section>
        <h2>Handelsregister</h2>
        <p>
          Registergericht: Amtsgericht Berlin-Charlottenburg<br />
          Registernummer: HRB 123456 B
        </p>
      </section>

      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
          DE 123456789
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Max Mustermann<br />
          Musterstraße 123<br />
          10115 Berlin
        </p>
      </section>

      <section>
        <h2>Haftungsausschluss</h2>
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
          Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
          nach den allgemeinen Gesetzen verantwortlich.
        </p>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die
          Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
          bzw. Erstellers.
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

@media (max-width: 640px) {
  .legal-container {
    padding: 28px 20px;
  }

  h1 {
    font-size: 26px;
  }
}
</style>
