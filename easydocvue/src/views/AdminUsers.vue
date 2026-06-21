<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE, roleRedirectPath, useProfileStore, type BackendProfile } from '@/stores/profile'
import { useDoctorStore, type City } from '@/stores/doctors'
import { formatUserName, formatUserStatusLabel } from '@/utils/userFields'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const route = useRoute()
const { getAccessTokenSilently } = useAuth0()
const profileStore = useProfileStore()
const doctorStore = useDoctorStore()
const { cities } = storeToRefs(doctorStore)

const users = ref<BackendProfile[]>([])
const search = ref('')
const selectedCities = ref<string[]>([])
const selectedRoles = ref<string[]>([])
const selectedSort = ref('createdAt-desc')
const visibleLimit = ref(10)
const isCityOpen = ref(false)
const isRoleOpen = ref(false)
const isSortOpen = ref(false)
const cityDropdownRef = ref<HTMLElement | null>(null)
const roleDropdownRef = ref<HTMLElement | null>(null)
const sortDropdownRef = ref<HTMLElement | null>(null)
const message = ref('')
const isLoading = ref(false)

const roleOptions = [
  { value: 'USER', label: 'User' },
  { value: 'DOCTOR', label: 'Doktor' },
  { value: 'ADMIN', label: 'Admin' },
] as const

const sortOptions = [
  { value: 'createdAt-desc', label: 'Erstellt: neueste zuerst' },
  { value: 'createdAt-asc', label: 'Erstellt: älteste zuerst' },
  { value: 'updatedAt-desc', label: 'Aktualisiert: neueste zuerst' },
  { value: 'updatedAt-asc', label: 'Aktualisiert: älteste zuerst' },
] as const

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  const selectedCitySet = new Set(selectedCities.value.map((city) => city.trim().toLowerCase()))
  const selectedRoleSet = new Set(selectedRoles.value.map((role) => role.trim().toUpperCase()))

  return users.value.filter((user) => {
    const cityName = getCityName(user.city).toLowerCase()
    const roleName = String(user.role ?? '').toUpperCase()
    const matchesSearch =
      !term ||
      [
        user.firstName,
        user.lastName,
        user.title,
        user.email,
        user.role,
        user.status,
        user.insurance,
        user.practiceName,
        user.phoneNumber,
        getCityName(user.city),
        user.doctorType?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))

    const matchesCity = selectedCitySet.size === 0 || selectedCitySet.has(cityName)
    const matchesRole = selectedRoleSet.size === 0 || selectedRoleSet.has(roleName)

    return matchesSearch && matchesCity && matchesRole
  })
})

const sortedUsers = computed(() => {
  const [field, direction] = selectedSort.value.split('-') as ['createdAt' | 'updatedAt', 'asc' | 'desc']

  const score = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return null
    const timestamp = new Date(value).getTime()
    return Number.isFinite(timestamp) ? timestamp : null
  }

  return [...filteredUsers.value].sort((left, right) => {
    const leftScore = score(left[field])
    const rightScore = score(right[field])

    if (leftScore === null && rightScore === null) return (left.id ?? 0) - (right.id ?? 0)
    if (leftScore === null) return 1
    if (rightScore === null) return -1

    if (leftScore !== rightScore) {
      return direction === 'asc' ? leftScore - rightScore : rightScore - leftScore
    }

    return (left.id ?? 0) - (right.id ?? 0)
  })
})

const visibleUsers = computed(() => sortedUsers.value.slice(0, visibleLimit.value))
const canLoadMoreUsers = computed(() => visibleLimit.value < sortedUsers.value.length)

const selectedCityLabel = computed(() => {
  if (selectedCities.value.length === 0) return 'Alle Orte'
  if (selectedCities.value.length === 1) return selectedCities.value[0]
  return `${selectedCities.value.length} Orte ausgewählt`
})

const selectedRoleLabel = computed(() => {
  if (selectedRoles.value.length === 0) return 'Alle Rollen'
  if (selectedRoles.value.length === 1) {
    return roleOptions.find((role) => role.value === selectedRoles.value[0])?.label || 'Alle Rollen'
  }
  return `${selectedRoles.value.length} Rollen ausgewählt`
})

