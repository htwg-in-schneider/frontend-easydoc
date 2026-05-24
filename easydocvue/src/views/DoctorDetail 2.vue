<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  formatDoctorName,
  getDoctorTypeName,
  useDoctorStore,
  type Doctor,
  type Appointment,
} from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorAppointments from '@/components/DoctorAppointments.vue'

const route = useRoute()
const doctorStore = useDoctorStore()
const doctor = ref<Doctor | null>(null)
const appointments = ref<Appointment[]>([])

function toExternalUrl(url: string | null) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

onMounted(async () => {
  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    doctor.value = null
    return
  }

  doctor.value = await doctorStore.getById(id)
  if (doctor.value) {
    appointments.value = await doctorStore.getAppointments(id)
  }
})

async function onAppointmentAdded() {
  if (doctor.value) {
    appointments.value = await doctorStore.getAppointments(doctor.value.id)
  }
}

async function onAppointmentDeleted() {
  if (doctor.value) {
    appointments.value = await doctorStore.getAppointments(doctor.value.id)
  }
}
</script>

<template>
  <NavBar />

  <section class="detail-container" v-if="doctor">
    <div class="detail-card">
      <div class="detail-icon">
        <v-icon size="80" color="#155dfc">mdi-doctor</v-icon>
      </div>

      <h2>{{ formatDoctorName(doctor) }}</h2>
      <p class="practice-name" v-if="doctor.practiceName">{{ doctor.practiceName }}</p>
      <span class="doctor-type-badge">
        {{ getDoctorTypeName(doctor.doctorType) }}
      </span>

      <div class="detail-info">
        <div class="info-row" v-if="doctor.rating !== undefined && doctor.rating !== null">
          <v-icon size="20" class="mr-2">mdi-star</v-icon>
          <span>Bewertung: {{ doctor.rating }}</span>
        </div>
        <div class="info-row">
          <v-icon size="20" class="mr-2">mdi-stethoscope</v-icon>
          <span>{{ getDoctorTypeName(doctor.doctorType) }}</span>
        </div>
        <div class="info-row" v-if="doctor.city || doctor.country">
          <v-icon size="20" class="mr-2">mdi-map-marker</v-icon>
          <span>{{ doctor.city }}<span v-if="doctor.city && doctor.country">, </span>{{ doctor.country }}</span>
        </div>
        <div class="info-row" v-if="doctor.phoneNumber">
          <v-icon size="20" class="mr-2">mdi-phone</v-icon>
          <span>{{ doctor.phoneNumber }}</span>
        </div>
        <div class="info-row" v-if="doctor.email">
          <v-icon size="20" class="mr-2">mdi-email</v-icon>
          <span>{{ doctor.email }}</span>
        </div>
        <div class="info-row" v-if="doctor.website">
          <v-icon size="20" class="mr-2">mdi-web</v-icon>
          <a :href="toExternalUrl(doctor.website)" target="_blank" rel="noopener noreferrer">
            {{ doctor.website }}
          </a>
        </div>
        <div class="info-row" v-if="doctor.distance !== undefined && doctor.distance !== null">
          <v-icon size="20" class="mr-2">mdi-map-marker-distance</v-icon>
          <span>{{ doctor.distance }} km entfernt</span>
        </div>
      </div>

      <div class="detail-actions">
        <router-link class="btn btn-primary" :to="{ name: 'doctor-edit', params: { id: doctor.id } }">
          Bearbeiten
        </router-link>
        <router-link class="btn btn-secondary" to="/doctors">
          ← Zurück
        </router-link>
      </div>
    </div>

    <DoctorAppointments
      :doctor-id="doctor.id"
      :appointments="appointments"
      @added="onAppointmentAdded"
      @deleted="onAppointmentDeleted"
    />
  </section>

  <section class="detail-container" v-else>
    <div class="detail-card">
      <p>Arzt wurde nicht gefunden.</p>
      <router-link class="btn btn-secondary" to="/doctors">← Zurück</router-link>
    </div>
  </section>

  <AppFooter />
</template>

<style scoped>
.detail-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 60px 20px;
}

.detail-card {
  background: #fff;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.detail-icon {
  margin-bottom: 16px;
}

.detail-card h2 {
  font-size: 28px;
  margin: 0 0 12px;
  color: #333;
}
.practice-name {
  margin: -4px 0 16px;
  color: #666;
  font-size: 16px;
}

.doctor-type-badge {
  display: inline-block;
  background: #155dfc;
  color: #fff;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-bottom: 32px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #555;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 28px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.3s;
}

.btn-secondary {
  background: #f0f6fe;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dce8fd;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

@media (max-width: 600px) {
  .detail-card {
    padding: 24px;
  }

  .detail-card h2 {
    font-size: 22px;
  }
}
</style>
