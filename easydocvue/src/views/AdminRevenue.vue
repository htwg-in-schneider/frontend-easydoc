<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { useDoctorStore } from '@/stores/doctors'
import { useRevenueStore } from '@/stores/revenue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const { getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const revenueStore = useRevenueStore()

const { doctors } = storeToRefs(doctorStore)
const { revenueData, isLoading, selectedYear } = storeToRefs(revenueStore)

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

// Local filter + sort state
const nameFilter = ref('')
const selectedSpecialization = ref<number | null>(null)
const sortDirection = ref<'asc' | 'desc'>('desc')

// Map doctorId → specialization id for fast lookup
const doctorSpecIdMap = computed(() => {
  const map = new Map<number, number>()
  for (const d of doctors.value) {
    const spec = d.specialization ?? d.doctorType
    if (spec?.id) map.set(d.id, spec.id)
  }
  return map
})

// Specialization options derived from doctors present in revenue data
const specializationOptions = computed(() => {
  const doctorIds = new Set(revenueData.value.map(e => e.doctorId))
  const seen = new Set<number>()
  const specs: { id: number; name: string }[] = []
  for (const d of doctors.value) {
    const spec = d.specialization ?? d.doctorType
    if (doctorIds.has(d.id) && spec?.id && !seen.has(spec.id)) {
      seen.add(spec.id)
      specs.push({ id: spec.id, name: spec.name })
    }
  }
  return specs.sort((a, b) => a.name.localeCompare(b.name))
})

const filteredData = computed(() => {
  const needle = nameFilter.value.trim().toLowerCase()
  return revenueData.value.filter(entry => {
    if (needle && !entry.doctorName.toLowerCase().includes(needle)) return false
    if (selectedSpecialization.value !== null) {
      if (doctorSpecIdMap.value.get(entry.doctorId) !== selectedSpecialization.value) return false
    }
    return true
  })
})

interface DoctorAggregate {
  doctorId: number
  doctorName: string
  practiceName: string | null
  adminRevenue: number
  appointmentCount: number
}

const aggregatedByDoctor = computed((): DoctorAggregate[] => {
  const map = new Map<number, DoctorAggregate>()
  for (const entry of filteredData.value) {
    const existing = map.get(entry.doctorId)
    if (existing) {
      existing.adminRevenue += entry.adminRevenue ?? 0
      existing.appointmentCount += entry.appointmentCount ?? 0
    } else {
      map.set(entry.doctorId, {
        doctorId: entry.doctorId,
        doctorName: entry.doctorName,
        practiceName: entry.practiceName,
        adminRevenue: entry.adminRevenue ?? 0,
        appointmentCount: entry.appointmentCount ?? 0,
      })
    }
  }
  const result = Array.from(map.values())
  result.sort((a, b) =>
    sortDirection.value === 'asc'
      ? a.adminRevenue - b.adminRevenue
      : b.adminRevenue - a.adminRevenue,
  )
  return result
})

const totalRevenue = computed(() =>
  filteredData.value.reduce((sum, e) => sum + (e.adminRevenue ?? 0), 0),
)

const totalAppointments = computed(() =>
  filteredData.value.reduce((sum, e) => sum + (e.appointmentCount ?? 0), 0),
)

const selectedDoctorIds = computed(() => new Set(filteredData.value.map(e => e.doctorId)))

const chartTitle = computed(() => {
  if (selectedDoctorIds.value.size === 1) {
    const doctorName = filteredData.value[0]?.doctorName
    return doctorName ? `Monatsverlauf – ${doctorName}` : 'Monatsverlauf'
  }
  return 'Monatsverlauf'
})

const revenueByMonth = computed(() => {
  const map = new Array(12).fill(0)
  for (const entry of filteredData.value) {
    map[entry.month - 1] += entry.adminRevenue ?? 0
  }
  return map
})