const selectedSortLabel = computed(() => sortOptions.find((sort) => sort.value === selectedSort.value)?.label || 'Erstellt: neueste zuerst')
const hasActiveUserFilters = computed(() => (
  search.value.trim().length > 0
  || selectedCities.value.length > 0
  || selectedRoles.value.length > 0
))
const userCountLabel = computed(() => {
  const count = sortedUsers.value.length
  return hasActiveUserFilters.value ? `${count} Treffer` : `${count} Benutzer`
})

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : value
}

function getCityName(city: unknown) {
  if (!city) return ''
  if (typeof city === 'string') return city
  if (typeof city === 'object' && 'name' in city) {
    const name = (city as City).name
    return typeof name === 'string' ? name : ''
  }
  return ''
}

function displayName(user: BackendProfile) {
  return formatUserName(user) || 'Nicht hinterlegt'
}

function getAvatarInitials(user: BackendProfile) {
  const firstName = user.firstName?.trim() || ''
  const lastName = user.lastName?.trim() || ''
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
    }
    return user.name.trim().slice(0, 2).toUpperCase()
  }

  const email = user.email?.trim() || ''
  return email.slice(0, 2).toUpperCase() || 'U'
}

function getAvatarImage(user: BackendProfile) {
  return user.imageUrl?.trim() || ''
}

function toggleCity(city: string) {
  const index = selectedCities.value.indexOf(city)
  if (index >= 0) {
    selectedCities.value.splice(index, 1)
  } else {
    selectedCities.value.push(city)
  }
}

function toggleRole(role: string) {
  const index = selectedRoles.value.indexOf(role)
  if (index >= 0) {
    selectedRoles.value.splice(index, 1)
  } else {
    selectedRoles.value.push(role)
  }
}

function selectSort(sort: string) {
  selectedSort.value = sort
  isSortOpen.value = false
}

function isCitySelected(city: string) {
  return selectedCities.value.includes(city)
}

function isRoleSelected(role: string) {
  return selectedRoles.value.includes(role)
}

function onDocumentClick(event: MouseEvent) {
  if (!event.target) return
  const target = event.target as Node

  if (cityDropdownRef.value && !cityDropdownRef.value.contains(target)) {
    isCityOpen.value = false
  }

  if (roleDropdownRef.value && !roleDropdownRef.value.contains(target)) {
    isRoleOpen.value = false
  }

  if (sortDropdownRef.value && !sortDropdownRef.value.contains(target)) {
    isSortOpen.value = false
  }
}

function openUser(user: BackendProfile) {
  if (!user.id) return
  router.push({
    name: 'user-detail',
    params: { id: user.id },
    query: { returnTo: route.fullPath },
    state: { userSnapshot: JSON.stringify(user) },
  })
}

function openCreateUser() {
  router.push({
    name: 'user-create',
    query: { returnTo: route.fullPath },
  })
}

function loadMoreUsers() {
  visibleLimit.value += 10
}

async function loadUsers() {
  isLoading.value = true
  message.value = ''
  visibleLimit.value = 10

  try {
    const token = await getAccessTokenSilently()
    const profile = await profileStore.load(token, true)
    if (profile?.role !== 'ADMIN') {
      router.replace(roleRedirectPath(profile?.role))
      return
    }

    const response = await fetch(`${API_BASE}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Benutzer konnten nicht geladen werden: ${response.status}`)
    }

    users.value = await response.json() as BackendProfile[]
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Benutzer konnten nicht geladen werden'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  await Promise.allSettled([
    doctorStore.fetchCities(),
    loadUsers(),
  ])
})

