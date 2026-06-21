<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { API_BASE, useProfileStore, type BackendProfile, type UserRole } from '@/stores/profile'
import { buildMailtoUrl, buildTelUrl, toExternalUrl } from '@/utils/doctorContact'
import { formatUserName, formatUserStatusLabel, formatUserTitleLabel } from '@/utils/userFields'

interface DetailRow {
  label: string
  value: string
}

const route = useRoute()
const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently } = useAuth0()
const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

const isLoading = ref(true)
const errorMessage = ref('')
const viewedUser = ref<BackendProfile | null>(null)
let activeLoadId = 0

const viewerIsAdmin = computed(() => profile.value?.role === 'ADMIN')
const canEdit = computed(() => viewerIsAdmin.value && !!viewedUser.value?.id)

const backTarget = computed(() => {
  const rawReturnTo = route.query.returnTo
  if (typeof rawReturnTo === 'string' && rawReturnTo.trim()) {
    return rawReturnTo.startsWith('/') ? rawReturnTo : `/${rawReturnTo.replace(/^\/+/, '')}`
  }

  if (profile.value?.role === 'ADMIN') return '/admin/users'
  return '/my-bookings'
})

const displayName = computed(() => {
  const user = viewedUser.value
  if (!user) return 'Benutzer'

  const fullName = formatUserName(user)
  return fullName || user.name || 'Benutzer'
})

const roleLabel = computed(() => roleToLabel(viewedUser.value?.role))

const subtitle = computed(() => {
  const user = viewedUser.value
  if (!user) return ''

  if (user.role === 'DOCTOR') {
    return [user.practiceName, user.doctorType?.name ?? user.specialization?.name]
      .filter(Boolean)
      .join(' · ')
  }

  return [user.insurance, user.status ? formatUserStatusLabel(user.status) : '']
    .filter(Boolean)
    .join(' · ')
})

const avatarImage = computed(() => viewedUser.value?.imageUrl?.trim() || '')

const avatarFallback = computed(() => {
  const source = [viewedUser.value?.firstName, viewedUser.value?.lastName, viewedUser.value?.name]
    .filter(Boolean)
    .join(' ') || viewedUser.value?.email || 'U'
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
})

const viewedUserSnapshot = computed(() => (viewedUser.value ? JSON.stringify(viewedUser.value) : ''))

