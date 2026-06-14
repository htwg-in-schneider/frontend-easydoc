<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorStore, formatDoctorName, getDoctorTypeName, type Doctor, type DoctorSearchFilters } from '@/stores/doctors'
import DoctorFilter from '@/components/DoctorFilter.vue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const route = useRoute()
const router = useRouter()
const doctorStore = useDoctorStore()
const { doctors } = storeToRefs(doctorStore)

const mapContainer = ref<HTMLElement | null>(null)
const selectedDoctor = ref<Doctor | null>(null)
const activeFilters = ref<DoctorSearchFilters>({
  doctorType: (route.query.doctorType as string) || '',
  city: (route.query.city as string) || '',
})
let map: L.Map | null = null
const markerMap = new Map<number, L.Marker>()
const markerPositionCache = new Map<string, [number, number]>()
let renderVersion = 0

// Default center: Konstanz Petershausen
const defaultCenter: [number, number] = [47.6725, 9.1732]

function normalized(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesFilters(doctor: Doctor, filters: DoctorSearchFilters) {
  const term = normalized(filters.name)
  const practice = normalized(doctor.practiceName)
  const firstName = normalized(doctor.firstName)
  const lastName = normalized(doctor.lastName)
  const email = normalized(doctor.email)
  const status = normalized(doctor.status)
  const specializationName = normalized(doctor.specialization?.name ?? doctor.doctorType?.name)
  const city = normalized(doctor.city)

  const matchesName =
    !term ||
    [firstName, lastName, practice, email, status, specializationName]
      .some((value) => value.includes(term))

  const filterType = normalized(filters.doctorType)
  const matchesType =
    !filterType ||
    normalized(doctor.specialization?.id ?? doctor.doctorType?.id).includes(filterType) ||
    specializationName.includes(filterType)

  const matchesRating =
    filters.minRating === undefined ||
    filters.minRating === null ||
    doctor.rating === null ||
    doctor.rating >= filters.minRating

  const matchesDistance =
    filters.maxDistance === undefined ||
    filters.maxDistance === null ||
    doctor.distance === null ||
    doctor.distance <= filters.maxDistance

  const matchesCity = !filters.city || city.includes(normalized(filters.city))

  return matchesName && matchesType && matchesRating && matchesDistance && matchesCity
}

const filteredDoctors = computed(() => {
  const filters = activeFilters.value
  return doctors.value
    .filter((doctor) => matchesFilters(doctor, filters))
    .sort((a, b) => {
      const aDistance = a.distance ?? Number.POSITIVE_INFINITY
      const bDistance = b.distance ?? Number.POSITIVE_INFINITY
      if (aDistance !== bDistance) return aDistance - bDistance

      const aRating = a.rating ?? 0
      const bRating = b.rating ?? 0
      if (aRating !== bRating) return bRating - aRating

      return formatDoctorName(a).localeCompare(formatDoctorName(b))
    })
})

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getDoctorMarkerCoords(doctor: Doctor): [number, number] {
  const cacheKey = [
    doctor.id,
    doctor.street,
    doctor.postcode,
    doctor.city,
    doctor.country,
    doctor.distance,
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
    .join('|')

  const cached = markerPositionCache.get(cacheKey)
  if (cached) return cached

  const hash = hashString(cacheKey || String(doctor.id))
  const angle = (hash % 360) * (Math.PI / 180)

  const baseRadiusKm = doctor.distance !== null && doctor.distance !== undefined
    ? Math.max(0.6, Math.min(doctor.distance, 8))
    : 1.8 + ((hash % 5) * 0.4)

  const jitterKm = ((hash % 100) / 100) * 0.45
  const radiusKm = baseRadiusKm + jitterKm
  const latitudeScale = 1 / 111
  const longitudeScale = 1 / (111 * Math.cos(defaultCenter[0] * Math.PI / 180))

  const coords: [number, number] = [
    defaultCenter[0] + Math.sin(angle) * radiusKm * latitudeScale,
    defaultCenter[1] + Math.cos(angle) * radiusKm * longitudeScale,
  ]

  markerPositionCache.set(cacheKey, coords)
  return coords
}

function buildPopupContent(doctor: Doctor): string {
  const name = formatDoctorName(doctor)
  const type = getDoctorTypeName(doctor.doctorType)
  const rating = doctor.rating !== null ? `⭐ ${doctor.rating}` : ''
  const distance = doctor.distance !== null ? `📍 ${doctor.distance} km` : ''
  const meta = [rating, distance].filter(Boolean).join('&nbsp;&nbsp;')
  return `
    <div style="font-family: sans-serif; min-width: 160px;">
      <strong style="font-size: 14px;">${name}</strong><br/>
      <span style="color: #155dfc; font-size: 12px; font-weight: 600;">${type}</span><br/>
      <span style="font-size: 12px; color: #555;">${meta}</span>
    </div>
  `
}

onMounted(async () => {
  try {
    await doctorStore.fetchAll()
  } catch (error) {
    console.error('Doctor loading failed', error)
  }

  await nextTick()
  initMap()
})

async function initMap() {
  if (!mapContainer.value) return

  if (!map) {
    map = L.map(mapContainer.value).setView(defaultCenter, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
  }

  await renderMarkers()
  map?.invalidateSize()
}

async function renderMarkers() {
  if (!map) return

  const currentVersion = ++renderVersion
  markerMap.forEach((marker) => marker.remove())
  markerMap.clear()

  const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

  const coordinates: Array<[number, number]> = []

  for (const doctor of filteredDoctors.value) {
    if (currentVersion !== renderVersion) return
    const coords = getDoctorMarkerCoords(doctor)

    coordinates.push(coords)
    const marker = L.marker(coords, { icon: markerIcon }).addTo(map)
    marker.bindPopup(buildPopupContent(doctor))
    markerMap.set(doctor.id, marker)

    marker.on('click', () => {
      selectDoctor(doctor)
      map?.setView(coords, Math.max(map.getZoom(), 14), { animate: true })
      marker.openPopup()
    })
  }

  if (coordinates.length === 1) {
    map.setView(coordinates[0], 14, { animate: true })
  } else if (coordinates.length > 1) {
    map.fitBounds(L.latLngBounds(coordinates), { padding: [40, 40] })
  } else {
    map.setView(defaultCenter, 12)
  }
}

function selectDoctor(doctor: Doctor) {
  selectedDoctor.value = doctor
  const marker = markerMap.get(doctor.id)
  if (marker && map) {
    const latlng = marker.getLatLng()
    map.flyTo(latlng, Math.max(map.getZoom(), 14), { animate: true, duration: 0.7 })
    marker.openPopup()
  }

  nextTick(() => {
    const card = document.querySelector<HTMLElement>(`[data-doctor-id="${doctor.id}"]`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function onFilter(filters: DoctorSearchFilters) {
  activeFilters.value = filters
  selectedDoctor.value = null
}

function goToDetail(doctorId: number) {
  router.push({ name: 'booking', params: { id: doctorId } })
}

watch(filteredDoctors, async () => {
  await renderMarkers()
  map?.invalidateSize()
}, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
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

  <div class="map-page">
    <DoctorFilter :initialFilters="activeFilters" @filter="onFilter" />

    <div class="map-controls">
      <router-link
        class="view-btn"
        :to="{ path: '/doctors', query: { doctorType: activeFilters.doctorType || undefined, city: activeFilters.city || undefined } }"
      >Listenansicht</router-link>
    </div>

    <div class="map-layout">
      <!-- Doctor list sidebar -->
      <aside class="doctor-sidebar">
        <template v-if="filteredDoctors.length">
          <div
            v-for="doctor in filteredDoctors"
            :key="doctor.id"
            class="sidebar-card"
            :class="{ active: selectedDoctor?.id === doctor.id }"
            :data-doctor-id="doctor.id"
            @click="selectDoctor(doctor)"
          >
            <h4>{{ formatDoctorName(doctor) }}</h4>
            <span class="sidebar-type">{{ getDoctorTypeName(doctor.doctorType) }}</span>
            <div class="sidebar-meta">
              <span v-if="doctor.rating !== null" class="meta-item">
                ⭐ {{ doctor.rating }}
              </span>
              <span v-if="doctor.distance !== null" class="meta-item">
                📍 {{ doctor.distance }} km
              </span>
            </div>
            <p v-if="doctor.street" class="sidebar-address">{{ doctor.street }}, {{ doctor.city }}</p>
            <button class="btn-book" @click.stop="goToDetail(doctor.id)">Termin buchen</button>
          </div>
        </template>
        <div v-else class="sidebar-empty">
          Keine Ärzte passen zu diesen Filtern.
        </div>
      </aside>

      <!-- Map area -->
      <div class="map-area">
        <div ref="mapContainer" class="map-container"></div>
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

.map-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.map-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 10px;
  background: #155dfc;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.3s;
}

.view-btn:hover {
  background: #0f4ad4;
}

.map-layout {
  display: flex;
  gap: 20px;
  height: 600px;
}

.doctor-sidebar {
  width: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
}

.sidebar-empty {
  padding: 18px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px dashed #d6def7;
  color: #6d7690;
  font-size: 14px;
  line-height: 1.4;
}

.sidebar-card {
  background: #fff;
  border: 2px solid #eee;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.sidebar-card:hover,
.sidebar-card.active {
  border-color: #155dfc;
  box-shadow: 0 4px 12px rgba(21, 93, 252, 0.12);
}

.sidebar-card h4 {
  margin: 0 0 4px;
  font-size: 16px;
  color: #333;
}

.sidebar-type {
  color: #155dfc;
  font-size: 13px;
  font-weight: 600;
}

.sidebar-meta {
  display: flex;
  gap: 12px;
  margin: 8px 0;
  font-size: 13px;
  color: #555;
}

.sidebar-address {
  font-size: 13px;
  color: #777;
  margin: 4px 0 12px;
}

.btn-book {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #155dfc;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-book:hover {
  background: #0f4ad4;
}

.map-area {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .map-layout {
    flex-direction: column;
    height: auto;
  }

  .doctor-sidebar {
    width: 100%;
    max-height: 300px;
  }

  .map-area {
    height: 400px;
  }
}
</style>
