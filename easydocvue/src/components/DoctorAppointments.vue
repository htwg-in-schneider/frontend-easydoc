<script setup lang="ts">
import { ref } from 'vue'
import { useDoctorStore, type Appointment } from '@/stores/doctors'
import { usePopupStore } from '@/stores/popup'

const props = defineProps<{
  doctorId: number
  appointments: Appointment[]
}>()

const emit = defineEmits<{
  added: []
  deleted: []
}>()

const doctorStore = useDoctorStore()
const popup = usePopupStore()

const showForm = ref(false)
const form = ref({
  date: '',
  time: '',
  price: 0,
})

async function onAdd() {
  if (!form.value.date || !form.value.time) {
    await popup.showMessage({
      title: 'Termin unvollständig',
      message: 'Bitte Datum und Uhrzeit ausfüllen.',
      variant: 'warning',
    })
    return
  }
  await doctorStore.addAppointment({
    date: form.value.date,
    time: form.value.time,
    price: form.value.price,
    doctor: { id: props.doctorId },
  })
  form.value = { date: '', time: '', price: 0 }
  showForm.value = false
  emit('added')
}

function userName(appointment: Appointment) {
  const user = appointment.user
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Termin ohne Patient'
}

async function onDelete(id: number) {
  const confirmed = await popup.showConfirmation({
    title: 'Termin löschen',
    message: 'Termin wirklich löschen?',
    confirmLabel: 'Löschen',
    variant: 'danger',
  })

  if (!confirmed) return
  await doctorStore.removeAppointment(id)
  emit('deleted')
}
</script>

<template>
  <div class="appointments-section">
    <div class="appointments-header">
      <h3>Termine ({{ appointments.length }})</h3>
      <button class="btn btn-primary btn-sm" @click="showForm = !showForm">
        {{ showForm ? 'Abbrechen' : '+ Neuer Termin' }}
      </button>
    </div>

    <form v-if="showForm" class="appointment-form" novalidate @submit.prevent="onAdd">
      <div class="form-row">
        <input v-model="form.date" type="date" required>
        <input v-model="form.time" type="time" required>
      </div>
      <input v-model.number="form.price" type="number" min="0" step="0.01" placeholder="Preis">
      <button type="submit" class="btn btn-primary btn-sm">Hinzufügen</button>
    </form>

    <div v-if="appointments.length === 0" class="no-appointments">
      <p>Keine Termine vorhanden.</p>
    </div>

    <div v-else class="appointment-list">
      <div v-for="appt in appointments" :key="appt.id" class="appointment-card">
        <div class="appointment-info">
          <strong>{{ userName(appt) }}</strong>
          <span class="appointment-date">
            {{ appt.date }}<span v-if="appt.time"> um {{ appt.time }}</span>
          </span>
          <span v-if="appt.price !== null" class="appointment-desc">{{ appt.price }} EUR</span>
        </div>
        <button class="btn-delete" @click="onDelete(appt.id)">✕</button>
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

.appointment-form {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row input {
  flex: 1;
}

.appointment-form input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.appointment-form input:focus {
  outline: none;
  border-color: #155dfc;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.appointment-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #eee;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appointment-date {
  font-size: 13px;
  color: #666;
}

.appointment-desc {
  font-size: 13px;
  color: #888;
}

.btn-delete {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-delete:hover {
  background: #fee;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.no-appointments {
  text-align: center;
  color: #888;
  padding: 20px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
