<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useDoctorStore, type DoctorType } from '@/stores/doctors'
import { API_BASE, useProfileStore, type BackendProfile, type UserRole } from '@/stores/profile'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const roles: UserRole[] = ['USER', 'DOCTOR', 'ADMIN']

const route = useRoute()
const router = useRouter()
const { getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { doctorTypes } = storeToRefs(doctorStore)

const userId = ref(0)
const doctorTypeId = ref<number | null>(null)
const currentDoctorType = ref<DoctorType | null>(null)
const isLoading = ref(true)

const form = ref<BackendProfile>({
  id: null,
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  role: 'USER',
  auth0Id: null,
  insurance: '',
  status: '',
  age: null,
  birthday: '',
  title: '',
  practiceName: '',
  rating: null,
  phoneNumber: '',
  website: '',
  street: '',
  postcode: '',
  city: '',
  country: '',
  imageUrl: '',
  distance: null,
  consultationFee: null,
  doctorType: null,
})

const isDoctorRole = computed(() => form.value.role === 'DOCTOR')

function selectedDoctorType(): DoctorType | null {
  if (doctorTypeId.value === null) {
    return null
  }
  return doctorTypes.value.find((type) => type.id === doctorTypeId.value) ?? currentDoctorType.value
}

function calculateAge(birthday?: string | null) {
  if (!birthday) return null
  const date = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }
  return age
}

function toUserPayload(): BackendProfile {
  const { age: _age, ...rest } = form.value
  return {
    ...rest,
    doctorType: isDoctorRole.value ? selectedDoctorType() : null,
  }
}

async function loadUser() {
  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    await popup.showMessage({
      title: 'Ungültige Benutzer-ID',
      message: 'Diese Benutzer-ID ist ungültig.',
      variant: 'warning',
    })
    router.push('/admin/users')
    return
  }

  try {
    const token = await getAccessTokenSilently()
    const profile = await profileStore.load(token, true)
    if (profile?.role !== 'ADMIN') {
      router.replace('/')
      return
    }

    await doctorStore.fetchDoctorTypes()

    const response = await fetch(`${API_BASE}/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      await popup.showMessage({
        title: 'Benutzer nicht gefunden',
        message: 'Der ausgewählte Benutzer wurde nicht gefunden.',
        variant: 'warning',
      })
      router.push('/admin/users')
      return
    }

    const user = await response.json() as BackendProfile
    userId.value = id
    doctorTypeId.value = user.doctorType?.id ?? null
    currentDoctorType.value = user.doctorType as DoctorType | null
    form.value = {
      ...form.value,
      ...user,
      birthday: user.birthday ?? '',
      doctorType: user.doctorType ?? null,
    }
  } catch (error) {
    await popup.showMessage({
      title: 'Benutzer konnte nicht geladen werden',
      message: error instanceof Error ? error.message : 'Benutzer konnte nicht geladen werden.',
      variant: 'danger',
    })
    router.push('/admin/users')
  } finally {
    isLoading.value = false
  }
}

async function onUpdate() {
  if (!form.value.firstName || !form.value.lastName || !form.value.email || !form.value.role) {
    await popup.showMessage({
      title: 'Pflichtfelder fehlen',
      message: 'Bitte Vorname, Nachname, E-Mail und Rolle ausfüllen.',
      variant: 'warning',
    })
    return
  }

  if (isDoctorRole.value && (!form.value.practiceName || !doctorTypeId.value)) {
    await popup.showMessage({
      title: 'Arztangaben fehlen',
      message: 'Für einen Arzt brauchen wir Praxisname und Fachrichtung.',
      variant: 'warning',
    })
    return
  }

  try {
    const token = await getAccessTokenSilently()
    const response = await fetch(`${API_BASE}/api/users/${userId.value}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toUserPayload()),
    })

    if (!response.ok) {
      throw new Error(`Benutzer konnte nicht gespeichert werden: ${response.status}`)
    }

    await popup.showMessage({
      title: 'Benutzer aktualisiert',
      message: 'Benutzer erfolgreich aktualisiert.',
      variant: 'success',
    })
    router.push('/admin/users')
  } catch (error) {
    await popup.showMessage({
      title: 'Speichern fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Benutzer konnte nicht gespeichert werden.',
      variant: 'danger',
    })
  }
}