function getRouteSnapshotUser(id: number) {
  if (typeof window === 'undefined') return null

  const state = window.history.state as { userSnapshot?: string } | null | undefined
  const snapshot = state?.userSnapshot
  if (!snapshot) return null

  try {
    const user = JSON.parse(snapshot) as BackendProfile
    if (!user || user.id === null || user.id === undefined) return null
    return user.id === id ? user : null
  } catch {
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

function roleToLabel(role?: UserRole | null) {
  switch (role) {
    case 'DOCTOR':
      return 'Arzt'
    case 'ADMIN':
      return 'Admin'
    case 'USER':
      return 'Patient'
    default:
      return 'Benutzer'
  }
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Nicht hinterlegt'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'object') {
    const record = value as { name?: unknown; label?: unknown }
    if (typeof record.name === 'string' && record.name.trim()) return record.name
    if (typeof record.label === 'string' && record.label.trim()) return record.label
  }

  return 'Nicht hinterlegt'
}

function displayAddressValue(value: unknown) {
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

function formatBirthday(value?: string | null) {
  if (!value) return 'Nicht hinterlegt'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return displayValue(value)
  return new Intl.DateTimeFormat('de-DE').format(date)
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Nicht hinterlegt'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return displayValue(value)
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
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

function formatAddress(user: BackendProfile) {
  const line1 = displayAddressValue(user.street)
  const line2 = [displayAddressValue(user.postcode), displayAddressValue(user.city)].filter(Boolean).join(' ')
  const line3 = displayAddressValue(user.country)
  return [line1, line2, line3].filter(Boolean).join(', ')
}

function buildMapsUrl(user: BackendProfile) {
  const address = formatAddress(user)
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined) return 'Nicht hinterlegt'
  return `${value.toFixed(2)} €`
}

function formatRating(value?: number | null) {
  if (value === null || value === undefined) return 'Noch keine Bewertungen'
  return value.toFixed(1)
}

function buildPrimaryRows(user: BackendProfile | null): DetailRow[] {
  if (!user) return []

  if (user.role === 'DOCTOR') {
    return [
      { label: 'Titel', value: formatUserTitleLabel(user.title) },
      { label: 'Vorname', value: displayValue(user.firstName) },
      { label: 'Nachname', value: displayValue(user.lastName) },
      { label: 'Praxis', value: displayValue(user.practiceName) },
      { label: 'Fachrichtung', value: displayValue(user.doctorType?.name ?? user.specialization?.name) },
      { label: 'Bewertung', value: formatRating(user.rating) },
      { label: 'Honorar', value: formatMoney(user.consultationFee) },
      { label: 'Status', value: formatUserStatusLabel(user.status) },
    ]
  }

  if (user.role === 'ADMIN') {
    return [
      { label: 'Vorname', value: displayValue(user.firstName) },
      { label: 'Nachname', value: displayValue(user.lastName) },
      { label: 'E-Mail', value: displayValue(user.email) },
      { label: 'Status', value: formatUserStatusLabel(user.status) },
      { label: 'Versicherung', value: displayValue(user.insurance) },
    ]
  }

  return [
    { label: 'Vorname', value: displayValue(user.firstName) },
    { label: 'Nachname', value: displayValue(user.lastName) },
    { label: 'Geburtsdatum', value: formatBirthday(user.birthday) },
    { label: 'Alter', value: calculateAge(user.birthday)?.toString() ?? 'Nicht hinterlegt' },
    { label: 'E-Mail', value: displayValue(user.email) },
    { label: 'Versicherung', value: displayValue(user.insurance) },
    { label: 'Status', value: formatUserStatusLabel(user.status) },
  ]
}

function buildAddressRows(user: BackendProfile | null): DetailRow[] {
  if (!user) return []

  return [
    { label: 'Straße', value: displayValue(user.street) },
    { label: 'Postleitzahl', value: displayValue(user.postcode) },
    { label: 'Stadt', value: displayValue(user.city) },
    { label: 'Land', value: displayValue(user.country) },
  ]
}

function buildSystemRows(user: BackendProfile | null): DetailRow[] {
  if (!user) return []

  return [
    { label: 'Benutzer-ID', value: user.id !== null && user.id !== undefined ? `#${user.id}` : 'Nicht hinterlegt' },
    { label: 'Auth0 ID', value: displayValue(user.auth0Id) },
    { label: 'Erstellt am', value: formatDateTime(user.createdAt) },
    { label: 'Zuletzt aktualisiert', value: formatDateTime(user.updatedAt) },
  ]
}

const primaryRows = computed(() => buildPrimaryRows(viewedUser.value))
const addressRows = computed(() => buildAddressRows(viewedUser.value))
const systemRows = computed(() => buildSystemRows(viewedUser.value))
const mapsUrl = computed(() => (viewedUser.value ? buildMapsUrl(viewedUser.value) : ''))
const phoneUrl = computed(() => buildTelUrl(viewedUser.value?.phoneNumber))
const emailUrl = computed(() => buildMailtoUrl(viewedUser.value?.email))
const websiteUrl = computed(() => toExternalUrl(viewedUser.value?.website))

async function loadUser() {
  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    errorMessage.value = 'Diese Benutzer-ID ist ungültig.'
    isLoading.value = false
    return
  }

  const loadId = ++activeLoadId
  errorMessage.value = ''

  const snapshotUser = getRouteSnapshotUser(id)
  if (snapshotUser) {
    viewedUser.value = snapshotUser
    isLoading.value = false
  } else {
    viewedUser.value = null
    isLoading.value = true
  }

  try {
    const token = await withTimeout(
      getAccessTokenSilently(),
      8000,
      'Authentifizierung dauert zu lange.',
    )

    void profileStore.load(token, true).catch(() => null)

    const response = await withTimeout(fetch(`${API_BASE}/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }), 12000, 'Benutzerdaten konnten nicht rechtzeitig geladen werden.')

    if (!response.ok) {
      throw new Error(`Benutzer konnte nicht geladen werden: ${response.status}`)
    }

    if (loadId !== activeLoadId) return

    viewedUser.value = await response.json() as BackendProfile
  } catch (error) {
    if (loadId !== activeLoadId) return
    if (!snapshotUser) {
      errorMessage.value = error instanceof Error ? error.message : 'Benutzer konnte nicht geladen werden.'
    }
  } finally {
    if (loadId === activeLoadId) {
      if (!snapshotUser) {
        isLoading.value = false
      }
    }
  }
}

watch(
  [isAuthLoading, isAuthenticated, () => route.params.id],
  ([authLoading, authenticated]) => {
    if (authLoading) {
      const rawId = Number(route.params.id)
      const snapshotUser = Number.isNaN(rawId) ? null : getRouteSnapshotUser(rawId)
      if (snapshotUser) {
        viewedUser.value = snapshotUser
        isLoading.value = false
      }
      return
    }

    if (!authenticated) {
      isLoading.value = false
      errorMessage.value = ''
      viewedUser.value = null
      return
    }

    void loadUser()
  },
  { immediate: true },
)
</script>

<template>
  <NavBar />

  <main class="user-overview-page">
    <section v-if="isLoading" class="overview-shell overview-shell--state">
      <div class="state-card">
        <p>Benutzer wird geladen...</p>
      </div>
    </section>

    <section v-else-if="errorMessage || !viewedUser" class="overview-shell overview-shell--state">
      <div class="state-card">
        <p>{{ errorMessage || 'Benutzer konnte nicht geladen werden.' }}</p>
        <router-link class="secondary-button" :to="backTarget">Zurück</router-link>
      </div>
    </section>

    <section v-else class="overview-shell">
      <div class="overview-panel">
        <div class="overview-topline">
          <router-link class="back-link" :to="backTarget">
            <v-icon size="18">mdi-arrow-left</v-icon>
            <span>Zurück</span>
          </router-link>

          <div class="overview-topline-actions">
            <router-link
              v-if="canEdit"
              class="primary-button primary-button--compact"
              :to="{ name: 'user-edit', params: { id: viewedUser.id }, query: { returnTo: route.fullPath }, state: { userSnapshot: viewedUserSnapshot } }"
            >
              <v-icon size="18">mdi-pencil</v-icon>
              <span>Bearbeiten</span>
            </router-link>
          </div>
        </div>

        <header class="overview-header">
          <div class="overview-avatar">
            <img v-if="avatarImage" :src="avatarImage" :alt="displayName">
            <span v-else class="overview-fallback">{{ avatarFallback }}</span>
          </div>

          <div class="overview-copy">
            <p class="eyebrow">Benutzerübersicht</p>
            <div class="overview-title-row">
              <h1>{{ displayName }}</h1>
              <span class="role-pill">{{ roleLabel }}</span>
            </div>
            <p class="overview-subtitle">{{ subtitle }}</p>
            <div class="overview-meta">
              <span v-if="viewedUser.status" class="meta-pill">{{ formatUserStatusLabel(viewedUser.status) }}</span>
              <span v-if="viewedUser.insurance" class="meta-pill meta-pill--soft">{{ displayValue(viewedUser.insurance) }}</span>
            </div>
          </div>
        </header>

        <div class="overview-grid">
          <section class="detail-card">
            <h2>{{ viewedUser.role === 'DOCTOR' ? 'Arztangaben' : 'Persönliche Daten' }}</h2>
            <dl class="detail-list">
              <div v-for="row in primaryRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-card">
            <h2>{{ viewedUser.role === 'DOCTOR' ? 'Kontakt & Praxis' : 'Kontakt & Adresse' }}</h2>

            <div class="contact-links">
              <a v-if="phoneUrl" :href="phoneUrl">
                <v-icon size="18">mdi-phone</v-icon>
                <span>{{ displayValue(viewedUser.phoneNumber) }}</span>
              </a>
              <a v-if="emailUrl" :href="emailUrl">
                <v-icon size="18">mdi-email</v-icon>
                <span>{{ displayValue(viewedUser.email) }}</span>
              </a>
              <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer">
                <v-icon size="18">mdi-web</v-icon>
                <span>{{ displayValue(viewedUser.website) }}</span>
              </a>
              <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer">
                <v-icon size="18">mdi-map-marker</v-icon>
                <span>{{ formatAddress(viewedUser) }}</span>
              </a>
            </div>

            <dl class="detail-list detail-list--compact">
              <div v-for="row in addressRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section class="detail-card" v-if="viewerIsAdmin && systemRows.length > 0">
          <h2>Systemdaten</h2>
          <dl class="detail-list detail-list--compact">
            <div v-for="row in systemRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <footer class="overview-footer">
          <router-link class="secondary-button" :to="backTarget">Zurück</router-link>
        </footer>
      </div>
    </section>
  </main>

  <AppFooter />
</template>

<style scoped>
.user-overview-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 36px 18px 52px;
  background:
    radial-gradient(circle at top left, rgba(21, 93, 252, 0.08), transparent 32%),
    linear-gradient(180deg, #f7faff 0%, #eef3fb 100%);
}

.overview-shell {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.overview-shell--state {
  display: grid;
  place-items: center;
  min-height: 420px;
}

.state-card {
  display: grid;
  gap: 14px;
  padding: 22px 26px;
  color: #1f2a44;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  border-radius: 20px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.overview-panel {
  padding: 22px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  border-radius: 26px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.overview-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.overview-topline-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #155dfc;
  text-decoration: none;
  font-weight: 700;
}

.back-link:hover {
  text-decoration: underline;
}

.overview-header {
  display: grid;
  grid-template-columns: 144px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 22px;
  border-bottom: 1px solid #e5ecf7;
}

.overview-avatar {
  width: 144px;
  height: 144px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(180deg, #eef4ff 0%, #dfeaff 100%);
  border: 2px solid #d8e3f7;
}

.overview-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overview-fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #155dfc;
  font-size: 50px;
  font-weight: 800;
}

.overview-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overview-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.overview-title-row h1 {
  margin: 0;
  color: #12213f;
  font-size: clamp(28px, 2.8vw, 44px);
  line-height: 1.04;
}

.overview-subtitle {
  margin: 14px 0 0;
  color: #64708a;
  font-size: 16px;
}

.overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.role-pill,
.meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.role-pill {
  color: #155dfc;
  background: #eaf1ff;
}

.meta-pill {
  color: #1f2a44;
  background: #f3f6fb;
}

.meta-pill--soft {
  color: #64708a;
  background: #edf2fb;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.detail-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #e2eaf9;
  border-radius: 20px;
}

.detail-card h2 {
  margin: 0 0 14px;
  color: #1f2a44;
  font-size: 18px;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
  margin: 0;
}

.detail-list--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-list div {
  display: grid;
  gap: 4px;
}

.detail-list dt {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail-list dd {
  margin: 0;
  color: #1f2a44;
  font-size: 15px;
  line-height: 1.45;
  word-break: break-word;
}

.contact-links {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.contact-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: #155dfc;
  text-decoration: none;
  font-weight: 600;
}

.contact-links a:hover {
  text-decoration: underline;
}

.overview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.secondary-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.secondary-button {
  color: #155dfc;
  background: #f0f6fe;
  border: 1px solid #d8e3f7;
}

.primary-button {
  color: #fff;
  background: #155dfc;
  border: 1px solid #155dfc;
}

.primary-button--compact {
  min-height: 38px;
  padding-inline: 14px;
}

.secondary-button:hover,
.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(21, 93, 252, 0.12);
}

@media (max-width: 980px) {
  .overview-header,
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-avatar {
    width: 132px;
    height: 132px;
  }
}

@media (max-width: 640px) {
  .user-overview-page {
    padding: 24px 14px 40px;
  }

  .overview-panel {
    padding: 20px;
    border-radius: 24px;
  }

  .overview-topline,
  .overview-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .overview-topline-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .primary-button--compact {
    width: 100%;
  }

  .detail-list,
  .detail-list--compact {
    grid-template-columns: 1fr;
  }
}
</style>
