<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import { API_BASE, roleRedirectPath, useProfileStore, type BackendProfile } from '@/stores/profile'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const { getAccessTokenSilently } = useAuth0()
const profileStore = useProfileStore()

const users = ref<BackendProfile[]>([])
const search = ref('')
const cityFilter = ref('')
const message = ref('')
const isLoading = ref(false)

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  const city = cityFilter.value.trim().toLowerCase()

  return users.value.filter((user) => {
    const matchesSearch =
      !term ||
      [
        user.firstName,
        user.lastName,
        user.email,
        user.role,
        user.status,
        user.insurance,
        user.practiceName,
        user.phoneNumber,
        user.doctorType?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))

    const matchesCity = !city || String(user.city ?? '').toLowerCase().includes(city)

    return matchesSearch && matchesCity
  })
})

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : value
}

function displayName(user: BackendProfile) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Nicht hinterlegt'
}

function openUser(user: BackendProfile) {
  if (!user.id) return
  router.push({ name: 'user-edit', params: { id: user.id } })
}

async function loadUsers() {
  isLoading.value = true
  message.value = ''

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

onMounted(loadUsers)
</script>

<template>
  <NavBar />

  <section class="admin-header">
    <div class="container">
      <h1>Benutzerverwaltung</h1>
      <p>Profile und Rollen verwalten.</p>
    </div>
  </section>

  <main class="admin-container">
    <div class="filter-bar">
      <input v-model="search" type="search" placeholder="Benutzer suchen">
      <input v-model="cityFilter" type="search" placeholder="Ort filtern">
      <button type="button" class="btn btn-primary" @click="loadUsers">Aktualisieren</button>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="isLoading" class="message">Benutzer werden geladen...</p>
    <p v-else-if="filteredUsers.length === 0" class="message empty-message">Keine Benutzer gefunden.</p>

    <div v-else class="user-grid">
      <article
        v-for="(user, index) in filteredUsers"
        :key="user.id ?? user.auth0Id ?? user.email ?? index"
        class="user-card"
        role="link"
        tabindex="0"
        :aria-label="`Benutzer bearbeiten: ${displayName(user)}`"
        @click="openUser(user)"
        @keydown.enter.self.prevent="openUser(user)"
        @keydown.space.self.prevent="openUser(user)"
      >
        <div class="card-header">
          <div>
            <h3>{{ displayName(user) }}</h3>
            <p class="user-email">{{ displayValue(user.email) }}</p>
          </div>
          <span class="role-pill">{{ displayValue(user.role) }}</span>
        </div>

        <div class="user-meta">
          <span class="meta-item">Status: {{ displayValue(user.status) }}</span>
          <span class="meta-item">Alter: {{ displayValue(user.age) }}</span>
          <span v-if="user.city" class="meta-item">Ort: {{ user.city }}</span>
          <span v-if="user.practiceName" class="meta-item">Praxis: {{ user.practiceName }}</span>
          <span v-if="user.doctorType?.name" class="meta-item">Fachrichtung: {{ user.doctorType.name }}</span>
        </div>

        <div class="card-actions">
          <button type="button" class="btn btn-primary" @click.stop="openUser(user)">Bearbeiten</button>
        </div>
      </article>
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

.admin-header h1 {
  margin: 0 0 12px;
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
  gap: 12px;
  margin-bottom: 24px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #edf1f8;
  border-radius: 12px;
}

.filter-bar input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
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

@media (max-width: 640px) {
  .filter-bar {
    flex-direction: column;
  }

  .card-header {
    flex-direction: column;
  }
}
</style>
