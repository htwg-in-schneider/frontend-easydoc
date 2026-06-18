<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, type DoctorSearchFilters } from '@/stores/doctors'
import { normalizeSelection } from '@/utils/doctorFilters'
import MultiSelectDropdown from '@/components/MultiSelectDropdown.vue'

const props = defineProps<{
  initialFilters?: DoctorSearchFilters
}>()

const emit = defineEmits<{
  filter: [filters: DoctorSearchFilters]
}>()

const doctorStore = useDoctorStore()
const { doctorTypes, cities } = storeToRefs(doctorStore)

const searchName = ref(props.initialFilters?.name || '')
const selectedTypes = ref(normalizeSelection(props.initialFilters?.doctorType))
const selectedCities = ref(normalizeSelection(props.initialFilters?.city))
const selectedRatings = ref(props.initialFilters?.minRating ? [String(props.initialFilters.minRating)] : [])
const selectedDistances = ref(props.initialFilters?.maxDistance ? [String(props.initialFilters.maxDistance)] : [])
const sortByEarliestSlot = ref(props.initialFilters?.sortByEarliestSlot ?? false)

const ratingOptions = [
  { value: '4.5', label: '⭐ 4.5+' },
  { value: '4.0', label: '⭐ 4.0+' },
  { value: '3.5', label: '⭐ 3.5+' },
  { value: '3.0', label: '⭐ 3.0+' },
]

const distanceOptions = [
  { value: '1', label: '📍 bis 1 km' },
  { value: '2', label: '📍 bis 2 km' },
  { value: '3', label: '📍 bis 3 km' },
  { value: '5', label: '📍 bis 5 km' },
  { value: '10', label: '📍 bis 10 km' },
]

onMounted(async () => {
  try {
    await Promise.all([
      doctorTypes.value.length === 0 ? doctorStore.fetchDoctorTypes() : Promise.resolve(),
      cities.value.length === 0 ? doctorStore.fetchCities() : Promise.resolve(),
    ])
  } catch (error) {
    console.error('Filter data loading failed', error)
  }
  if (selectedTypes.value.length > 0 || selectedCities.value.length > 0 || searchName.value || selectedRatings.value.length > 0 || selectedDistances.value.length > 0) {
    onSearch()
  }
})

function onSearch() {
  emit('filter', {
    name: searchName.value,
    doctorType: selectedTypes.value,
    city: selectedCities.value,
    minRating: selectedRatings.value[0] ? Number(selectedRatings.value[0]) : undefined,
    maxDistance: selectedDistances.value[0] ? Number(selectedDistances.value[0]) : undefined,
    sortByEarliestSlot: sortByEarliestSlot.value,
  })
}

function onSelectionChange() {
  nextTick(onSearch)
}

function onReset() {
  searchName.value = ''
  selectedTypes.value = []
  selectedCities.value = []
  selectedRatings.value = []
  selectedDistances.value = []
  sortByEarliestSlot.value = false
  emit('filter', { name: '', doctorType: [], city: [], sortByEarliestSlot: false })
}
</script>

<template>
  <div class="filter-shell">
    <div class="filter-main">
      <input
        v-model="searchName"
        type="text"
        class="filter-input"
        placeholder="Name suchen..."
        @keyup.enter="onSearch"
      >

      <MultiSelectDropdown
        v-model="selectedTypes"
        class="multi-select-field"
        variant="compact"
        placeholder="Alle Fachrichtungen"
        :options="doctorTypes.map((type) => ({ value: type.name, label: type.name }))"
        @update:modelValue="onSelectionChange"
      />

      <MultiSelectDropdown
        v-model="selectedCities"
        class="multi-select-field"
        variant="compact"
        placeholder="Alle Städte"
        :options="cities.map((city) => ({ value: city.name, label: city.name }))"
        @update:modelValue="onSelectionChange"
      />

      <MultiSelectDropdown
        v-model="selectedRatings"
        class="multi-select-field"
        variant="compact"
        placeholder="Bewertung"
        :multiple="false"
        :options="ratingOptions"
        @update:modelValue="onSelectionChange"
      />

      <MultiSelectDropdown
        v-model="selectedDistances"
        class="multi-select-field"
        variant="compact"
        placeholder="Entfernung"
        :multiple="false"
        :options="distanceOptions"
        @update:modelValue="onSelectionChange"
      />
    </div>

    <div class="filter-actions-row">
      <label class="filter-toggle">
        <input type="checkbox" v-model="sortByEarliestSlot" @change="onSearch" />
        <span>Frühester Termin</span>
      </label>

      <div class="filter-actions">
        <button class="btn btn-primary" @click="onSearch">Suchen</button>
        <button class="btn btn-secondary" @click="onReset">Reset</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-shell {
  display: grid;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 32px;
  gap: 16px;
  position: relative;
  z-index: 30;
  overflow: visible;
}

.filter-main {
  display: grid;
  grid-template-columns: minmax(220px, 1.45fr) minmax(180px, 1fr) minmax(180px, 1fr) minmax(170px, 1fr) minmax(170px, 1fr);
  gap: 12px;
  align-items: end;
}

.filter-main > * {
  min-width: 0;
}

.filter-input,
.multi-select-field {
  width: 100%;
  height: 48px;
  min-width: 0;
}

.filter-input {
  padding: 0 16px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  font-size: 16px;
  color: #1f2a44;
  background: #fff;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
  transition: border-color 0.3s;
}

.filter-input:focus {
  outline: none;
  border-color: #155dfc;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 18px;
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

.filter-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: stretch;
  margin-left: auto;
}

.filter-actions .btn {
  width: 140px;
}

.filter-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #1f2a44;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
}

.filter-toggle input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: #155dfc;
  cursor: pointer;
}

@media (max-width: 600px) {
  .filter-input,
  .multi-select-field {
    width: 100%;
  }

  .filter-main {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-toggle {
    width: 100%;
    justify-content: center;
  }

  .filter-actions {
    width: 100%;
    margin-left: 0;
  }

  .filter-actions .btn {
    flex: 1;
    width: auto;
  }
}
</style>
