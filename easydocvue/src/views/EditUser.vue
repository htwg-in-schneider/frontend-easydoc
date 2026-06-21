<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE, useProfileStore, type BackendProfile, type UserRole } from '@/stores/profile'
import { useDoctorStore, type DoctorType } from '@/stores/doctors'
import { usePopupStore } from '@/stores/popup'
import {
  normalizeUserStatus,
  normalizeUserTitle,
  userStatusOptions,
  userTitleOptions,
  type UserStatus,
  type UserTitle,
} from '@/utils/userFields'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const roles: Array<{
  value: UserRole
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'USER',
    label: 'USER',
    description: 'Standardzugriff auf die Plattform.',
    icon: 'mdi-account',
  },
  {
    value: 'DOCTOR',
    label: 'DOCTOR',
    description: 'Zugriff für Ärzte mit Praxisinformationen und weiteren Funktionen.',
    icon: 'mdi-stethoscope',
  },
  {
    value: 'ADMIN',
    label: 'ADMIN',
    description: 'Vollzugriff auf alle Bereiche und Einstellungen.',
    icon: 'mdi-shield-account',
  },
]

interface UserEditForm {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  insurance: string
  status: UserStatus
  birthday: string
  title: UserTitle
  practiceName: string
  phoneNumber: string
  website: string
  street: string
  postcode: string
  city: string
  country: string
  imageUrl: string
  distance: number | null
  consultationFee: number | null
  auth0Id: string
  createdAt: string
  updatedAt: string
}

type UserUpdatePayload = {
  name: string | null
  firstName: string
  lastName: string
  email: string
  role: UserRole
  insurance: string | null
  status: UserStatus
  birthday: string | null
  title: UserTitle
  practiceName: string | null
  phoneNumber: string | null
  website: string | null
  street: string | null
  postcode: string | null
  city: string | null
  country: string | null
  imageUrl: string | null
  distance: number | null
  consultationFee: number | null
  specialization: DoctorType | null
}

const route = useRoute()
const router = useRouter()
const { getAccessTokenSilently } = useAuth0()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { doctorTypes } = storeToRefs(doctorStore)
const isDoctorEditRoute = computed(() => route.name === 'doctor-edit')
const isCreateMode = computed(() => route.name === 'user-create')
const backTarget = computed(() => {
  const rawReturnTo = typeof route.query.returnTo === 'string' && route.query.returnTo.trim() ? route.query.returnTo : ''
  if (rawReturnTo) return rawReturnTo
  if (isDoctorEditRoute.value && route.params.id) {
    return `/doctor/view/${route.params.id}`
  }
  return '/admin/users'
})
const pageTitle = computed(() => {
  if (isCreateMode.value) return 'Benutzer hinzufügen'
  if (isDoctorEditRoute.value) return 'Arzt bearbeiten'
  return 'Benutzer bearbeiten'
})
const pageSubtitle = computed(() => (
  isCreateMode.value
    ? 'Erfassen Sie einen neuen Benutzer und ordnen Sie bei Bedarf ein Arztprofil zu.'
    : isDoctorEditRoute.value
    ? 'Bearbeiten Sie die Benutzerinformationen und das Arztprofil.'
    : 'Bearbeiten Sie die Benutzerinformationen und Rolle.'
))
const pageEyebrow = computed(() => (isDoctorEditRoute.value ? 'Arztverwaltung' : 'Benutzerverwaltung'))
const backLinkLabel = computed(() => (isDoctorEditRoute.value ? 'Zurück zur Arztansicht' : 'Zurück zur Benutzerliste'))
const submitLabel = computed(() => (isCreateMode.value ? 'Benutzer hinzufügen' : 'Aktualisieren'))
const loadingLabel = computed(() => (isCreateMode.value ? 'Benutzerformular wird vorbereitet...' : 'Benutzer wird geladen...'))

const userId = ref<number | null>(null)
const doctorTypeId = ref<number | null>(null)
const currentDoctorType = ref<DoctorType | null>(null)
const originalUser = ref<BackendProfile | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)

