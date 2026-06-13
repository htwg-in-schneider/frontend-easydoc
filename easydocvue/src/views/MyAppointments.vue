<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, formatDoctorName, getDoctorTypeName, type Appointment, type Doctor } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const { isAuthenticated, getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { profile, isLoading: isProfileLoading } = storeToRefs(profileStore)

const appointments = ref<Appointment[]>([])
const isAppointmentsLoading = ref(false)
const errorMessage = ref('')
const expandedAppointmentId = ref<number | null>(null)

const isAdmin = computed(() => profile.value?.role === 'ADMIN')
const isDoctor = computed(() => profile.value?.role === 'DOCTOR')
const pageTitle = computed(() => (isAdmin.value ? 'Alle Termine' : 'Meine Termine'))
const isLoading = computed(() => isProfileLoading.value || isAppointmentsLoading.value)
const emptyMessage = computed(() =>
  isAdmin.value ? 'Keine bevorstehenden Termine.' : isDoctor.value ? 'Keine bevorstehenden Patiententermine.' : 'Keine bevorstehenden Termine.',
)

function doctor(appointment: Appointment): Doctor | null {
  return appointment.doctor ?? null
}

function userName(appointment: Appointment) {
  const user = appointment.patient ?? appointment.user
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Patient unbekannt'
}

function doctorName(appointment: Appointment) {
  const currentDoctor = doctor(appointment)
  return currentDoctor ? formatDoctorName(currentDoctor) || 'Arzt unbekannt' : 'Arzt unbekannt'
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

function doctorAddress(appointment: Appointment) {
  const currentDoctor = doctor(appointment)
  if (!currentDoctor) return 'Adresse nicht hinterlegt'

  return [currentDoctor.street, currentDoctor.postcode, currentDoctor.city, currentDoctor.country]
    .filter(Boolean)
    .join(', ')
}

function doctorContact(appointment: Appointment) {
  const currentDoctor = doctor(appointment)
  if (!currentDoctor) return 'Kontakt nicht hinterlegt'

  return [currentDoctor.phoneNumber, currentDoctor.email].filter(Boolean).join(' · ') || 'Kontakt nicht hinterlegt'
}

function isExpanded(appointmentId: number) {
  return expandedAppointmentId.value === appointmentId
}

function toggleAppointment(appointmentId: number) {
  expandedAppointmentId.value = expandedAppointmentId.value === appointmentId ? null : appointmentId
}

function canCancel(appointment: Appointment) {
  if (isAdmin.value) return true
  if (!profile.value?.id) return false
  if (isDoctor.value) return appointment.doctor?.id === profile.value.id
  const user = appointment.patient ?? appointment.user
  return user?.id === profile.value.id
}

function formatDate(dateTime: string) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateTime))
}

function formatPrice(price: number | null) {
  if (price === null) return ''
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price)
}

