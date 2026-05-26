<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useDoctorStore, type DoctorPayload, type DoctorType } from '@/stores/doctors'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const { getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const popup = usePopupStore()
const { doctorTypes } = storeToRefs(doctorStore)

type DoctorForm = Omit<DoctorPayload, 'doctorType'>

const form = ref<DoctorForm>({
  title: 'Dr. med.',
  firstName: '',
  lastName: '',
  practiceName: '',
  status: 'active',
  rating: 0,
  phoneNumber: '',
  email: '',
  website: '',
  distance: 0,
  imageUrl: null,
  street: '',
  postcode: '',
  city: '',
  country: 'Germany',
})
const doctorTypeId = ref<number | null>(null)

onMounted(async () => {
  try {
    await doctorStore.fetchDoctorTypes()
    doctorTypeId.value = doctorTypes.value[0]?.id ?? null
  } catch (error) {
    console.error('Doctor type loading failed', error)
  }
})

function selectedDoctorType(): DoctorType | null {
  return doctorTypes.value.find((type) => type.id === doctorTypeId.value) ?? null
}

function toDoctorPayload(): DoctorPayload {
  return {
    ...form.value,
    doctorType: selectedDoctorType(),
  }
}

async function onCreate() {
  if (!form.value.firstName || !form.value.lastName || !form.value.practiceName || !doctorTypeId.value) {
    await popup.showMessage({
      title: 'Pflichtfelder fehlen',
      message: 'Bitte alle Pflichtfelder ausfüllen.',
      variant: 'warning',
    })
    return
  }
  const token = await getAccessTokenSilently()
  await doctorStore.add(toDoctorPayload(), token)
  await popup.showMessage({
    title: 'Arzt erstellt',
    message: 'Arzt erfolgreich erstellt.',
    variant: 'success',
  })
  router.push('/doctors')
}
</script>

<template>
  <NavBar />

  <div class="form-container">
    <h2>Neuen Arzt anlegen</h2>

    <form novalidate @submit.prevent="onCreate">
      <div class="form-group">
        <label for="title">Titel</label>
        <input id="title" type="text" v-model="form.title" placeholder="z.B. Dr. med.">
      </div>

      <div class="form-group">
        <label for="firstName">Vorname *</label>
        <input id="firstName" type="text" v-model="form.firstName" placeholder="z.B. Hans" required>
      </div>

      <div class="form-group">
        <label for="lastName">Nachname *</label>
        <input id="lastName" type="text" v-model="form.lastName" placeholder="z.B. Müller" required>
      </div>

      <div class="form-group">
        <label for="practiceName">Praxisname *</label>
        <input
          id="practiceName"
          type="text"
          v-model="form.practiceName"
          placeholder="z.B. Praxis Müller"
          required
        >
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
        <input id="status" type="text" v-model="form.status" placeholder="active">
      </div>

      <div class="form-group">
        <label for="rating">Bewertung</label>
        <input id="rating" type="number" v-model.number="form.rating" min="0" max="5" step="0.1">
      </div>

      <div class="form-group">
        <label for="phoneNumber">Telefon</label>
        <input id="phoneNumber" type="tel" v-model="form.phoneNumber" placeholder="+49 123 456789">
      </div>

      <div class="form-group">
        <label for="email">E-Mail</label>
        <input id="email" type="email" v-model="form.email" placeholder="kontakt@praxis.de">
      </div>

      <div class="form-group">
        <label for="website">Website</label>
        <input id="website" type="text" v-model="form.website" placeholder="www.praxis.de">
      </div>

      <div class="form-group">
        <label for="street">Straße</label>
        <input id="street" type="text" v-model="form.street" placeholder="Hauptstraße 10">
      </div>

      <div class="form-group">
        <label for="postcode">Postleitzahl</label>
        <input id="postcode" type="text" v-model="form.postcode" placeholder="70001">
      </div>

      <div class="form-group">
        <label for="city">Stadt</label>
        <input id="city" type="text" v-model="form.city" placeholder="Stuttgart">
      </div>

      <div class="form-group">
        <label for="country">Land</label>
        <input id="country" type="text" v-model="form.country" placeholder="Germany">
      </div>

      <div class="form-group">
        <label for="distance">Entfernung (km)</label>
        <input id="distance" type="number" v-model.number="form.distance" min="0" step="0.1">
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Erstellen</button>
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

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
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
</style>
