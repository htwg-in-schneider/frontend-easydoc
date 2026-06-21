<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { usePopupStore } from '@/stores/popup'
import { useProfileStore, API_BASE, type BackendProfile } from '@/stores/profile'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const { isAuthenticated, getAccessTokenSilently, user } = useAuth0()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { profile, isLoading, errorMessage } = storeToRefs(profileStore)

const isSaving = ref(false)
const showAvatarPicker = ref(false)

const avatarOptions = [1, 2, 3, 4, 5, 6].map(i =>
  new URL(`../assets/images/profilbild_${i}.png`, import.meta.url).href
)

function selectAvatar(url: string) {
  form.value.imageUrl = url
  showAvatarPicker.value = false
}

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  insurance: '',
  birthday: '',
  imageUrl: '',
  phoneNumber: '',
  street: '',
  postcode: '',
  city: '',
  country: '',
})

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

const displayName = computed(() => {
  const firstName = profile.value?.firstName?.trim()
  const lastName = profile.value?.lastName?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  return fullName || profile.value?.name || 'Unbekannter Benutzer'
})

const subtitle = computed(() => {
  const age = calculateAge(profile.value?.birthday) ?? profile.value?.age
  if (age !== null && age !== undefined) {
    return `Alter: ${age}`
  }
  if (profile.value?.role) {
    return `Rolle: ${profile.value.role}`
  }
  return profile.value?.email || profileMessage.value
})

const profileMessage = computed(() => {
  if (isLoading.value) return 'Backend-Profil wird geladen'
  return errorMessage.value || 'Kein Backend-Profil gefunden'
})

const profileImage = computed(() => {
  return form.value.imageUrl?.trim() || profile.value?.imageUrl?.trim() || user.value?.picture || ''
})

const fallbackInitial = computed(() => {
  const source = displayName.value || profile.value?.email || user.value?.name || user.value?.email || 'U'
  return source.charAt(0).toUpperCase()
})

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : value
}

function normalizeCityValue(city: BackendProfile['city']) {
  if (!city) return ''
  if (typeof city === 'string') return city
  return city.name ?? ''
}

function syncForm(source: BackendProfile | null) {
  form.value = {
    firstName: source?.firstName ?? '',
    lastName: source?.lastName ?? '',
    email: source?.email ?? '',
    insurance: source?.insurance ?? '',
    birthday: source?.birthday ?? '',
    imageUrl: source?.imageUrl?.trim() || user.value?.picture || '',
    phoneNumber: source?.phoneNumber ?? '',
    street: source?.street ?? '',
    postcode: source?.postcode ?? '',
    city: normalizeCityValue(source?.city),
    country: source?.country ?? '',
  }
}

async function loadBackendProfile() {
  if (!isAuthenticated.value) return

  const token = await getAccessTokenSilently()
  await profileStore.load(token, true)
}

async function saveProfile() {
  if (!isAuthenticated.value) return

  if (!form.value.firstName || !form.value.lastName || !form.value.email) {
    await popup.showMessage({
      title: 'Pflichtfelder fehlen',
      message: 'Bitte Vorname, Nachname und E-Mail ausfüllen.',
      variant: 'warning',
    })
    return
  }

  isSaving.value = true

  try {
    const token = await getAccessTokenSilently()
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        insurance: form.value.insurance,
        birthday: form.value.birthday || null,
        imageUrl: form.value.imageUrl,
        phoneNumber: form.value.phoneNumber,
        street: form.value.street,
        postcode: form.value.postcode,
        city: form.value.city,
        country: form.value.country,
      }),
    })

    if (!response.ok) {
      throw new Error(`Profil konnte nicht gespeichert werden: ${response.status}`)
    }

    const updated = await response.json() as BackendProfile
    profile.value = updated
    syncForm(updated)

    await popup.showMessage({
      title: 'Profil gespeichert',
      message: 'Deine Änderungen wurden übernommen.',
      variant: 'success',
    })
  } catch (error) {
    await popup.showMessage({
      title: 'Speichern fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Profil konnte nicht gespeichert werden.',
      variant: 'danger',
    })
  } finally {
    isSaving.value = false
  }
}

watch(profile, (current) => {
  syncForm(current)
}, { immediate: true })

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadBackendProfile()
  } else {
    syncForm(null)
  }
}, { immediate: true })
</script>