async function onCancel(appointment: Appointment) {
  const confirmed = await popup.showConfirmation({
    title: 'Termin stornieren',
    message: 'Möchten Sie diesen Termin wirklich stornieren?',
    confirmLabel: 'Stornieren',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    const token = await getAccessTokenSilently()
    await doctorStore.cancelAppointment(appointment.id, token)
    expandedAppointmentId.value = null
    await loadAppointments()
  } catch (error) {
    await popup.showMessage({
      title: 'Stornierung fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Der Termin konnte nicht storniert werden.',
      variant: 'danger',
    })
  }
}

async function loadAppointments() {
  if (!isAuthenticated.value) return

  isAppointmentsLoading.value = true
  errorMessage.value = ''

  try {
    const token = await getAccessTokenSilently()
    await profileStore.load(token, true)
    if (isAdmin.value) {
      appointments.value = await doctorStore.getAllAppointments(token)
    } else if (isDoctor.value && profile.value?.id) {
      appointments.value = await doctorStore.getAppointments(profile.value.id, token)
    } else {
      appointments.value = await doctorStore.getMyAppointments(token)
    }
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
        <h1>{{ pageTitle }}</h1>
        <span v-if="profile?.role" class="role-pill">
          {{ isAdmin ? 'Admin' : isDoctor ? 'Arzt' : 'Patient' }}
        </span>
      </div>

      <p v-if="isLoading" class="appointments-message">Termine werden geladen...</p>
      <p v-else-if="errorMessage" class="appointments-message appointments-error">{{ errorMessage }}</p>
      <p v-else-if="appointments.length === 0" class="appointments-message">{{ emptyMessage }}</p>

      <div v-else class="appointments-list">
        <article
          v-for="appointment in appointments"
          :key="appointment.id"
          class="appointment-card"
          :class="{ 'is-expanded': isExpanded(appointment.id) }"
          role="button"
          tabindex="0"
          :aria-expanded="isExpanded(appointment.id)"
          @click="toggleAppointment(appointment.id)"
          @keydown.enter.self.prevent="toggleAppointment(appointment.id)"
          @keydown.space.self.prevent="toggleAppointment(appointment.id)"
        >
          <div class="appointment-summary">
            <div class="appointment-date">
              <span>{{ formatDate(appointment.startDateTime) }}</span>
            </div>

            <div class="appointment-info">
              <h2>{{ primaryName(appointment) }}</h2>
              <p>{{ appointmentDetails(appointment) }}</p>
            </div>

            <span v-if="formatPrice(appointment.price)" class="appointment-price">
              {{ formatPrice(appointment.price) }}
            </span>

            <span class="appointment-status" :class="`status-${appointment.status.toLowerCase()}`">
              {{ appointment.status }}
            </span>

            <v-icon class="appointment-chevron" size="20">
              {{ isExpanded(appointment.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </div>

          <div v-if="isExpanded(appointment.id)" class="appointment-expanded" @click.stop>
            <div class="appointment-expanded-grid">
              <div class="appointment-detail">
                <span class="detail-label">Arzt</span>
                <strong>{{ doctorName(appointment) }}</strong>
                <span v-if="appointment.doctor?.practiceName">{{ appointment.doctor.practiceName }}</span>
                <span v-if="appointment.doctor?.doctorType?.name">{{ getDoctorTypeName(appointment.doctor.doctorType) }}</span>
              </div>

              <div class="appointment-detail">
                <span class="detail-label">Adresse</span>
                <span>{{ doctorAddress(appointment) }}</span>
                <span v-if="appointment.doctor?.distance !== null && appointment.doctor?.distance !== undefined">
                  {{ appointment.doctor.distance }} km entfernt
                </span>
              </div>

              <div class="appointment-detail">
                <span class="detail-label">Kontakt</span>
                <span>{{ doctorContact(appointment) }}</span>
                <span v-if="appointment.doctor?.website">{{ appointment.doctor.website }}</span>
              </div>

              <div class="appointment-detail">
                <span class="detail-label">Termin</span>
                <span>{{ formatDate(appointment.startDateTime) }}</span>
                <span>{{ new Date(appointment.startDateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }} - {{ new Date(appointment.endDateTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }}</span>
                <span v-if="formatPrice(appointment.price)">{{ formatPrice(appointment.price) }}</span>
                <span v-if="isAdmin || isDoctor">Patient: {{ userName(appointment) }}</span>
                <span>Status: {{ appointment.status }}</span>
              </div>
            </div>

            <div class="appointment-actions">
              <button
                v-if="canCancel(appointment)"
                type="button"
                class="btn-cancel"
                @click.stop="onCancel(appointment)"
              >
                Termin stornieren
              </button>
            </div>
          </div>
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
  gap: 14px;
  padding: 18px 20px;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  outline: none;
}

.appointment-card:hover,
.appointment-card:focus-visible {
  transform: translateY(-1px);
  border-color: #155dfc;
  box-shadow: 0 10px 24px rgba(21, 93, 252, 0.12);
}

.appointment-summary {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto auto;
  gap: 18px;
  align-items: center;
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

.appointment-chevron {
  color: #155dfc;
}

.appointment-expanded {
  display: grid;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #edf1f8;
}

.appointment-expanded-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.appointment-detail {
  display: grid;
  gap: 4px;
  color: #1f2a44;
  font-size: 14px;
}

.detail-label {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0;
}

.appointment-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 168px;
  height: 42px;
  padding: 0 18px;
  color: #fff;
  background: #dc3545;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #b02a37;
}

@media (max-width: 640px) {
  .appointments-panel {
    padding: 24px;
  }

  .appointments-header,
  .appointment-card {
    align-items: flex-start;
  }

  .appointment-summary,
  .appointment-expanded-grid {
    grid-template-columns: 1fr;
  }

  .appointment-card {
    gap: 12px;
  }
}
</style>
