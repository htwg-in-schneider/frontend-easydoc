<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doctors as localDoctors } from '@/data.js'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorCard from '@/components/DoctorCard.vue'

const doctors = ref(localDoctors)

onMounted(() => {
  // Later: replace with fetch from backend
  doctors.value = localDoctors
})
</script>

<template>
  <NavBar />

  <section class="catalog-header">
    <div class="container">
      <h2>Unsere Ärzte</h2>
      <p>Finden Sie den passenden Arzt für Ihre Bedürfnisse.</p>
    </div>
  </section>

  <div class="catalog-container">
    <div class="doctor-grid">
      <div v-for="doctor in doctors" :key="doctor.id" class="doctor-col">
        <DoctorCard :doctor="doctor" />
      </div>
    </div>
  </div>

  <AppFooter />
</template>

<style scoped>
.catalog-header {
  text-align: center;
  padding: 60px 20px 30px;
  background: linear-gradient(135deg, #155dfc10, #7AAE3810);
}

.catalog-header h2 {
  font-size: 36px;
  margin: 0 0 12px;
  color: #333;
}

.catalog-header p {
  font-size: 18px;
  color: #666;
  margin: 0;
}

.catalog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

@media (max-width: 992px) {
  .doctor-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .doctor-grid {
    grid-template-columns: 1fr;
  }

  .catalog-header h2 {
    font-size: 28px;
  }
}
</style>
