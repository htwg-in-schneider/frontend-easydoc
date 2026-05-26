<script setup lang="ts">
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const symptoms = ref('')
</script>

<template>
  <NavBar />
  <main class="symptom-page">
    <section class="symptom-card">
      <h1>Symptomanalyse</h1>
      <p>Eine KI-gestützte Symptomanalyse wird hier später ergänzt.</p>
      <textarea v-model="symptoms" placeholder="Beschreiben Sie Ihre Symptome"></textarea>
      <button type="button" class="btn btn-primary">Analyse starten</button>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.symptom-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 56px 20px;
  background: #eef3fb;
}

.symptom-card {
  width: min(760px, 100%);
  margin: 0 auto;
  padding: 34px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.symptom-card h1 {
  margin: 0 0 12px;
  color: #333;
  font-size: 30px;
}

.symptom-card p {
  margin: 0 0 20px;
  color: #64708a;
}

.symptom-card textarea {
  width: 100%;
  min-height: 160px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font: inherit;
  resize: vertical;
}

.btn {
  height: 44px;
  padding: 0 22px;
  border: 0;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  color: #ffffff;
  background: #155dfc;
}
</style>
