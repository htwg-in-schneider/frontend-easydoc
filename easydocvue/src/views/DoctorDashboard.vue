<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <NavBar />
  <main class="dashboard-page">
    <section class="dashboard-card">
      <h1>Kalender</h1>
      <p>Hier können später Kalender und Slots synchronisiert werden.</p>
      <button type="button" class="btn btn-primary">Kalender synchronisieren</button>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 56px 20px;
  background: #eef3fb;
}

.dashboard-card {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 34px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.dashboard-card h1 {
  margin: 0 0 12px;
  color: #333;
  font-size: 30px;
}

.dashboard-card p {
  margin: 0 0 24px;
  color: #64708a;
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