function createDefaultForm(): UserEditForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    role: 'USER',
    insurance: '',
    status: 'ACTIVE',
    birthday: '',
    title: 'NONE',
    practiceName: '',
    phoneNumber: '',
    website: '',
    street: '',
    postcode: '',
    city: '',
    country: '',
    imageUrl: '',
    distance: null,
    consultationFee: null,
    auth0Id: '',
    createdAt: '',
    updatedAt: '',
  }
}

const form = ref<UserEditForm>(createDefaultForm())

const isDoctorRole = computed(() => form.value.role === 'DOCTOR')
const canDelete = computed(() => !isCreateMode.value)
const selectedDoctorType = computed(() => doctorTypes.value.find((type) => type.id === doctorTypeId.value) ?? currentDoctorType.value)
const doctorRatingLabel = computed(() => {
  const rating = originalUser.value?.rating
  if (rating === null || rating === undefined) return 'Noch keine Bewertungen'
  return `${rating.toFixed(2)} / 5`
})
const selectedStatusLabel = computed(() => userStatusOptions.find((option) => option.value === form.value.status)?.label ?? 'Active')

function normalizeTextField(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (typeof value === 'object') {
    const record = value as { name?: unknown; label?: unknown }
    if (typeof record.name === 'string' && record.name.trim()) return record.name
    if (typeof record.label === 'string' && record.label.trim()) return record.label
  }
  return ''
}

function normalizePayloadText(value: unknown) {
  const text = normalizeTextField(value).trim()
  return text || null
}

function normalizePayloadNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function buildDisplayName(firstName = form.value.firstName, lastName = form.value.lastName) {
  const parts = [normalizeTextField(firstName).trim(), normalizeTextField(lastName).trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
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

function formatDateTime(value?: string | null) {
  if (!value) return 'Nicht hinterlegt'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nicht hinterlegt'
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function selectedDoctorTypeValue(): DoctorType | null {
  return selectedDoctorType.value
}

function normalizeDoctorTypeRef(value: unknown): DoctorType | null {
  if (!value || typeof value !== 'object') return null

  const record = value as { id?: unknown; name?: unknown }
  if (record.id === undefined || record.id === null) return null

  const id = Number(record.id)
  if (!Number.isFinite(id)) return null

  const name = typeof record.name === 'string' ? record.name.trim() : ''
  return {
    id,
    name: name || '',
  }
}

function toUserPayload(): UserUpdatePayload {
  const name = buildDisplayName()

  return {
    name,
    firstName: normalizeTextField(form.value.firstName).trim(),
    lastName: normalizeTextField(form.value.lastName).trim(),
    email: normalizeTextField(form.value.email).trim(),
    role: form.value.role,
    insurance: normalizePayloadText(form.value.insurance),
    status: normalizeUserStatus(form.value.status) ?? 'ACTIVE',
    birthday: normalizePayloadText(form.value.birthday),
    title: isDoctorRole.value ? normalizeUserTitle(form.value.title) : 'NONE',
    practiceName: isDoctorRole.value ? normalizePayloadText(form.value.practiceName) : null,
    phoneNumber: isDoctorRole.value ? normalizePayloadText(form.value.phoneNumber) : null,
    website: isDoctorRole.value ? normalizePayloadText(form.value.website) : null,
    street: normalizePayloadText(form.value.street),
    postcode: normalizePayloadText(form.value.postcode),
    city: normalizePayloadText(form.value.city),
    country: normalizePayloadText(form.value.country),
    imageUrl: normalizePayloadText(form.value.imageUrl),
    distance: normalizePayloadNumber(form.value.distance),
    consultationFee: normalizePayloadNumber(form.value.consultationFee),
    specialization: isDoctorRole.value ? selectedDoctorTypeValue() : null,
  }
}

function buildSnapshot(): BackendProfile | null {
  if (!originalUser.value && !userId.value) return null
  const name = buildDisplayName()

  return {
    ...(originalUser.value ?? {}),
    id: userId.value ?? originalUser.value?.id ?? null,
    name,
    firstName: normalizeTextField(form.value.firstName).trim(),
    lastName: normalizeTextField(form.value.lastName).trim(),
    email: normalizeTextField(form.value.email).trim(),
    role: form.value.role,
    insurance: normalizePayloadText(form.value.insurance),
    status: normalizeUserStatus(form.value.status) ?? 'ACTIVE',
    birthday: normalizePayloadText(form.value.birthday),
    title: isDoctorRole.value ? normalizeUserTitle(form.value.title) : 'NONE',
    practiceName: isDoctorRole.value ? normalizePayloadText(form.value.practiceName) : null,
    phoneNumber: isDoctorRole.value ? normalizePayloadText(form.value.phoneNumber) : null,
    website: isDoctorRole.value ? normalizePayloadText(form.value.website) : null,
    street: normalizePayloadText(form.value.street),
    postcode: normalizePayloadText(form.value.postcode),
    city: normalizePayloadText(form.value.city),
    country: normalizePayloadText(form.value.country),
    imageUrl: normalizePayloadText(form.value.imageUrl),
    distance: normalizePayloadNumber(form.value.distance),
    consultationFee: normalizePayloadNumber(form.value.consultationFee),
    createdAt: originalUser.value?.createdAt ?? null,
    updatedAt: originalUser.value?.updatedAt ?? null,
    specialization: isDoctorRole.value ? selectedDoctorTypeValue() : null,
    doctorType: isDoctorRole.value ? selectedDoctorTypeValue() : null,
  }
}

function routeWithSnapshot(target: string, snapshot: BackendProfile | null) {
  const resolved = router.resolve(target)
  router.push({
    path: resolved.path,
    query: resolved.query,
    hash: resolved.hash,
    state: {
      userSnapshot: JSON.stringify(snapshot ?? buildSnapshot()),
    },
  })
}

function goBack() {
  if (isCreateMode.value) {
    router.push(backTarget.value)
    return
  }

  routeWithSnapshot(backTarget.value, originalUser.value)
}

function resolveDeleteTarget() {
  try {
    const parsed = new URL(backTarget.value, window.location.origin)
    const nestedReturnTo = parsed.searchParams.get('returnTo')
    return nestedReturnTo && nestedReturnTo.trim() ? nestedReturnTo : backTarget.value
  } catch {
    return backTarget.value
  }
}

async function loadUser() {
  if (isCreateMode.value) {
    try {
      const token = await getAccessTokenSilently()
      const profile = await profileStore.load(token, true)
      if (profile?.role !== 'ADMIN') {
        router.replace('/')
        return
      }

      await Promise.allSettled([
        doctorStore.fetchDoctorTypes(),
      ])

      userId.value = null
      originalUser.value = null
      doctorTypeId.value = null
      currentDoctorType.value = null
      form.value = createDefaultForm()
    } catch (error) {
      await popup.showMessage({
        title: 'Benutzerformular konnte nicht geladen werden',
        message: error instanceof Error ? error.message : 'Benutzerformular konnte nicht geladen werden.',
        variant: 'danger',
      })
      router.push(backTarget.value)
    } finally {
      isLoading.value = false
    }
    return
  }

  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    await popup.showMessage({
      title: 'Ungültige Benutzer-ID',
      message: 'Diese Benutzer-ID ist ungültig.',
      variant: 'warning',
    })
    router.push(backTarget.value)
    return
  }

  try {
    const token = await getAccessTokenSilently()
    const profile = await profileStore.load(token, true)
    if (profile?.role !== 'ADMIN') {
      router.replace('/')
      return
    }

    await Promise.allSettled([
      doctorStore.fetchDoctorTypes(),
    ])

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
      router.push(backTarget.value)
      return
    }

    const user = await response.json() as BackendProfile
    userId.value = id
    originalUser.value = user
    doctorTypeId.value = user.doctorType?.id ?? user.specialization?.id ?? null
    currentDoctorType.value = normalizeDoctorTypeRef(user.doctorType ?? user.specialization)
    form.value = {
      firstName: normalizeTextField(user.firstName),
      lastName: normalizeTextField(user.lastName),
      email: normalizeTextField(user.email),
      role: (user.role ?? 'USER') as UserRole,
      insurance: normalizeTextField(user.insurance),
      status: normalizeUserStatus(user.status) ?? 'ACTIVE',
      birthday: user.birthday ?? '',
      title: normalizeUserTitle(user.title),
      practiceName: normalizeTextField(user.practiceName),
      phoneNumber: normalizeTextField(user.phoneNumber),
      website: normalizeTextField(user.website),
      street: normalizeTextField(user.street),
      postcode: normalizeTextField(user.postcode),
      city: normalizeTextField(user.city),
      country: normalizeTextField(user.country),
      imageUrl: normalizeTextField(user.imageUrl),
      distance: normalizePayloadNumber(user.distance),
      consultationFee: normalizePayloadNumber(user.consultationFee),
      auth0Id: normalizeTextField(user.auth0Id),
      createdAt: user.createdAt ?? '',
      updatedAt: user.updatedAt ?? '',
    }
  } catch (error) {
    await popup.showMessage({
      title: 'Benutzer konnte nicht geladen werden',
      message: error instanceof Error ? error.message : 'Benutzer konnte nicht geladen werden.',
      variant: 'danger',
    })
    router.push(backTarget.value)
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

  if (!form.value.street || !form.value.postcode || !form.value.city || !form.value.country) {
    await popup.showMessage({
      title: 'Adressdaten fehlen',
      message: 'Bitte Straße, Postleitzahl, Stadt und Land ausfüllen.',
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
    isSaving.value = true
    const token = await getAccessTokenSilently()
    const response = await fetch(
      isCreateMode.value ? `${API_BASE}/api/users` : `${API_BASE}/api/users/${userId.value}`,
      {
        method: isCreateMode.value ? 'POST' : 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toUserPayload()),
      },
    )

    if (!response.ok) {
      throw new Error(`Benutzer konnte nicht gespeichert werden: ${response.status}`)
    }

    const savedUser = await response.json() as BackendProfile
    originalUser.value = savedUser

    await popup.showMessage({
      title: isCreateMode.value ? 'Benutzer hinzugefügt' : 'Benutzer aktualisiert',
      message: isCreateMode.value ? 'Benutzer erfolgreich hinzugefügt.' : 'Benutzer erfolgreich aktualisiert.',
      variant: 'success',
    })
    if (isCreateMode.value) {
      router.push(backTarget.value)
    } else {
      routeWithSnapshot(backTarget.value, savedUser)
    }
  } catch (error) {
    await popup.showMessage({
      title: 'Speichern fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Benutzer konnte nicht gespeichert werden.',
      variant: 'danger',
    })
  } finally {
    isSaving.value = false
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
    router.push(resolveDeleteTarget())
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

  <main class="edit-user-page">
    <section class="edit-user-shell">
      <header class="page-head">
        <router-link class="back-link" :to="backTarget">
          <v-icon size="18">mdi-arrow-left</v-icon>
          <span>{{ backLinkLabel }}</span>
        </router-link>

        <div class="page-head__copy">
          <p class="eyebrow">{{ pageEyebrow }}</p>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageSubtitle }}</p>
        </div>

        <span v-if="selectedStatusLabel" class="status-pill">{{ selectedStatusLabel }}</span>
      </header>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-card">{{ loadingLabel }}</div>
      </div>

      <form v-else class="edit-form" novalidate @submit.prevent="onUpdate">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Grunddaten</h2>
              <p>Allgemeine Informationen zum Benutzer.</p>
            </div>
          </div>

          <div class="field-grid field-grid--three">
            <label class="field field--readonly">
              <span>ID</span>
              <input type="text" :value="isCreateMode ? 'Wird beim Anlegen vergeben' : (userId ?? '')" readonly>
            </label>

            <label class="field">
              <span>Vorname *</span>
              <input v-model="form.firstName" type="text" required>
            </label>

            <label class="field">
              <span>Nachname *</span>
              <input v-model="form.lastName" type="text" required>
            </label>

            <label class="field">
              <span>E-Mail *</span>
              <input v-model="form.email" type="email" required>
            </label>

            <label class="field">
              <span>Versicherung</span>
              <input v-model="form.insurance" type="text">
            </label>

            <label class="field">
              <span>Telefon</span>
              <input v-model="form.phoneNumber" type="tel">
            </label>

            <label class="field">
              <span>Geburtsdatum</span>
              <input v-model="form.birthday" type="date">
              <small v-if="calculateAge(form.birthday) !== null" class="field-hint">
                Alter: {{ calculateAge(form.birthday) }}
              </small>
            </label>

            <label class="field">
              <span>Status</span>
              <select v-model="form.status" required>
                <option v-for="option in userStatusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Straße *</span>
              <input v-model="form.street" type="text" required>
            </label>

            <label class="field">
              <span>Postleitzahl *</span>
              <input v-model="form.postcode" type="text" required>
            </label>

            <label class="field">
              <span>Stadt *</span>
              <input v-model="form.city" type="text" required placeholder="Konstanz">
            </label>

            <label class="field">
              <span>Land *</span>
              <input v-model="form.country" type="text" required>
            </label>
          </div>

        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Rolle</h2>
              <p>Die Rolle bestimmt, welche Informationen und Berechtigungen der Benutzer hat.</p>
            </div>
          </div>

          <div class="role-grid">
            <button
              v-for="role in roles"
              :key="role.value"
              class="role-card"
              :class="{ active: form.role === role.value }"
              type="button"
              :aria-pressed="form.role === role.value"
              @click="form.role = role.value"
            >
              <span class="role-icon">
                <v-icon size="24">{{ role.icon }}</v-icon>
              </span>
              <span class="role-copy">
                <strong>{{ role.label }}</strong>
                <small>{{ role.description }}</small>
              </span>
              <span v-if="form.role === role.value" class="role-selected-dot" />
            </button>
          </div>

          <div v-if="isDoctorRole" class="info-banner">
            Zusätzliche Felder für Ärzte werden angezeigt, sobald die Rolle "Doktor" ausgewählt ist.
          </div>
        </section>

        <section v-if="isDoctorRole" class="card">
          <div class="card-head">
            <div>
              <h2>Arztprofil</h2>
              <p>Informationen, die nur für Ärzte relevant sind.</p>
            </div>
            <span class="card-chip">Nur für Doktoren sichtbar</span>
          </div>

          <div class="field-grid field-grid--three">
            <label class="field">
              <span>Titel</span>
              <select v-model="form.title">
                <option v-for="option in userTitleOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Fachrichtung *</span>
              <select v-model="doctorTypeId" required>
                <option :value="null">Bitte wählen</option>
                <option v-for="type in doctorTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Praxisname *</span>
              <input v-model="form.practiceName" type="text" required>
            </label>

            <label class="field">
              <span>Website</span>
              <input v-model="form.website" type="text">
            </label>

            <div class="field-spacer" />
          </div>

          <div class="rating-card">
            <div>
              <span class="rating-label">Bewertung</span>
              <strong class="rating-value">{{ doctorRatingLabel }}</strong>
            </div>
            <p>Die Bewertung wird automatisch aus den Terminbewertungen berechnet.</p>
          </div>
        </section>

        <section v-if="!isCreateMode" class="card">
          <div class="card-head">
            <div>
              <h2>Systeminformationen</h2>
              <p>Technische Informationen (nicht editierbar).</p>
            </div>
          </div>

          <div class="system-grid">
            <div class="system-field">
              <span>Auth0 ID</span>
              <strong>{{ form.auth0Id || 'Nicht hinterlegt' }}</strong>
            </div>
            <div class="system-field">
              <span>Erstellt am</span>
              <strong>{{ formatDateTime(form.createdAt) }}</strong>
            </div>
            <div class="system-field">
              <span>Zuletzt aktualisiert</span>
              <strong>{{ formatDateTime(form.updatedAt) }}</strong>
            </div>
          </div>
        </section>

        <footer class="action-bar">
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? `${submitLabel}...` : submitLabel }}
          </button>
          <button v-if="canDelete" class="btn btn-danger" type="button" @click="onDelete">
            Löschen
          </button>
          <button class="btn btn-secondary" type="button" @click="goBack">
            Abbrechen
          </button>
        </footer>
      </form>
    </section>
  </main>

  <AppFooter />
</template>

<style scoped>
.edit-user-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 40px 20px 64px;
  background:
    radial-gradient(circle at top left, rgba(21, 93, 252, 0.08), transparent 30%),
    linear-gradient(180deg, #f7faff 0%, #eef3fb 100%);
}

.edit-user-shell {
  width: min(1240px, 100%);
  margin: 0 auto;
}

.page-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-self: start;
  color: #155dfc;
  font-weight: 600;
  text-decoration: none;
}

