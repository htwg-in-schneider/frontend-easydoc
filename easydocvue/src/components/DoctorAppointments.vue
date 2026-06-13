<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import { useDoctorStore, type Appointment } from '@/stores/doctors'
import { usePopupStore } from '@/stores/popup'

const props = defineProps<{
  doctorId: number
  appointments: Appointment[]
}>()

const emit = defineEmits<{
  deleted: []
}>()

const { getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const popup = usePopupStore()

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function patientName(appointment: Appointment) {
  const user = appointment.patient ?? appointment.user
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Patient unbekannt'
}

async function onCancel(id: number) {
  const confirmed = await popup.showConfirmation({
    title: 'Termin stornieren',
    message: 'Möchten Sie diesen Termin wirklich stornieren?',
    confirmLabel: 'Stornieren',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    const token = await getAccessTokenSilently()
    await doctorStore.cancelAppointment(id, token)
    emit('deleted')
  } catch (error) {
    await popup.showMessage({
      title: 'Stornierung fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Der Termin konnte nicht storniert werden.',
      variant: 'danger',
    })
  }
}
</script>

<template>
  <div class="appointments-section">
    <div class="appointments-header">
      <h3>Termine ({{ appointments.length }})</h3>
    </div>

    <div v-if="appointments.length === 0" class="no-appointments">
      <p>Keine Termine vorhanden.</p>
    </div>

    <div v-else class="appointment-list">
      <div v-for="appt in appointments" :key="appt.id" class="appointment-card">
        <div class="appointment-info">
          <strong>{{ patientName(appt) }}</strong>
          <span class="appointment-date">{{ formatDateTime(appt.startDateTime) }}</span>
          <span v-if="appt.reason" class="appointment-desc">{{ appt.reason }}</span>
          <span class="status-pill" :class="`status-${appt.status.toLowerCase()}`">{{ appt.status }}</span>
        </div>
        <button
          v-if="appt.status === 'BOOKED'"
          class="btn-delete"
          type="button"
          @click="onCancel(appt.id)"
        >
          Stornieren
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appointments-section {
  margin-top: 32px;
  text-align: left;
}

.appointments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.appointments-header h3 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appointment-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #eee;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.appointment-date {
  font-size: 13px;
  color: #666;
}

.appointment-desc {
  font-size: 13px;
  color: #888;
}

.status-pill {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-booked {
  color: #0f5132;
  background: #d1e7dd;
}

.status-cancelled {
  color: #842029;
  background: #f8d7da;
}

.status-completed {
  color: #055160;
  background: #cff4fc;
}

.btn-delete {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
}

.btn-delete:hover {
  background: #fee;
}

.no-appointments {
  text-align: center;
  color: #888;
  padding: 20px;
}
</style>
