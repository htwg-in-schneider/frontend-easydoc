<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, type DoctorSearchFilters } from '@/stores/doctors'

const emit = defineEmits<{
  filter: [filters: DoctorSearchFilters]
}>()

const doctorStore = useDoctorStore()
const { doctorTypes } = storeToRefs(doctorStore)

const searchName = ref('')
const selectedType = ref('')
const minRating = ref('')
const maxDistance = ref('')

onMounted(async () => {
  try {
    await doctorStore.fetchDoctorTypes()
  } catch (error) {
    console.error('Doctor type loading failed', error)
  }
})

function onSearch() {
  emit('filter', {
    name: searchName.value,
    doctorType: selectedType.value,
    minRating: minRating.value ? Number(minRating.value) : undefined,
    maxDistance: maxDistance.value ? Number(maxDistance.value) : undefined,
  })
}

function onReset() {
  searchName.value = ''
  selectedType.value = ''
  minRating.value = ''
  maxDistance.value = ''
  emit('filter', { name: '', doctorType: '' })
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
      <option v-for="type in doctorTypes" :key="type.id" :value="String(type.id)">
        {{ type.name }}
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