<template>
  <NavBar />
  <main class="profile-page">
    <section class="profile-panel">
      <div class="profile-header">
        <div class="profile-avatar">
          <img v-if="profileImage" :src="profileImage" alt="Profilbild">
          <span v-else class="profile-fallback">{{ fallbackInitial }}</span>
        </div>

        <div class="profile-intro">
          <h1>{{ profile ? displayName : 'Profil' }}</h1>
          <p>{{ profile ? subtitle : profileMessage }}</p>
          <div v-if="profile" class="profile-meta">
            <span class="role-pill">{{ displayValue(profile.role) }}</span>
            <a v-if="profileImage" class="image-link" :href="profileImage" target="_blank" rel="noopener noreferrer">
              Bild öffnen
            </a>
            <button type="button" class="change-avatar-btn" @click="showAvatarPicker = true">
              Bild ändern
            </button>
          </div>
        </div>
      </div>

      <p v-if="!profile" class="profile-message">{{ profileMessage }}</p>

      <form v-else class="profile-form" novalidate @submit.prevent="saveProfile">
        <div class="form-grid">
          <label>
            Vorname
            <input v-model="form.firstName" type="text" placeholder="Vorname">
          </label>

          <label>
            Nachname
            <input v-model="form.lastName" type="text" placeholder="Nachname">
          </label>

          <label>
            E-Mail
            <input v-model="form.email" type="email" placeholder="E-Mail">
          </label>

          <label>
            Versicherung
            <input v-model="form.insurance" type="text" placeholder="Versicherung">
          </label>

          <label>
            Telefon
            <input v-model="form.phoneNumber" type="tel" placeholder="+49 ...">
          </label>

          <label>
            Geburtsdatum
            <input v-model="form.birthday" type="date">
          </label>

          <label>
            Straße
            <input v-model="form.street" type="text" placeholder="Straße und Hausnummer">
          </label>

          <label>
            Postleitzahl
            <input v-model="form.postcode" type="text" placeholder="PLZ">
          </label>

          <label>
            Stadt
            <input v-model="form.city" type="text" placeholder="Ort">
          </label>

          <label>
            Land
            <input v-model="form.country" type="text" placeholder="Land">
          </label>

        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSaving">
            {{ isSaving ? 'Speichern...' : 'Änderungen speichern' }}
          </button>
        </div>
      </form>
    </section>
    <Transition name="fade">
      <div v-if="showAvatarPicker" class="avatar-backdrop" @click.self="showAvatarPicker = false">
        <div class="avatar-modal">
          <div class="avatar-modal-header">
            <span>Profilbild auswählen</span>
            <button type="button" class="avatar-close" @click="showAvatarPicker = false">✕</button>
          </div>
          <div class="avatar-grid">
            <button
              v-for="(url, index) in avatarOptions"
              :key="index"
              type="button"
              class="avatar-option"
              :class="{ selected: form.imageUrl === url }"
              @click="selectAvatar(url)"
            >
              <img :src="url" :alt="`Profilbild ${index + 1}`">
            </button>
          </div>
          <div class="avatar-modal-footer">
            <button type="button" class="btn-cancel" @click="showAvatarPicker = false">Abbrechen</button>
          </div>
        </div>
      </div>
    </Transition>
  </main>
  <AppFooter />
</template>

<style scoped>
.profile-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px;
  background: linear-gradient(180deg, #eef3fb 0%, #f7f9fc 100%);
}

.profile-panel {
  width: min(820px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 28px;
}

.profile-avatar {
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  border-radius: 50%;
  overflow: hidden;
  background: #eef3fb;
  border: 2px solid #d8e3f7;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #155dfc;
  font-size: 30px;
  font-weight: 700;
}

.profile-intro h1 {
  margin: 0 0 6px;
  color: #1f2a44;
  font-size: 30px;
}

.profile-intro p {
  margin: 0;
  color: #64708a;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  color: #155dfc;
  font-size: 13px;
  font-weight: 700;
  background: #f0f6fe;
  border-radius: 999px;
}

.image-link {
  color: #155dfc;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.image-link:hover {
  text-decoration: underline;
}

.profile-message {
  margin: 0;
  color: #64708a;
}

.profile-form {
  margin-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-grid label {
  display: grid;
  gap: 6px;
  color: #444;
  font-size: 14px;
  font-weight: 600;
}

.form-grid input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  font-size: 15px;
  color: #1f2a44;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-grid input:focus {
  outline: none;
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.12);
}

.full-width {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.btn-primary {
  color: #fff;
  background: #155dfc;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-primary:disabled {
  cursor: progress;
  opacity: 0.8;
}

.change-avatar-btn {
  padding: 6px 14px;
  border: 1px solid #155dfc;
  border-radius: 999px;
  background: transparent;
  color: #155dfc;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.change-avatar-btn:hover {
  background: #155dfc;
  color: #fff;
}

.avatar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.avatar-modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  width: min(480px, 90vw);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
}

.avatar-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2a44;
}

.avatar-close {
  border: none;
  background: none;
  font-size: 18px;
  color: #64708a;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.avatar-close:hover {
  color: #1f2a44;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.avatar-option {
  border: 2px solid #d8e3f7;
  border-radius: 12px;
  padding: 6px;
  background: #f7f9fc;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
  aspect-ratio: 1;
  overflow: hidden;
}

.avatar-option img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

.avatar-option:hover {
  border-color: #155dfc;
  transform: scale(1.04);
}

.avatar-option.selected {
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.2);
}

.avatar-modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  background: transparent;
  color: #64708a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-cancel:hover {
  border-color: #155dfc;
  color: #155dfc;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .profile-panel {
    padding: 24px;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
