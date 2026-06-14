<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, type DoctorSearchFilters } from '@/stores/doctors'

const props = defineProps<{
  initialFilters?: DoctorSearchFilters
}>()

const emit = defineEmits<{
  filter: [filters: DoctorSearchFilters]
}>()

const doctorStore = useDoctorStore()
const { doctorTypes, cities } = storeToRefs(doctorStore)

const searchName = ref(props.initialFilters?.name || '')
const selectedType = ref(props.initialFilters?.doctorType || '')
const selectedCity = ref(props.initialFilters?.city || '')
const minRating = ref(props.initialFilters?.minRating ? String(props.initialFilters.minRating) : '')
const maxDistance = ref(props.initialFilters?.maxDistance ? String(props.initialFilters.maxDistance) : '')

onMounted(async () => {
  try {
    await Promise.all([doctorStore.fetchDoctorTypes(), doctorStore.fetchCities()])
  } catch (error) {
    console.error('Filter data loading failed', error)
  }
  if (selectedType.value || selectedCity.value || searchName.value) {
    onSearch()
  }
})

function onSearch() {
  emit('filter', {
    name: searchName.value,
    doctorType: selectedType.value,
    city: selectedCity.value,
    minRating: minRating.value ? Number(minRating.value) : undefined,
    maxDistance: maxDistance.value ? Number(maxDistance.value) : undefined,
  })
}

function onReset() {
  searchName.value = ''
  selectedType.value = ''
  selectedCity.value = ''
  minRating.value = ''
  maxDistance.value = ''
  emit('filter', { name: '', doctorType: '', city: '' })
}
</script>

<template>
  <div class="filter-bar">
    <input
      v-model="searchName"
      type="text"
      class="filter-input"
      placeholder="Name suchen..."
      @keyup.enter="onSearch"
    >

    <select v-model="selectedType" class="filter-select" @change="onSearch">
      <option value="">Alle Fachrichtungen</option>
      <option v-for="type in doctorTypes" :key="type.id" :value="type.name">
        {{ type.name }}
      </option>
    </select>

    <select v-model="selectedCity" class="filter-select" @change="onSearch">
      <option value="">Alle Städte</option>
      <option v-for="city in cities" :key="city.id" :value="city.name">
        {{ city.name }}
      </option>
    </select>

    <select v-model="minRating" class="filter-select" @change="onSearch">
      <option value="">Bewertung</option>
      <option value="4.5">⭐ 4.5+</option>
      <option value="4.0">⭐ 4.0+</option>
      <option value="3.5">⭐ 3.5+</option>
      <option value="3.0">⭐ 3.0+</option>
    </select>

    <select v-model="maxDistance" class="filter-select" @change="onSearch">
      <option value="">Entfernung</option>
      <option value="1">📍 bis 1 km</option>
      <option value="2">📍 bis 2 km</option>
      <option value="3">📍 bis 3 km</option>
      <option value="5">📍 bis 5 km</option>
      <option value="10">📍 bis 10 km</option>
    </select>

    <button class="btn btn-primary" @click="onSearch">Suchen</button>
    <button class="btn btn-secondary" @click="onReset">Reset</button>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 32px;
}

.filter-input,
.filter-select {
  height: 48px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.filter-input {
  width: 250px;
}

.filter-select {
  width: 220px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #155dfc;
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
  border: none;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  background: #f0f6fe;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dce8fd;
}

@media (max-width: 600px) {
  .filter-input,
  .filter-select {
    width: 100%;
  }

  .filter-bar {
    flex-direction: column;
  }
}
</style>