.page-head__copy {
  justify-self: center;
  text-align: center;
}

.page-head__copy h1 {
  margin: 4px 0 6px;
  font-size: clamp(30px, 3vw, 42px);
  color: #1f2a44;
}

.page-head__copy p {
  margin: 0;
  color: #667085;
}

.eyebrow {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #155dfc;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
  padding: 10px 16px;
  border-radius: 999px;
  background: #eef5ff;
  color: #155dfc;
  font-size: 14px;
  font-weight: 700;
}

.loading-state {
  display: grid;
  place-items: center;
  min-height: 420px;
}

.loading-card {
  padding: 28px 34px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  color: #1f2a44;
}

.edit-form {
  display: grid;
  gap: 20px;
}

.card {
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.card-head h2 {
  margin: 0 0 4px;
  font-size: 22px;
  color: #1f2a44;
}

.card-head p {
  margin: 0;
  color: #667085;
}

.card-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #e9f8ee;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.field-grid {
  display: grid;
  gap: 18px;
}

.field-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
  color: #344054;
  font-weight: 600;
}

.field span {
  font-size: 14px;
}

.field input,
.field select {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #d7e1f3;
  background: #fff;
  color: #1f2a44;
  font-size: 15px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.field input:focus,
.field select:focus {
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.14);
}

