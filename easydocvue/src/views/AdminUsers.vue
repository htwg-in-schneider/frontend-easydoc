<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import { API_BASE, roleRedirectPath, useProfileStore, type BackendProfile, type UserRole } from '@/stores/profile'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const roles: UserRole[] = ['USER', 'DOCTOR', 'ADMIN']

const router = useRouter()
const { getAccessTokenSilently } = useAuth0()
const profileStore = useProfileStore()

const users = ref<BackendProfile[]>([])
const search = ref('')
const message = ref('')
const isLoading = ref(false)
const editingUser = ref<BackendProfile | null>(null)
const showModal = ref(false)

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return users.value

  return users.value.filter((user) => {
    return [user.firstName, user.lastName, user.email, user.role, user.status, user.insurance]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  })
})

async function loadUsers() {
  isLoading.value = true
  message.value = ''

  try {
    const token = await getAccessTokenSilently()
    const profile = await profileStore.load(token)
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

async function saveUser() {
  if (!editingUser.value || !editingUser.value.id) return
  message.value = ''

  try {
    const token = await getAccessTokenSilently()
    const response = await fetch(`${API_BASE}/api/users/${editingUser.value.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingUser.value),
    })

    if (!response.ok) {
      throw new Error(`Benutzer konnte nicht gespeichert werden: ${response.status}`)
    }

    const updated = await response.json() as BackendProfile
    users.value = users.value.map((entry) => entry.id === updated.id ? updated : entry)
    message.value = 'Benutzer gespeichert.'
    closeModal()
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Benutzer konnte nicht gespeichert werden'
  }
}

function openModal(user: BackendProfile) {
  editingUser.value = { ...user }
  showModal.value = true
}

function closeModal() {
  editingUser.value = null
  showModal.value = false
}

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : value
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
      <button type="button" class="btn btn-primary" @click="loadUsers">Aktualisieren</button>
    </div>

    <p v-if="message" class="message">{{ message }}</p>
    <p v-if="isLoading" class="message">Benutzer werden geladen...</p>

    <div class="user-grid">
      <article v-for="(user, index) in filteredUsers" :key="user.id ?? user.auth0Id ?? user.email ?? index" class="user-card">
        <div class="card-header">
          <div>
            <h3>{{ displayValue(user.firstName) }} {{ displayValue(user.lastName) }}</h3>
            <p class="user-email">{{ displayValue(user.email) }}</p>
          </div>
          <span class="role-pill">{{ displayValue(user.role) }}</span>
        </div>

        <div class="user-meta">
          <span v-if="user.status" class="meta-item">Status: {{ user.status }}</span>
        </div>

        <button type="button" class="btn btn-primary" @click="openModal(user)">Details</button>
      </article>
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal && editingUser" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Benutzer bearbeiten</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="form-grid">
          <label>
            Vorname
            <input v-model="editingUser.firstName" type="text">
          </label>
          <label>
            Nachname
            <input v-model="editingUser.lastName" type="text">
          </label>
          <label>
            E-Mail
            <input v-model="editingUser.email" type="email">
          </label>
          <label>
            Name
            <input v-model="editingUser.name" type="text">
          </label>
          <label>
            Rolle
            <select v-model="editingUser.role">
              <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
            </select>
          </label>
          <label>
            Versicherung
            <input v-model="editingUser.insurance" type="text">
          </label>
          <label>
            Status
            <input v-model="editingUser.status" type="text">
          </label>
          <label>
            Alter
            <input v-model.number="editingUser.age" type="number" min="0">
          </label>
          <label class="full-width">
            Auth0 ID (schreibgeschützt)
            <input :value="editingUser.auth0Id" type="text" readonly>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeModal">Abbrechen</button>
          <button type="button" class="btn btn-primary" @click="saveUser">Speichern</button>
        </div>
      </div>
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
  padding: 24px;
  background: #ffffff;
  border: 1px solid #edf1f8;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(21, 93, 252, 0.15);
}

.card-header {
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0 0 6px;
  color: #333;
  font-size: 20px;
}

.user-email {
  margin: 0 0 12px;
  color: #666;
  font-size: 14px;
}

.role-pill {
  display: inline-block;
  padding: 6px 12px;
  color: #155dfc;
  font-size: 13px;
  font-weight: 700;
  background: #f0f6fe;
  border-radius: 20px;
}

.user-meta {
  margin-bottom: 16px;
  font-size: 14px;
  color: #555;
}

.meta-item {
  display: block;
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
  margin-top: auto;
}

.btn-primary {
  color: #ffffff;
  background: #155dfc;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  color: #155dfc;
  background: #f0f6fe;
  border: 1px solid #155dfc;
}

.btn-secondary:hover {
  background: #e8f1fe;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #ffffff;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #edf1f8;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 22px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 24px;
}

.form-grid label {
  display: grid;
  gap: 6px;
  color: #444;
  font-size: 14px;
  font-weight: 600;
}

.form-grid input,
.form-grid select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.form-grid input:focus,
.form-grid select:focus {
  outline: none;
  border-color: #155dfc;
}

.form-grid input[readonly] {
  color: #777;
  background: #f5f5f5;
}

.full-width {
  grid-column: 1 / -1;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #edf1f8;
}

.message {
  margin: 0 0 18px;
  color: #64708a;
}

@media (max-width: 820px) {
  .user-grid {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal {
    max-width: 100%;
  }
}
</style>
