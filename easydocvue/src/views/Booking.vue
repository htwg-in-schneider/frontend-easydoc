<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDoctorStore, formatDoctorName, getDoctorTypeName } from '@/stores/doctors'
import type { Doctor } from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { buildGoogleMapsUrl, buildMailtoUrl, buildTelUrl, formatDoctorAddress, toExternalUrl } from '@/utils/doctorContact'

const router = useRouter()
const route = useRoute()
const doctorStore = useDoctorStore()

const doctor = ref<Doctor | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) {
    router.push('/doctors')
    return
  }
  doctor.value = await doctorStore.getById(id)
  loading.value = false
})

function goToSlotSelection() {
  if (doctor.value) {
    router.push({ path: '/slot-selection', query: { doctorId: String(doctor.value.id) } })
  }
}
</script>

<template>
  <NavBar />
  <div class="booking-page">
    <div class="booking-container">
      <h1 class="booking-title">Terminbuchung</h1>

      <div v-if="loading" class="loading">Laden...</div>

      <div v-else-if="doctor" class="doctor-booking-card">
        <div class="doctor-info">
          <div class="doctor-avatar">
            <v-icon size="64" color="#155dfc">mdi-doctor</v-icon>
          </div>
          <div class="doctor-details">
            <h2>{{ formatDoctorName(doctor) }}</h2>
            <span class="doctor-type">{{ getDoctorTypeName(doctor.doctorType) }}</span>
            <div class="doctor-meta">
              <span v-if="doctor.rating !== null" class="meta-item">⭐ {{ doctor.rating }}</span>
              <span v-if="doctor.distance !== null" class="meta-item">📍 {{ doctor.distance }} km</span>
            </div>
            <div class="doctor-contact">
              <a v-if="buildGoogleMapsUrl(doctor)" class="contact-link" :href="buildGoogleMapsUrl(doctor)" target="_blank" rel="noopener noreferrer">
                <v-icon size="16">mdi-map-marker</v-icon>
                <span>{{ formatDoctorAddress(doctor) }}</span>
              </a>
              <a v-if="doctor.phoneNumber" class="contact-link" :href="buildTelUrl(doctor.phoneNumber)">
                <v-icon size="16">mdi-phone</v-icon>
                <span>{{ doctor.phoneNumber }}</span>
              </a>
              <a v-if="doctor.email" class="contact-link" :href="buildMailtoUrl(doctor.email)">
                <v-icon size="16">mdi-email</v-icon>
                <span>{{ doctor.email }}</span>
              </a>
              <a v-if="doctor.website" class="contact-link" :href="toExternalUrl(doctor.website)" target="_blank" rel="noopener noreferrer">
                <v-icon size="16">mdi-web</v-icon>
                <span>{{ doctor.website }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="booking-action">
          <p class="action-text">Möchten Sie einen freien Termin bei diesem Arzt buchen?</p>
          <button class="btn-book" @click="goToSlotSelection">Termin auswählen</button>
        </div>
      </div>

      <div v-else class="not-found">
        <p>Arzt nicht gefunden.</p>
        <router-link to="/doctors" class="btn-back">Zurück zur Übersicht</router-link>
      </div>
    </div>
  </div>
  <AppFooter />
</template>

<style scoped>
.booking-page {
  min-height: calc(100vh - 75px - 200px);
  background: #f8fafc;
  padding: 40px 20px;
}

.booking-container {
  max-width: 700px;
  margin: 0 auto;
}

.booking-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 32px;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 18px;
  padding: 40px 0;
}

.doctor-booking-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.doctor-info {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.doctor-avatar {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #eef3fb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doctor-details h2 {
  margin: 0 0 4px;
  font-size: 22px;
  color: #333;
}

.doctor-type {
  color: #155dfc;
  font-size: 15px;
  font-weight: 600;
}

.doctor-meta {
  display: flex;
  gap: 16px;
  margin: 10px 0;
  font-size: 14px;
  color: #555;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.doctor-contact {
  margin-top: 12px;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  color: #555;
  font-size: 14px;
  text-decoration: none;
  width: fit-content;
}

.contact-link:hover {
  color: #155dfc;
}

.contact-link:focus-visible {
  outline: 2px solid #155dfc;
  outline-offset: 3px;
  border-radius: 6px;
}

.booking-action {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #eee;
  text-align: center;
}

.action-text {
  font-size: 16px;
  color: #555;
  margin-bottom: 16px;
}

.btn-book {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 40px;
  border: none;
  border-radius: 10px;
  background: #155dfc;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-book:hover {
  background: #0f4ad4;
}

.not-found {
  text-align: center;
  padding: 40px 0;
}

.not-found p {
  font-size: 18px;
  color: #666;
  margin-bottom: 16px;
}

.btn-back {
  display: inline-flex;
  padding: 12px 24px;
  border-radius: 10px;
  background: #155dfc;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 600px) {
  .doctor-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .doctor-meta {
    justify-content: center;
  }

  .contact-link {
    justify-content: center;
    width: 100%;
  }
}
</style>