watch([search, selectedCities, selectedRoles, selectedSort], () => {
  visibleLimit.value = 10
}, { deep: true })

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <NavBar />

  <section class="admin-header">
    <div class="container admin-header__content">
      <h1>Benutzerverwaltung</h1>
      <p>Profile und Rollen verwalten.</p>
    </div>
  </section>

  <main class="admin-container">
    <div class="filter-bar">
      <input v-model="search" type="search" placeholder="Benutzer suchen">
      <div ref="cityDropdownRef" class="filter-dropdown">
        <span class="filter-label">Ort filtern</span>
        <button type="button" class="filter-trigger" @click="isCityOpen = !isCityOpen">
          {{ selectedCityLabel }}
          <span>⌄</span>
        </button>
        <div v-if="isCityOpen" class="filter-popup">
          <label v-for="city in cities" :key="city.id" class="filter-option">
            <input
              type="checkbox"
              :checked="isCitySelected(city.name)"
              @change="toggleCity(city.name)"
            >
            <span>{{ city.name }}</span>
          </label>
        </div>
      </div>

      <div ref="roleDropdownRef" class="filter-dropdown">
        <span class="filter-label">Rolle filtern</span>
        <button type="button" class="filter-trigger" @click="isRoleOpen = !isRoleOpen">
          {{ selectedRoleLabel }}
          <span>⌄</span>
        </button>
        <div v-if="isRoleOpen" class="filter-popup">
          <label v-for="role in roleOptions" :key="role.value" class="filter-option">
            <input
              type="checkbox"
              :checked="isRoleSelected(role.value)"
              @change="toggleRole(role.value)"
            >
            <span>{{ role.label }}</span>
          </label>
        </div>
      </div>

      <div ref="sortDropdownRef" class="filter-dropdown">
        <span class="filter-label">Sortieren</span>
        <button type="button" class="filter-trigger" @click="isSortOpen = !isSortOpen">
          {{ selectedSortLabel }}
          <span>⌄</span>
        </button>
        <div v-if="isSortOpen" class="filter-popup">
          <label v-for="sort in sortOptions" :key="sort.value" class="filter-option">
            <input
              type="radio"
              name="user-sort"
              :checked="selectedSort === sort.value"
              @change="selectSort(sort.value)"
            >
            <span>{{ sort.label }}</span>
          </label>
        </div>
      </div>

      <button type="button" class="btn btn-primary refresh-button" @click="loadUsers">Aktualisieren</button>
    </div>
    <p class="filter-hint">Ohne Auswahl werden alle Orte und Rollen angezeigt. Sortierung erfolgt nach dem gewählten Datum.</p>

    <div class="actions-row">
      <div class="results-chip" aria-live="polite">
        <strong>{{ userCountLabel }}</strong>
      </div>
      <button type="button" class="btn btn-primary create-button" @click="openCreateUser">
        <v-icon size="18">mdi-plus</v-icon>
        <span>Benutzer hinzufügen</span>
      </button>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="isLoading" class="message">Benutzer werden geladen...</p>
    <p v-else-if="filteredUsers.length === 0" class="message empty-message">Keine Benutzer gefunden.</p>

    <div v-else class="user-grid">
      <article
        v-for="(user, index) in visibleUsers"
        :key="user.id ?? user.auth0Id ?? user.email ?? index"
        class="user-card"
        role="link"
        tabindex="0"
        :aria-label="`Benutzerdetails öffnen: ${displayName(user)}`"
        @click="openUser(user)"
        @keydown.enter.self.prevent="openUser(user)"
        @keydown.space.self.prevent="openUser(user)"
      >
        <div class="card-header">
          <div class="user-identity">
            <div class="user-avatar">
              <img v-if="getAvatarImage(user)" :src="getAvatarImage(user)" :alt="displayName(user)">
              <span v-else class="user-avatar-fallback">{{ getAvatarInitials(user) }}</span>
            </div>
            <div class="user-heading">
              <h3>{{ displayName(user) }}</h3>
              <p class="user-email">{{ displayValue(user.email) }}</p>
            </div>
          </div>
          <span class="role-pill">{{ displayValue(user.role) }}</span>
        </div>

        <div class="user-meta">
          <span class="meta-item">Status: {{ formatUserStatusLabel(user.status) }}</span>
          <span class="meta-item">Alter: {{ displayValue(user.age) }}</span>
          <span class="meta-item">Ort: {{ displayValue(getCityName(user.city)) }}</span>
          <span v-if="user.practiceName" class="meta-item">Praxis: {{ user.practiceName }}</span>
          <span v-if="user.doctorType?.name" class="meta-item">Fachrichtung: {{ user.doctorType.name }}</span>
        </div>

        <div class="card-actions">
          <button type="button" class="btn btn-primary" @click.stop="openUser(user)">Ansehen</button>
        </div>
      </article>
    </div>

    <div v-if="canLoadMoreUsers" class="load-more-row">
      <button type="button" class="btn btn-secondary load-more-button" @click="loadMoreUsers">Mehr laden</button>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.admin-header {
  text-align: center;
  padding: 54px 20px 28px;
  background: linear-gradient(135deg, #155dfc10, #7AAE3810);
}

.admin-header__content {
  display: grid;
  justify-items: center;
  gap: 10px;
}

.admin-header h1 {
  margin: 0;
  color: #333;
  font-size: 34px;
}

.admin-header p {
  margin: 0;
  color: #666;
  font-size: 17px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 20px 56px;
}

.filter-bar {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #edf1f8;
  border-radius: 12px;
}

.filter-bar input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
}