async function onDelete() {
  const confirmed = await popup.showConfirmation({
    title: 'Benutzer löschen',
    message: 'Möchten Sie diesen Benutzer wirklich löschen?',
    confirmLabel: 'Löschen',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    const token = await getAccessTokenSilently()
    const response = await fetch(`${API_BASE}/api/users/${userId.value}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Benutzer konnte nicht gelöscht werden: ${response.status}`)
    }

    await popup.showMessage({
      title: 'Benutzer gelöscht',
      message: 'Benutzer erfolgreich gelöscht.',
      variant: 'success',
    })
    router.push('/admin/users')
  } catch (error) {
    await popup.showMessage({
      title: 'Löschen fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Benutzer konnte nicht gelöscht werden.',
      variant: 'danger',
    })
  }
}

onMounted(loadUser)
</script>

<template>
  <NavBar />

  <div class="form-container">
    <h2>Benutzer bearbeiten</h2>

    <div v-if="isLoading" class="loading-message">Benutzer wird geladen...</div>

    <form v-else novalidate @submit.prevent="onUpdate">
      <div class="form-group">
        <label for="id">ID</label>
        <input id="id" type="text" :value="userId" readonly>
      </div>

      <div class="form-group">
        <label for="name">Name</label>
        <input id="name" type="text" v-model="form.name" placeholder="Anzeigename">
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
        <label for="email">E-Mail *</label>
        <input id="email" type="email" v-model="form.email" required>
      </div>

      <div class="form-group">
        <label for="role">Rolle *</label>
        <select id="role" v-model="form.role" required>
          <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
        </select>
      </div>

      <div class="form-group">
        <label for="insurance">Versicherung</label>
        <input id="insurance" type="text" v-model="form.insurance">
      </div>

      <div class="form-group">
        <label for="status">Status</label>
        <input id="status" type="text" v-model="form.status">
      </div>

      <div class="form-group">
        <label for="birthday">Geburtsdatum</label>
        <input id="birthday" type="date" v-model="form.birthday">
        <small v-if="calculateAge(form.birthday) !== null" class="field-hint">
          Alter: {{ calculateAge(form.birthday) }}
        </small>
      </div>

      <div class="form-group">
        <label for="title">Titel</label>
        <input id="title" type="text" v-model="form.title" placeholder="z.B. Dr. med.">
      </div>

      <div class="form-group">
        <label for="practiceName">Praxisname</label>
        <input id="practiceName" type="text" v-model="form.practiceName">
      </div>

      <div class="form-group">
        <label for="doctorType">Fachrichtung</label>
        <select id="doctorType" v-model="doctorTypeId">
          <option :value="null">Keine</option>
          <option v-for="type in doctorTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
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
        <label for="imageUrl">Bild-URL</label>
        <input id="imageUrl" type="text" v-model="form.imageUrl">
      </div>

      <div class="form-group">
        <label for="distance">Entfernung (km)</label>
        <input id="distance" type="number" v-model.number="form.distance" min="0" step="0.1">
      </div>

      <div v-if="isDoctorRole" class="form-group">
        <label for="consultationFee">Honorar pro Termin (€)</label>
        <input id="consultationFee" type="number" v-model.number="form.consultationFee" min="0" step="0.5">
      </div>

      <div class="form-group">
        <label for="auth0Id">Auth0 ID (schreibgeschützt)</label>
        <input id="auth0Id" type="text" :value="form.auth0Id" readonly>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Aktualisieren</button>
        <button type="button" class="btn btn-danger" @click="onDelete">Löschen</button>
        <router-link class="btn btn-secondary" to="/admin/users">Abbrechen</router-link>
      </div>
    </form>
  </div>

  <AppFooter />
</template>

<style scoped>
.form-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 60px 20px;
}

.form-container h2 {
  font-size: 28px;
  margin-bottom: 32px;
  color: #333;
}

.loading-message {
  padding: 24px 0;
  color: #666;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.field-hint {
  display: inline-block;
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
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
