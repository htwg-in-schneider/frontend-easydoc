<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useDoctorStore, type DoctorSearchFilters } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorCard from '@/components/DoctorCard.vue'
import DoctorFilter from '@/components/DoctorFilter.vue'

const route = useRoute()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const { doctors } = storeToRefs(doctorStore)
const { isAdmin } = storeToRefs(profileStore)

const activeFilters = ref<DoctorSearchFilters>({
  doctorType: (route.query.doctorType as string) || '',
  city: (route.query.city as string) || '',
})

onMounted(async () => {
  try {
    if (activeFilters.value.doctorType || activeFilters.value.city) {
      await doctorStore.search(activeFilters.value)
    } else {
      await doctorStore.fetchAll()
    }
  } catch (error) {
    console.error('Doctor loading failed', error)
  }
})

async function onFilter(filters: DoctorSearchFilters) {
  activeFilters.value = filters
  try {
    await doctorStore.search(filters)
  } catch (error) {
    console.error('Doctor search failed', error)
  }
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
    <DoctorFilter :initialFilters="activeFilters" @filter="onFilter" />

    <div class="catalog-actions">
      <router-link
        class="btn btn-map"
        :to="{ path: '/doctors/map', query: { doctorType: activeFilters.doctorType || undefined, city: activeFilters.city || undefined } }"
      >
        🗺️ Kartenansicht
      </router-link>
      <router-link v-if="isAdmin" class="btn btn-primary" to="/doctor/create">
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
  gap: 12px;
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

.btn-map {
  background: #1e293b;
  color: #fff;
}

.btn-map:hover {
  background: #334155;
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
