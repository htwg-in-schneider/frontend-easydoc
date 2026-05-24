<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDoctorStore, type DoctorPayload, type DoctorType } from '@/stores/doctors'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const router = useRouter()
const doctorStore = useDoctorStore()
const popup = usePopupStore()
const { doctorTypes } = storeToRefs(doctorStore)

type DoctorForm = Omit<DoctorPayload, 'doctorType'>

const form = ref<DoctorForm>({
  title: '',
  firstName: '',
  lastName: '',
  practiceName: '',
  status: '',
  rating: null,
  phoneNumber: '',
  email: '',
  website: '',
  distance: null,
  imageUrl: null,
  street: '',
  postcode: '',
  city: '',
  country: '',
})

const doctorId = ref(0)
const doctorTypeId = ref<number | null>(null)
const currentDoctorType = ref<DoctorType | null>(null)

onMounted(async () => {
  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    await popup.showMessage({
      title: 'Ungültige Arzt-ID',
      message: 'Diese Arzt-ID ist ungültig.',
      variant: 'warning',
    })
    router.push('/doctors')
    return
  }

  try {
    await doctorStore.fetchDoctorTypes()
  } catch (error) {
    console.error('Doctor type loading failed', error)
  }

  const doctor = await doctorStore.getById(id)
  if (!doctor) {
    await popup.showMessage({
      title: 'Arzt nicht gefunden',
      message: 'Der ausgewählte Arzt wurde nicht gefunden.',
      variant: 'warning',
    })
    router.push('/doctors')
    return
  }
  doctorId.value = id
  doctorTypeId.value = doctor.doctorType?.id ?? null
  currentDoctorType.value = doctor.doctorType
  form.value = {
    title: doctor.title,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    practiceName: doctor.practiceName,
    status: doctor.status,
    rating: doctor.rating,
    phoneNumber: doctor.phoneNumber,
    email: doctor.email,
    website: doctor.website,
    distance: doctor.distance,
    imageUrl: doctor.imageUrl,
    street: doctor.street,
    postcode: doctor.postcode,
    city: doctor.city,
    country: doctor.country,
  }
})

function selectedDoctorType(): DoctorType | null {
  return doctorTypes.value.find((type) => type.id === doctorTypeId.value) ?? currentDoctorType.value
}

function toDoctorPayload(): DoctorPayload {
  return {
    ...form.value,
    doctorType: selectedDoctorType(),
  }
}

async function onUpdate() {
  if (!form.value.firstName || !form.value.lastName || !form.value.practiceName || !doctorTypeId.value) {
    await popup.showMessage({
      title: 'Pflichtfelder fehlen',
      message: 'Bitte alle Pflichtfelder ausfüllen.',
      variant: 'warning',
    })
    return
  }
  await doctorStore.update(doctorId.value, toDoctorPayload())
  await popup.showMessage({
    title: 'Arzt aktualisiert',
    message: 'Arzt erfolgreich aktualisiert.',
    variant: 'success',
  })
  router.push('/doctors')
}

async function onDelete() {
  const confirmed = await popup.showConfirmation({
    title: 'Arzt löschen',
    message: 'Möchten Sie diesen Arzt wirklich löschen?',
    confirmLabel: 'Löschen',
    variant: 'danger',
  })

  if (!confirmed) return
  await doctorStore.remove(doctorId.value)
  await popup.showMessage({
    title: 'Arzt gelöscht',
    message: 'Arzt erfolgreich gelöscht.',
    variant: 'success',
  })
  router.push('/doctors')
}
</script>

<template>
  <NavBar />

  <div class="form-container">
    <h2>Arzt bearbeiten</h2>

    <form novalidate @submit.prevent="onUpdate">
      <div class="form-group">
        <label for="id">ID</label>
        <input id="id" type="text" :value="doctorId" readonly>
      </div>

      <div class="form-group">
        <label for="title">Titel</label>
        <input id="title" type="text" v-model="form.title" placeholder="z.B. Dr. med.">
      </div>

      <div class="form-group">
        <label for="firstName">Vorname *</label>
        <input id="firstName" type="text" v-model="form.firstName" required>
      </div>

      <div class="form-group">
        <label for="lastName">Nachname *</label>
        <input id="lastName" type="text" v-model="form.lastName" required>
      </div>

      <div class="form-group">
        <label for="practiceName">Praxisname *</label>
        <input id="practiceName" type="text" v-model="form.practiceName" required>
      </div>

      <div class="form-group">
        <label for="doctorType">Fachrichtung *</label>
        <select id="doctorType" v-model.number="doctorTypeId" required>
          <option value="" disabled>Bitte wählen</option>
          <option v-for="type in doctorTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="status">Status</label>
        <input id="status" type="text" v-model="form.status">
      </div>

      <div class="form-group">
        <label for="rating">Bewertung</label>
        <input id="rating" type="number" v-model.number="form.rating" min="0" max="5" step="0.1">
      </div>

      <div class="form-group">
        <label for="phoneNumber">Telefon</label>
        <input id="phoneNumber" type="tel" v-model="form.phoneNumber">
      </div>

      <div class="form-group">
        <label for="email">E-Mail</label>
        <input id="email" type="email" v-model="form.email">
      </div>

      <div class="form-group">
        <label for="website">Website</label>
        <input id="website" type="text" v-model="form.website">
      </div>

      <div class="form-group">
        <label for="street">Straße</label>
        <input id="street" type="text" v-model="form.street">
      </div>

      <div class="form-group">
        <label for="postcode">Postleitzahl</label>
        <input id="postcode" type="text" v-model="form.postcode">
      </div>

      <div class="form-group">
        <label for="city">Stadt</label>
        <input id="city" type="text" v-model="form.city">
      </div>

      <div class="form-group">
        <label for="country">Land</label>
        <input id="country" type="text" v-model="form.country">
      </div>

      <div class="form-group">
        <label for="distance">Entfernung (km)</label>
        <input id="distance" type="number" v-model.number="form.distance" min="0" step="0.1">
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