.filter-bar > input {
  align-self: end;
}

.filter-dropdown {
  position: relative;
  width: min(100%, 280px);
  display: flex;
  flex-direction: column;
}

.filter-label {
  display: block;
  margin: 0 0 6px;
  font-size: 13px;
  color: #555;
}

.filter-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 44px;
  padding: 0 14px;
  color: #1f2a44;
  font: inherit;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
}

.filter-trigger span {
  margin-left: 12px;
  color: #155dfc;
}

.filter-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  display: grid;
  width: 100%;
  max-height: 240px;
  overflow: auto;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  box-shadow: 0 16px 34px rgba(24, 58, 150, 0.18);
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #26334d;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
}

.filter-option:hover {
  color: #155dfc;
  background: #eef3fb;
}

.filter-option input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #155dfc;
  box-shadow: none;
}

.filter-hint {
  margin: -8px 0 18px;
  color: #6b7280;
  font-size: 13px;
}

.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 18px;
  gap: 12px;
  flex-wrap: wrap;
}

.create-button {
  gap: 8px;
  min-width: 210px;
}

.results-chip {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid #d8e3f7;
  background: #f6f9ff;
  color: #1f2a44;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
}

.results-chip strong {
  font-size: 14px;
  font-weight: 700;
}

.refresh-button {
  align-self: end;
  height: 44px;
}

@media (max-width: 900px) {
  .filter-bar {
    flex-direction: column;
  }

  .actions-row {
    justify-content: stretch;
  }

  .create-button {
    width: 100%;
    min-width: 0;
  }

  .results-chip {
    width: 100%;
    justify-content: center;
  }

  .filter-bar input,
  .filter-dropdown {
    width: 100%;
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: #ffffff;
  border: 1px solid #edf1f8;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  cursor: pointer;
  outline: none;
}

.user-card:hover,
.user-card:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(21, 93, 252, 0.15);
  border-color: #d8e3f7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.user-avatar {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(180deg, #eef4ff 0%, #dfeaff 100%);
  border: 1px solid #d8e3f7;
  box-shadow: 0 8px 20px rgba(21, 93, 252, 0.08);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #155dfc;
  font-weight: 800;
  font-size: 17px;
}

.user-heading {
  min-width: 0;
}

.card-header h3 {
  margin: 0 0 6px;
  color: #333;
  font-size: 20px;
}

.user-email {
  margin: 0;
  color: #666;
  font-size: 14px;
  overflow-wrap: anywhere;
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
  border-radius: 20px;
}

.user-meta {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: #555;
}

.meta-item {
  display: block;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.btn-primary {
  color: #ffffff;
  background: #155dfc;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.message {
  margin: 0 0 16px;
  color: #64708a;
}

.empty-message {
  padding: 16px 0 8px;
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.load-more-button {
  min-width: 180px;
}

@media (max-width: 640px) {
  .filter-bar {
    flex-direction: column;
  }

  .card-header {
    flex-direction: column;
  }

  .user-identity {
    width: 100%;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
  }
}
</style>
