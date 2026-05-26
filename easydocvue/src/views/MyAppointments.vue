<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <NavBar />
  <main class="appointments-page">
    <section class="appointments-panel">
      <h1>Meine Termine</h1>
      <p>Noch keine Terminübersicht verfügbar.</p>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.appointments-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px;
  background: #eef3fb;
}

.appointments-panel {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 8px;
}

.appointments-panel h1 {
  margin: 0 0 12px;
  color: #1f2a44;
  font-size: 28px;
}

.appointments-panel p {
  margin: 0;
  color: #64708a;
}
</style>
