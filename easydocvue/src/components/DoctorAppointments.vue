<script setup lang="ts">
import { ref } from 'vue'
import { useDoctorStore, type Appointment } from '@/stores/doctors'

const props = defineProps<{
  doctorId: number
  appointments: Appointment[]
}>()

const emit = defineEmits<{
  added: []
  deleted: []
}>()

const doctorStore = useDoctorStore()

const showForm = ref(false)
const form = ref({
  patientName: '',
  date: '',
  description: '',
})

async function onAdd() {
  if (!form.value.patientName || !form.value.date) {
    alert('Bitte Patientenname und Datum ausfüllen.')
    return
  }
  await doctorStore.addAppointment({
    patientName: form.value.patientName,
    date: form.value.date,
    description: form.value.description,
    doctor: { id: props.doctorId },
  })
  form.value = { patientName: '', date: '', description: '' }
  showForm.value = false
  emit('added')
}

async function onDelete(id: number) {
  if (!confirm('Termin wirklich löschen?')) return
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

    <form v-if="showForm" class="appointment-form" @submit.prevent="onAdd">
      <div class="form-row">
        <input v-model="form.patientName" type="text" placeholder="Patientenname *" required>
        <input v-model="form.date" type="date" required>
      </div>
      <input v-model="form.description" type="text" placeholder="Beschreibung">
      <button type="submit" class="btn btn-primary btn-sm">Hinzufügen</button>
    </form>

    <div v-if="appointments.length === 0" class="no-appointments">
      <p>Keine Termine vorhanden.</p>
    </div>

    <div v-else class="appointment-list">
      <div v-for="appt in appointments" :key="appt.id" class="appointment-card">
        <div class="appointment-info">
          <strong>{{ appt.patientName }}</strong>
          <span class="appointment-date">{{ appt.date }}</span>
          <span v-if="appt.description" class="appointment-desc">{{ appt.description }}</span>
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
