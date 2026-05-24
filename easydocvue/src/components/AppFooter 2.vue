<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-column">
        <h3>EasyDoc</h3>
        <p>Ihr vertrauenswürdiger Partner für schnellen und einfachen Zugang zur Gesundheitsversorgung.</p>
      </div>

      <nav class="footer-column">
        <h4>Schnelllinks</h4>
        <router-link to="/">Startseite</router-link>
        <router-link to="/doctors">Arzt finden</router-link>
      </nav>

      <nav class="footer-column">
        <h4>Hilfe &amp; Support</h4>
        <a href="#">FAQ</a>
        <a href="#">Kontakt</a>
        <a href="#">Datenschutz</a>
        <a href="#">Impressum</a>
      </nav>

      <address class="footer-column">
        <h4>Kontakt</h4>
        <p>info@easydoc.de</p>
        <p>+49 30 12345678</p>
        <p>Musterstraße 123<br>10115 Berlin</p>
      </address>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2026 EasyDoc. Alle Rechte vorbehalten.</p>
      <p>Made with ❤️ in Deutschland</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #0b1220;
  color: white;
  padding: 50px 80px 20px;
}

.footer-container {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 250px;
  font-style: normal;
}

.footer-column a {
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-column a:hover {
  color: #155dfc;
}

.footer-column h3,
.footer-column h4 {
  margin: 0 0 10px;
}

.footer-column p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.footer-bottom {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .footer {
    padding: 30px 20px 15px;
  }

  .footer-container {
    flex-direction: column;
    gap: 24px;
  }

  .footer-column {
    max-width: 100%;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
