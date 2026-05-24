<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDoctorStore, formatDoctorName, getDoctorTypeName } from '@/stores/doctors'
import type { Doctor } from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()
const doctorStore = useDoctorStore()
const { doctors } = storeToRefs(doctorStore)

const mapContainer = ref<HTMLElement | null>(null)
const selectedDoctor = ref<Doctor | null>(null)
let map: L.Map | null = null
const markerMap = new Map<number, L.Marker>()

// Default center: Konstanz Petershausen
const defaultCenter: [number, number] = [47.6725, 9.1732]

// Filtered and sorted: max 5km distance, highest rating first
const filteredDoctors = computed(() => {
  return doctors.value
    .filter(d => d.distance !== null && d.distance <= 5)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
})

async function geocodeAddress(doctor: Doctor): Promise<[number, number] | null> {
  const parts = [doctor.street, doctor.postcode, doctor.city, doctor.country].filter(Boolean)
  if (parts.length === 0) return null

  const query = encodeURIComponent(parts.join(', '))
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`)
    const data = await res.json()
    if (data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
  } catch (e) {
    console.error('Geocoding failed for', parts.join(', '), e)
  }
  return null
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

  map = L.map(mapContainer.value).setView(defaultCenter, 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  const markerIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

  for (const doctor of filteredDoctors.value) {
    const coords = await geocodeAddress(doctor)
    if (!coords) continue

    const marker = L.marker(coords, { icon: markerIcon }).addTo(map!)
    marker.bindPopup(buildPopupContent(doctor))
    markerMap.set(doctor.id, marker)

    marker.on('click', () => {
      selectedDoctor.value = doctor
      map!.setView(coords, 16, { animate: true })
      marker.openPopup()
    })
  }
}

function selectDoctor(doctor: Doctor) {
  selectedDoctor.value = doctor
  const marker = markerMap.get(doctor.id)
  if (marker && map) {
    const latlng = marker.getLatLng()
    map.setView(latlng, 16, { animate: true })
    marker.openPopup()
  }
}

function goToDetail(doctorId: number) {
  router.push({ name: 'booking', params: { id: doctorId } })
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

  <div class="map-page">
    <div class="map-controls">
      <router-link class="view-btn" to="/doctors">Listenansicht</router-link>
    </div>

    <div class="map-layout">
      <!-- Doctor list sidebar -->
      <aside class="doctor-sidebar">
        <div
          v-for="doctor in filteredDoctors"
          :key="doctor.id"
          class="sidebar-card"
          :class="{ active: selectedDoctor?.id === doctor.id }"
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
