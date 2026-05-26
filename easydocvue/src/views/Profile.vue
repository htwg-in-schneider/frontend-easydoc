<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

interface BackendProfile {
  id?: number | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  role?: string | null
  oauthId?: string | null
  insurance?: string | null
  status?: string | null
  age?: number | null
}

const { isAuthenticated, getAccessTokenSilently } = useAuth0()

const profile = ref<BackendProfile | null>(null)
const profileMessage = ref('Backend-Profil wird geladen')
const isLoadingBackendProfile = ref(false)

const displayName = computed(() => {
  const firstName = profile.value?.firstName?.trim()
  const lastName = profile.value?.lastName?.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  return fullName || profile.value?.name || 'Unbekannter Benutzer'
})

const fallbackInitial = computed(() => {
  const source = profile.value?.firstName || profile.value?.name || profile.value?.email || 'U'
  return source.charAt(0).toUpperCase()
})

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : value
}

async function loadBackendProfile() {
  if (!isAuthenticated.value || isLoadingBackendProfile.value) return

  isLoadingBackendProfile.value = true
  profileMessage.value = 'Backend-Profil wird geladen'

  try {
    const token = await getAccessTokenSilently()
    const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
    const response = await fetch(`${apiBase}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 404) {
      profile.value = null
      profileMessage.value = 'Kein Backend-Profil gefunden'
      return
    }

    if (!response.ok) {
      throw new Error(`Profile request failed: ${response.status}`)
    }

    profile.value = await response.json() as BackendProfile
    profileMessage.value = ''
  } catch {
    profile.value = null
    profileMessage.value = 'Backend-Profil konnte nicht geladen werden'
  } finally {
    isLoadingBackendProfile.value = false
  }
}

watch(isAuthenticated, (authenticated) => {
  if (authenticated) loadBackendProfile()
}, { immediate: true })
</script>

<template>
  <NavBar />
  <main class="profile-page">
    <section class="profile-panel">
      <div class="profile-header">
        <div class="profile-fallback">{{ fallbackInitial }}</div>

        <div>
          <h1>Profil</h1>
          <p>{{ profile ? displayName : profileMessage }}</p>
        </div>
      </div>

      <dl v-if="profile" class="profile-details">
        <div>
          <dt>Vorname</dt>
          <dd>{{ displayValue(profile.firstName) }}</dd>
        </div>
        <div>
          <dt>Nachname</dt>
          <dd>{{ displayValue(profile.lastName) }}</dd>
        </div>
        <div>
          <dt>E-Mail</dt>
          <dd>{{ displayValue(profile.email) }}</dd>
        </div>
        <div>
          <dt>Rolle</dt>
          <dd>{{ displayValue(profile.role) }}</dd>
        </div>
        <div>
          <dt>OAuth ID</dt>
          <dd class="mono">{{ displayValue(profile.oauthId) }}</dd>
        </div>
        <div>
          <dt>Versicherung</dt>
          <dd>{{ displayValue(profile.insurance) }}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{{ displayValue(profile.status) }}</dd>
        </div>
        <div>
          <dt>Alter</dt>
          <dd>{{ displayValue(profile.age) }}</dd>
        </div>
      </dl>

      <p v-else class="profile-message">{{ profileMessage }}</p>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.profile-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px;
  background: #eef3fb;
}

.profile-panel {
  width: min(720px, 100%);
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 8px;
}

.profile-header {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 28px;
}

.profile-header h1 {
  margin: 0 0 6px;
  color: #1f2a44;
  font-size: 28px;
}

.profile-header p {
  margin: 0;
  color: #64708a;
}

.profile-fallback {
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  border-radius: 50%;
}

.profile-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #155dfc;
  font-size: 28px;
  font-weight: 700;
  background: #eef3fb;
  border: 2px solid #d8e3f7;
}

.profile-details {
  display: grid;
  gap: 14px;
  margin: 0;
}

.profile-details div {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid #edf1f8;
}

.profile-details dt {
  color: #64708a;
  font-weight: 700;
}

.profile-details dd {
  min-width: 0;
  margin: 0;
  color: #1f2a44;
  overflow-wrap: anywhere;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 14px;
}

.profile-message {
  margin: 0;
  color: #64708a;
}

@media (max-width: 640px) {
  .profile-panel {
    padding: 24px;
  }

  .profile-details div {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
