<script setup lang="ts">
const stats = [
  {
    value: '1.000+',
    label: 'Ärzte im Netzwerk',
    icon: 'mdi-account-group-outline',
  },
  {
    value: '10.000+',
    label: 'erfolgreiche Termine',
    icon: 'mdi-calendar-check-outline',
  },
  {
    value: '2.500+',
    label: 'zufriedene Patienten',
    icon: 'mdi-emoticon-happy-outline',
  },
]
</script>

<template>
  <section class="kpi-section">
    <div class="kpi-container">
      <div class="kpi-copy">
        <span class="section-kicker">EasyDoc in Zahlen</span>
        <h2>Vertrauen, Reichweite und klare Orientierung</h2>
        <p>Die wichtigsten Kennzahlen auf einen Blick, kompakt und ohne Ablenkung.</p>
      </div>

      <div class="kpi-grid">
        <article v-for="stat in stats" :key="stat.label" class="kpi-card">
          <div class="kpi-icon">
            <v-icon size="24" :icon="stat.icon" />
          </div>
          <div class="kpi-text">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kpi-section {
  position: relative;
  z-index: 1;
  padding: 0 24px 104px;
}

.kpi-container {
  max-width: 1440px;
  margin: 0 auto;
}

.kpi-copy {
  max-width: 760px;
  margin-bottom: 24px;
}

.section-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  color: #155dfc;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.kpi-copy h2 {
  margin: 0 0 10px;
  color: #13213c;
  font-size: clamp(1.8rem, 2.6vw, 2.9rem);
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.kpi-copy p {
  margin: 0;
  color: #5d6a82;
  font-size: 16px;
  line-height: 1.65;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 112px;
  padding: 22px 24px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(216, 227, 247, 0.9);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(24, 58, 150, 0.08);
}

.kpi-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  color: #155dfc;
  background: #eef4ff;
  border-radius: 18px;
}

.kpi-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-text strong {
  color: #155dfc;
  font-size: clamp(1.8rem, 2.1vw, 2.5rem);
  line-height: 1;
  letter-spacing: -0.04em;
}

.kpi-text span {
  margin-top: 6px;
  color: #405069;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kpi-section {
    padding-inline: 16px;
    padding-bottom: 84px;
  }
}
</style>
