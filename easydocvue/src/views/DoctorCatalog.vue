<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useDoctorStore, type DoctorSearchFilters } from '@/stores/doctors'
import { buildDoctorQuery, matchesDoctorFilters, normalizeSelection } from '@/utils/doctorFilters'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorCard from '@/components/DoctorCard.vue'
import DoctorFilter from '@/components/DoctorFilter.vue'

const route = useRoute()
const doctorStore = useDoctorStore()
const { doctors, earliestAvailability } = storeToRefs(doctorStore)

function formatSlot(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const activeFilters = ref<DoctorSearchFilters>({
  doctorType: normalizeSelection(route.query.doctorType),
  city: normalizeSelection(route.query.city),
})

onMounted(async () => {
  try {
    await doctorStore.fetchAll()
    if (activeFilters.value.sortByEarliestSlot) {
      await doctorStore.fetchEarliestAvailability()
    }
  } catch (error) {
    console.error('Doctor loading failed', error)
  }
})

const filteredDoctors = computed(() => {
  return doctors.value.filter((doctor) => matchesDoctorFilters(doctor, activeFilters.value))
})

const sortedDoctors = computed(() => {
  if (!activeFilters.value.sortByEarliestSlot) return filteredDoctors.value
  return [...filteredDoctors.value].sort((a, b) => {
    const aSlot = earliestAvailability.value.get(a.id) ?? null
    const bSlot = earliestAvailability.value.get(b.id) ?? null
    if (!aSlot && !bSlot) return 0
    if (!aSlot) return 1
    if (!bSlot) return -1
    return aSlot < bSlot ? -1 : aSlot > bSlot ? 1 : 0
  })
})

async function onFilter(filters: DoctorSearchFilters) {
  activeFilters.value = filters
  try {
    if (filters.sortByEarliestSlot) {
      await doctorStore.fetchEarliestAvailability()
    }
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

    <div class="view-switch-row">
      <router-link
        class="view-switch-btn"
        :to="{ path: '/doctors/map', query: buildDoctorQuery(activeFilters) }"
      >
        Kartenansicht
      </router-link>
    </div>

    <div class="doctor-grid">
      <div v-for="doctor in sortedDoctors" :key="doctor.id" class="doctor-col">
        <DoctorCard :doctor="doctor" />
        <p v-if="activeFilters.sortByEarliestSlot" class="earliest-slot">
          <template v-if="earliestAvailability.get(doctor.id)">
            Frühester Termin: {{ formatSlot(earliestAvailability.get(doctor.id)) }}
          </template>
          <template v-else>Kein Termin verfügbar</template>
        </p>
      </div>
    </div>

    <p v-if="sortedDoctors.length === 0" class="no-results">Keine Ärzte gefunden.</p>
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

.view-switch-row {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.view-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 48px;
  padding: 0 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  background: #1e293b;
  color: #fff;
  transition: background 0.3s;
}

.view-switch-btn:hover {
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

  .view-switch-btn {
    width: 100%;
  }
}
</style>
