<template>
	<main class="category-view">
		<div class="navigation">
			<img class="logo" src="Logo.png" alt="Logo">

			<div class="anmelden">
				<a href="#">Anmelden</a>
			</div>
			<div class="sprache">
				<a href="#"><img class="flagge" src="DeutschlandFlagge.png" alt="Sprache"></a>
			</div>
		</div>

		<div class="background_img">
			<div class="Ueberschrift">
				<h1>Fur ein gesundes Leben!</h1>
			</div>

			<div class="Arzt_finden_Box">
				<div class="suchfelder">
					<input list="aerzte" placeholder="Arzt suchen">

					<datalist id="aerzte">
						<option value="Lungenarzt"></option>
						<option value="Zahnarzt"></option>
						<option value="Hausarzt"></option>
						<option value="Dermatologe"></option>
					</datalist>

					<input type="text" placeholder="z. B. Konstanz">
				</div>

				<div class="Arzt_finden">
					<a href="#">Arzt finden</a>
				</div>
			</div>
		</div>

		<section class="WhatsEasyDoc">
			<div class="ExplainEasyDoc">
				<h1>
					<span style="color: #155dfc;">Easy</span><span style="color: #7AAE38;">Doc</span> - Einfach zum richtigen Arzt
				</h1>

				<p>
					EasyDoc verbindet Patienten und Arzte schnell, einfach und intelligent.
					Unser Ziel ist es, den Zugang zur Gesundheitsversorgung zu verbessern.
				</p>

				<ul>
					<li>Problem eingeben</li>
					<li>Passende Arzte erhalten</li>
					<li>Termin buchen</li>
				</ul>
			</div>

			<div class="DocImage">
				<img src="doc.png" alt="Arzt Illustration">
			</div>
		</section>

		<section class="funktionen">
			<div class="Symptomanalyse">
				<img class="Symptomanalyse_img" src="Symptomanalyse.png" alt="Symptomanalyse">
				<h2>Symptomanalyse</h2>
				<ul>
					<li>KI-gestutzte Symptomanalyse</li>
					<li>Empfehlungen fur die nachsten Schritte</li>
					<li>Informationen zu moglichen Ursachen</li>
				</ul>
			</div>

			<div class="Arzt_finden2">
				<img class="Symptomanalyse_img" src="Symptomanalyse.png" alt="Symptomanalyse">
				<h2>Arzt finden</h2>

				<ul>
					<li>Finden sie den richtigen Facharzt</li>
					<li>sehen sie alle Arzte in ihrer Nahe</li>
					<li>kein Langes Suchen!</li>
				</ul>
			</div>
		</section>

		<section class="ziele">
			<h2>Unsere Ziele</h2>

			<div class="ziele-grid">
				<div class="ziel-card">
					<img src="Goal1.png" alt="">
					<div>
						<h3>Schneller Zugang zur passenden Behandlung</h3>
						<p>Patienten finden in wenigen Sekunden den richtigen Arzt.</p>
					</div>
				</div>

				<div class="ziel-card">
					<img src="Goal2.png" alt="">
					<div>
						<h3>Effiziente Auslastung fur Arzte</h3>
						<p>Freie Termine werden sinnvoll vergeben und Leerlauf reduziert.</p>
					</div>
				</div>

				<div class="ziel-card">
					<img src="Goal3.png" alt="">
					<div>
						<h3>Einfache und intuitive Nutzung</h3>
						<p>Keine komplizierten Prozesse - einfach suchen, finden, fertig.</p>
					</div>
				</div>

				<div class="ziel-card">
					<img src="Goal4.png" alt="">
					<div>
						<h3>Bessere Orientierung im Gesundheitssystem</h3>
						<p>Wir helfen dabei, die richtige Entscheidung zu treffen.</p>
					</div>
				</div>
			</div>
		</section>

		<footer class="footer">
			<div class="footer-container">
				<div class="footer-column">
					<h3>EasyDoc</h3>
					<p>Ihr vertrauenswurdiger Partner fur schnellen und einfachen Zugang zur Gesundheitsversorgung.</p>
				</div>

				<nav class="footer-column">
					<h4>Schnellinks</h4>
					<a href="#">Startseite</a>
					<a href="#">Arzt finden</a>
					<a href="#">Dashboard</a>
					<a href="#">Profil</a>
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
					<p>Musterstrasse 123<br>10115 Berlin</p>
				</address>
			</div>

			<div class="footer-bottom">
				<p>© 2026 EasyDoc. Alle Rechte vorbehalten.</p>
				<p>Made with ❤️ in Deutschland</p>
			</div>
		</footer>
	</main>
</template>

<script setup lang="ts">
// Keep this block for future interactivity (form handling, API calls, etc.).
</script>

<style>
/* Uses your existing static stylesheet from src/assets. */
@import '@/assets/style.css';

/* Optional local wrapper for future page-specific tweaks. */
.category-view {
	width: 100%;
}
</style>
