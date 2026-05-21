<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDoctorStore } from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorCard from '@/components/DoctorCard.vue'
import DoctorFilter from '@/components/DoctorFilter.vue'

const doctorStore = useDoctorStore()
const doctors = ref(doctorStore.doctors)

onMounted(async () => {
  await doctorStore.fetchAll()
  doctors.value = doctorStore.doctors
})

async function onFilter(filters: { name: string; doctorType: string }) {
  await doctorStore.search(filters)
  doctors.value = doctorStore.doctors
}
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
    <DoctorFilter @filter="onFilter" />

    <div class="catalog-actions">
      <router-link class="btn btn-primary" to="/doctor/create">
        + Neuer Arzt
      </router-link>
    </div>

    <div class="doctor-grid">
      <div v-for="doctor in doctors" :key="doctor.id" class="doctor-col">
        <DoctorCard :doctor="doctor" />
      </div>
    </div>

    <p v-if="doctors.length === 0" class="no-results">Keine Ärzte gefunden.</p>
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

.catalog-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.3s;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.no-results {
  text-align: center;
  color: #888;
  font-size: 18px;
  padding: 40px 0;
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
