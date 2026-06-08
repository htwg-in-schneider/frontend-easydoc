<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, type Appointment } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const { isAuthenticated, getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const { profile, isLoading: isProfileLoading } = storeToRefs(profileStore)

const appointments = ref<Appointment[]>([])
const isAppointmentsLoading = ref(false)
const errorMessage = ref('')

const isAdmin = computed(() => profile.value?.role === 'ADMIN')
const isDoctor = computed(() => profile.value?.role === 'DOCTOR')
const isLoading = computed(() => isProfileLoading.value || isAppointmentsLoading.value)
const emptyMessage = computed(() =>
  isAdmin.value ? 'Keine bevorstehenden Termine.' : isDoctor.value ? 'Keine bevorstehenden Patiententermine.' : 'Keine bevorstehenden Termine.',
)

function userName(appointment: Appointment) {
  const user = appointment.user
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Patient unbekannt'
}

function doctorName(appointment: Appointment) {
  const doctor = appointment.doctor
  return [doctor?.title, doctor?.firstName, doctor?.lastName].filter(Boolean).join(' ') || 'Arzt unbekannt'
}

function primaryName(appointment: Appointment) {
  return isDoctor.value ? userName(appointment) : doctorName(appointment)
}

function appointmentDetails(appointment: Appointment) {
  if (isDoctor.value) return 'Patiententermin'
  if (isAdmin.value) {
    const doctor = [appointment.doctor?.practiceName, appointment.doctor?.city].filter(Boolean).join(' - ')
    const patient = [appointment.user?.firstName, appointment.user?.lastName].filter(Boolean).join(' ')
    return [doctor, patient ? `Patient: ${patient}` : ''].filter(Boolean).join(' | ')
  }
  return [appointment.doctor?.practiceName, appointment.doctor?.city].filter(Boolean).join(' - ')
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : 'Uhrzeit offen'
}

function formatPrice(price: number | null) {
  if (price === null) return ''
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)
}

async function loadAppointments() {
  if (!isAuthenticated.value) return

  isAppointmentsLoading.value = true
  errorMessage.value = ''

  try {
    const token = await getAccessTokenSilently()
    await profileStore.load(token)
    appointments.value = await doctorStore.getMyAppointments(token)
  } catch (error) {
    appointments.value = []
    errorMessage.value = error instanceof Error ? error.message : 'Termine konnten nicht geladen werden.'
  } finally {
    isAppointmentsLoading.value = false
  }
}

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadAppointments()
  } else {
    appointments.value = []
  }
}, { immediate: true })
</script>

<template>
  <NavBar />
  <main class="appointments-page">
    <section class="appointments-panel">
      <div class="appointments-header">
        <h1>Meine Termine</h1>
        <span v-if="profile?.role" class="role-pill">
          {{ isAdmin ? 'Admin' : isDoctor ? 'Arzt' : 'Patient' }}
        </span>
      </div>

      <p v-if="isLoading" class="appointments-message">Termine werden geladen...</p>
      <p v-else-if="errorMessage" class="appointments-message appointments-error">{{ errorMessage }}</p>
      <p v-else-if="appointments.length === 0" class="appointments-message">{{ emptyMessage }}</p>

      <div v-else class="appointments-list">
        <article v-for="appointment in appointments" :key="appointment.id" class="appointment-card">
          <div class="appointment-date">
            <span>{{ formatDate(appointment.date) }}</span>
            <strong>{{ formatTime(appointment.time) }}</strong>
          </div>

          <div class="appointment-info">
            <h2>{{ primaryName(appointment) }}</h2>
            <p>{{ appointmentDetails(appointment) }}</p>
          </div>

          <span v-if="formatPrice(appointment.price)" class="appointment-price">
            {{ formatPrice(appointment.price) }}
          </span>
        </article>
      </div>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.appointments-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px;
  background: #eef3fb;
}

.appointments-panel {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 8px;
}

.appointments-panel h1 {
  margin: 0;
  color: #1f2a44;
  font-size: 28px;
}

.appointments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.role-pill {
  padding: 5px 12px;
  color: #155dfc;
  font-size: 13px;
  font-weight: 700;
  background: #eef3fb;
  border-radius: 999px;
}

.appointments-message {
  margin: 0;
  color: #64708a;
}

.appointments-error {
  color: #b42318;
}

.appointments-list {
  display: grid;
  gap: 12px;
}

.appointment-card {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #edf1f8;
}

.appointment-date {
  display: grid;
  gap: 4px;
  color: #64708a;
  font-size: 14px;
}

.appointment-date strong {
  color: #1f2a44;
  font-size: 18px;
}

.appointment-info {
  min-width: 0;
}

.appointment-info h2 {
  margin: 0 0 4px;
  color: #1f2a44;
  font-size: 18px;
}

.appointment-info p {
  margin: 0;
  color: #64708a;
}

.appointment-price {
  color: #1f2a44;
  font-weight: 700;
}

@media (max-width: 640px) {
  .appointments-panel {
    padding: 24px;
  }

  .appointments-header,
  .appointment-card {
    align-items: flex-start;
  }

  .appointment-card {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