.field--readonly input {
  background: #f8fafc;
  color: #667085;
}

.field-hint {
  color: #667085;
  font-size: 13px;
  font-weight: 500;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.role-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 120px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid #d7e1f3;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.role-card:hover {
  transform: translateY(-1px);
  border-color: #a9c1ff;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
}

.role-card.active {
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.12);
}

.role-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: #eef5ff;
  color: #155dfc;
  flex-shrink: 0;
}

.role-copy {
  display: grid;
  gap: 4px;
}

.role-copy strong {
  color: #1f2a44;
  font-size: 15px;
}

.role-copy small {
  color: #667085;
  font-size: 13px;
  line-height: 1.4;
}

.role-selected-dot {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #155dfc;
}

.info-banner {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: #eef5ff;
  color: #155dfc;
  font-size: 14px;
  font-weight: 600;
}

.rating-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
  border: 1px solid #dbe7ff;
}

.rating-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rating-value {
  color: #1f2a44;
  font-size: 20px;
}

.rating-card p {
  margin: 0;
  color: #667085;
  font-size: 14px;
}

.system-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.system-field {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e4ebf7;
}

.system-field span {
  font-size: 13px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.system-field strong {
  color: #1f2a44;
  font-size: 15px;
  font-weight: 600;
  word-break: break-word;
}

.action-bar {
  position: sticky;
  bottom: 18px;
  z-index: 3;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  margin-top: 4px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d8e3f7;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, opacity 0.18s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  background: #eef5ff;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dfeaff;
}

.btn-danger {
  background: #dc3545;
  color: #fff;
}

.btn-danger:hover {
  background: #b72d3b;
}

@media (max-width: 1024px) {
  .page-head {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .field-grid--three,
  .system-grid,
  .role-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .edit-user-page {
    padding: 28px 14px 52px;
  }

  .card,
  .action-bar {
    padding: 16px;
  }

  .field-grid--three,
  .field-grid--two,
  .system-grid,
  .role-grid {
    grid-template-columns: 1fr;
  }

  .rating-card,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }
}
</style>
