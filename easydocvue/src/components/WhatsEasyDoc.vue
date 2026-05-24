<script setup lang="ts">
import docImage from '@/assets/images/Doc.png'
</script>

<template>
  <section class="whats-easydoc">
    <div class="explain">
      <h1>
        <span class="text-blue">Easy</span><span class="text-green">Doc</span>
        – Einfach zum richtigen Arzt
      </h1>

      <p>
        EasyDoc verbindet Patienten und Ärzte schnell, einfach und intelligent.
        Unser Ziel ist es, den Zugang zur Gesundheitsversorgung zu verbessern.
      </p>

      <ul>
        <li>Problem eingeben</li>
        <li>Passende Ärzte erhalten</li>
        <li>Termin buchen</li>
      </ul>
    </div>

    <div class="doc-image">
      <img :src="docImage" alt="Arzt Illustration">
    </div>
  </section>
</template>

<style scoped>
.whats-easydoc {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
  gap: 50px;
}

.explain {
  flex: 1;
}

.explain h1 {
  font-size: 42px;
  margin-bottom: 30px;
  margin-top: 0;
}

.text-blue {
  color: #155dfc;
}

.text-green {
  color: #7AAE38;
}

.explain p {
  font-size: 20px;
  margin-bottom: 40px;
  color: #555;
}

.explain ul {
  list-style: none;
  padding: 0;
  margin-top: 0;
}

.explain li {
  margin-bottom: 12px;
  font-size: 20px;
  position: relative;
  padding-left: 25px;
}

.explain li::before {
  content: "✔";
  position: absolute;
  left: 0;
  color: #155dfc;
}

.doc-image {
  flex: 1;
  display: flex;
  justify-content: center;
}

.doc-image img {
  max-width: 100%;
  height: auto;
}

@media (max-width: 768px) {
  .whats-easydoc {
    flex-direction: column;
    padding: 40px 20px;
    gap: 30px;
  }

  .explain h1 {
    font-size: 28px;
  }

  .explain p,
  .explain li {
    font-size: 16px;
  }
}
</style>
