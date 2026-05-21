<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDoctorStore, type Doctor, type Appointment } from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import DoctorAppointments from '@/components/DoctorAppointments.vue'

const doctorTypeLabels: Record<string, string> = {
  GENERAL_PRACTITIONER: 'Hausarzt',
  CARDIOLOGIST: 'Kardiologe',
  DERMATOLOGIST: 'Dermatologe',
  ORTHOPEDIST: 'Orthopäde',
  NEUROLOGIST: 'Neurologe',
}

const route = useRoute()
const doctorStore = useDoctorStore()
const doctor = ref<Doctor | null>(null)
const appointments = ref<Appointment[]>([])

onMounted(async () => {
  const id = Number(route.params.id)
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

      <h2>Dr. {{ doctor.name }} {{ doctor.surname }}</h2>
      <span class="doctor-type-badge">
        {{ doctorTypeLabels[doctor.doctorType] || doctor.doctorType }}
      </span>

      <div class="detail-info">
        <div class="info-row">
          <v-icon size="20" class="mr-2">mdi-cake-variant</v-icon>
          <span>Alter: {{ doctor.age }}</span>
        </div>
        <div class="info-row">
          <v-icon size="20" class="mr-2">mdi-stethoscope</v-icon>
          <span>{{ doctorTypeLabels[doctor.doctorType] || doctor.doctorType }}</span>
        </div>
      </div>

      <div class="detail-actions">
        <router-link class="btn btn-primary" :to="`/doctor/edit/${doctor.id}`">
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