const chartData = computed(() => ({
  labels: MONTH_NAMES,
  datasets: [
    {
      label: 'Umsatz (€)',
      data: revenueByMonth.value,
      backgroundColor: 'rgba(21, 93, 252, 0.75)',
      borderColor: '#155dfc',
      borderWidth: 1,
      borderRadius: 6,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${formatEur(ctx.raw)}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (v: any) => formatEur(v),
      },
    },
  },
}

function formatEur(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function toggleSort() {
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
}

async function load() {
  const token = await getAccessTokenSilently()
  await revenueStore.fetchRevenue(token)
}

onMounted(async () => {
  await doctorStore.fetchAll()
  await load()
})

watch(selectedYear, load)
</script>

<template>
  <NavBar />

  <div class="revenue-page">
    <div class="revenue-container">
      <h1 class="page-title">Umsatz</h1>

      <!-- Filter -->
      <div class="filter-bar">
        <div class="filter-group filter-group--wide">
          <label for="filter-name">Arzt suchen</label>
          <div class="search-input-wrap">
            <svg class="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8.5" cy="8.5" r="5.5" stroke="#94a3b8" stroke-width="1.6"/>
              <path d="M13 13l3.5 3.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <input
              id="filter-name"
              v-model="nameFilter"
              type="text"
              placeholder="Name eingeben…"
              class="search-input"
            >
          </div>
        </div>

        <div class="filter-group">
          <label for="filter-spec">Fachrichtung</label>
          <select id="filter-spec" v-model="selectedSpecialization">
            <option :value="null">Alle Fachrichtungen</option>
            <option v-for="spec in specializationOptions" :key="spec.id" :value="spec.id">
              {{ spec.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="filter-year">Jahr</label>
          <select id="filter-year" v-model="selectedYear">
            <option :value="null">Alle Jahre</option>
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-row">
        <div class="summary-card">
          <span class="card-label">Gesamtumsatz</span>
          <span class="card-value">{{ formatEur(totalRevenue) }}</span>
          <span class="card-hint">10 % der Termineinnahmen</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Gebuchte Termine</span>
          <span class="card-value">{{ totalAppointments }}</span>
          <span class="card-hint">im gewählten Zeitraum</span>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-card">
        <h2 class="section-title">{{ chartTitle }}</h2>
        <div v-if="isLoading" class="empty-state">Daten werden geladen...</div>
        <div v-else-if="filteredData.length === 0" class="empty-state">Keine Umsatzdaten für diesen Zeitraum.</div>
        <div v-else class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Table -->
      <div class="table-card">
        <h2 class="section-title">Details</h2>

        <div v-if="isLoading" class="empty-state">Daten werden geladen...</div>
        <div v-else-if="filteredData.length === 0" class="empty-state">Keine Einträge gefunden.</div>

        <table v-else class="revenue-table">
          <thead>
            <tr>
              <th>Arzt</th>
              <th>Praxis</th>
              <th class="num">Termine</th>
              <th class="num sort-header" @click="toggleSort">
                Umsatz (10 %)
                <span class="sort-icon">{{ sortDirection === 'desc' ? '▼' : '▲' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in aggregatedByDoctor" :key="entry.doctorId">
              <td>{{ entry.doctorName }}</td>
              <td>{{ entry.practiceName ?? '—' }}</td>
              <td class="num">{{ entry.appointmentCount }}</td>
              <td class="num">{{ formatEur(entry.adminRevenue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <AppFooter />
</template>

<style scoped>
.revenue-page {
  min-height: calc(100vh - 75px - 200px);
  background: #f8fafc;
  padding: 40px 20px;
}

.revenue-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2a44;
  margin-bottom: 24px;
}

/* Filter */
.filter-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.filter-group--wide {
  min-width: 240px;
  flex: 1 1 240px;
  max-width: 340px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64708a;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.filter-group select {
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  background: #fff;
  font-size: 15px;
  color: #1f2a44;
  cursor: pointer;
}

.filter-group select:focus {
  outline: none;
  border-color: #155dfc;
}

.search-input-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 38px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  background: #fff;
  font-size: 15px;
  color: #1f2a44;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #155dfc;
}

.search-input::placeholder {
  color: #b0bbd4;
}

/* Summary Cards */
.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 24px;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(21, 93, 252, 0.06);
}

.card-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64708a;
}

.card-value {
  font-size: 28px;
  font-weight: 800;
  color: #155dfc;
  line-height: 1.2;
}

.card-hint {
  font-size: 12px;
  color: #94a3b8;
}

/* Chart */
.chart-card,
.table-card {
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(21, 93, 252, 0.06);
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2a44;
  margin: 0 0 16px;
}

.chart-wrapper {
  height: 280px;
}

.empty-state {
  padding: 24px 0;
  color: #94a3b8;
  text-align: center;
}

/* Table */
.revenue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.revenue-table th {
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64708a;
  border-bottom: 2px solid #e8eef8;
}

.revenue-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f4fa;
  color: #1f2a44;
}

.revenue-table tbody tr:hover td {
  background: #f6f9ff;
}

.revenue-table .num {
  text-align: right;
}

.sort-header {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.sort-header:hover {
  color: #155dfc;
}

.sort-icon {
  margin-left: 4px;
  font-size: 10px;
  color: #155dfc;
}

</style>
