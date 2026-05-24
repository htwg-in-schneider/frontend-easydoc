<script setup lang="ts">
import symptomImg from '@/assets/images/Symptomanalyse.png'
</script>

<template>
  <section class="funktionen">
    <div class="feature-card">
      <img :src="symptomImg" alt="Symptomanalyse">
      <h2>Symptomanalyse</h2>
      <ul>
        <li>KI-gestützte Symptomanalyse</li>
        <li>Empfehlungen für die nächsten Schritte</li>
        <li>Informationen zu möglichen Ursachen</li>
      </ul>
    </div>

    <div class="feature-card">
      <img :src="symptomImg" alt="Arzt finden">
      <h2>Arzt finden</h2>
      <ul>
        <li>Finden Sie den richtigen Facharzt</li>
        <li>Sehen Sie alle Ärzte in Ihrer Nähe</li>
        <li>Kein langes Suchen!</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.funktionen {
  display: flex;
  text-align: center;
  justify-content: center;
  gap: 40px;
  padding: 20px;
}

.feature-card {
  background: #f0f6fe;
  border-radius: 20px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  margin-top: 20px;
  margin-bottom: 50px;
}

.feature-card img {
  max-width: 80px;
  margin-bottom: 16px;
}

.feature-card ul {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  padding-left: 20px;
}

@media (max-width: 768px) {
  .funktionen {
    flex-direction: column;
    align-items: center;
  }

  .feature-card {
    width: 80%;
    margin-top: 10px;
    margin-bottom: 20px;
  }
}
</style>
