<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorStore } from '@/stores/doctors'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const router = useRouter()
const doctorStore = useDoctorStore()

const doctorTypes = [
  { value: 'GENERAL_PRACTITIONER', label: 'Hausarzt' },
  { value: 'CARDIOLOGIST', label: 'Kardiologe' },
  { value: 'DERMATOLOGIST', label: 'Dermatologe' },
  { value: 'ORTHOPEDIST', label: 'Orthopäde' },
  { value: 'NEUROLOGIST', label: 'Neurologe' },
]

const form = ref({
  name: '',
  surname: '',
  age: 30,
  doctorType: '',
})

const doctorId = ref(0)

onMounted(async () => {
  const id = Number(route.params.id)
  const doctor = await doctorStore.getById(id)
  if (!doctor) {
    alert('Arzt nicht gefunden.')
    router.push('/doctors')
    return
  }
  doctorId.value = id
  form.value = {
    name: doctor.name,
    surname: doctor.surname,
    age: doctor.age,
    doctorType: doctor.doctorType,
  }
})

async function onUpdate() {
  if (!form.value.name || !form.value.surname || !form.value.doctorType) {
    alert('Bitte alle Pflichtfelder ausfüllen.')
    return
  }
  await doctorStore.update(doctorId.value, form.value)
  alert('Arzt erfolgreich aktualisiert!')
  router.push('/doctors')
}

async function onDelete() {
  if (!confirm('Möchten Sie diesen Arzt wirklich löschen?')) return
  await doctorStore.remove(doctorId.value)
  alert('Arzt erfolgreich gelöscht!')
  router.push('/doctors')
}
</script>

<template>
  <NavBar />

  <div class="form-container">
    <h2>Arzt bearbeiten</h2>

    <form @submit.prevent="onUpdate">
      <div class="form-group">
        <label for="id">ID</label>
        <input id="id" type="text" :value="doctorId" readonly>
      </div>

      <div class="form-group">
        <label for="name">Vorname *</label>
        <input id="name" type="text" v-model="form.name" required>
      </div>

      <div class="form-group">
        <label for="surname">Nachname *</label>
        <input id="surname" type="text" v-model="form.surname" required>
      </div>

      <div class="form-group">
        <label for="age">Alter</label>
        <input id="age" type="number" v-model.number="form.age" min="25" max="99">
      </div>

      <div class="form-group">
        <label for="doctorType">Fachrichtung *</label>
        <select id="doctorType" v-model="form.doctorType" required>
          <option value="" disabled>Bitte wählen</option>
          <option v-for="type in doctorTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Aktualisieren</button>
        <button type="button" class="btn btn-danger" @click="onDelete">Löschen</button>
        <router-link class="btn btn-secondary" to="/doctors">Abbrechen</router-link>
      </div>
    </form>
  </div>

  <AppFooter />
</template>

<style scoped>
.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 60px 20px;
}

.form-container h2 {
  font-size: 28px;
  margin-bottom: 32px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #155dfc;
}

.form-group input[readonly] {
  background: #f5f5f5;
  color: #888;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 28px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  background: #f0f6fe;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dce8fd;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #b02a37;
}
</style>
