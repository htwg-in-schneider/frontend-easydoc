import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type UserRole = 'USER' | 'DOCTOR' | 'ADMIN'

export interface BackendProfile {
  id?: number | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  role?: UserRole | null
  auth0Id?: string | null
  insurance?: string | null
  status?: string | null
  age?: number | null
}

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export function roleRedirectPath(role?: UserRole | null) {
  if (role === 'ADMIN') return '/admin/users'
  if (role === 'DOCTOR') return '/doctor/dashboard'
  return '/doctors'
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<BackendProfile | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const role = computed(() => profile.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const isDoctor = computed(() => role.value === 'DOCTOR')
  const isUser = computed(() => role.value === 'USER')

  async function load(token: string, force = false) {
    if (profile.value && !force) return profile.value
    if (isLoading.value) return profile.value

    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { message?: string }
        throw new Error(error.message || `Profile request failed: ${response.status}`)
      }

      profile.value = await response.json() as BackendProfile
      return profile.value
    } catch (error) {
      profile.value = null
      errorMessage.value = error instanceof Error ? error.message : 'Backend-Profil konnte nicht geladen werden'
      return null
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    profile.value = null
    errorMessage.value = ''
    isLoading.value = false
  }

  return {
    profile,
    isLoading,
    errorMessage,
    role,
    isAdmin,
    isDoctor,
    isUser,
    load,
    clear,
  }
})
