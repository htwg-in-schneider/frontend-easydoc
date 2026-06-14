import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type UserRole = 'USER' | 'DOCTOR' | 'ADMIN'

export interface SpecializationRef {
  id?: number | null
  name?: string | null
}

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
  birthday?: string | null
  title?: string | null
  practiceName?: string | null
  rating?: number | null
  phoneNumber?: string | null
  website?: string | null
  street?: string | null
  postcode?: string | null
  city?: string | null
  country?: string | null
  imageUrl?: string | null
  distance?: number | null
  consultationFee?: number | null
  specialization?: SpecializationRef | null
  doctorType?: SpecializationRef | null
}

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export function roleRedirectPath(_role?: UserRole | null) {
  return '/'
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<BackendProfile | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  let _activeLoad: Promise<BackendProfile | null> | null = null

  const role = computed(() => profile.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'ADMIN')
  const isDoctor = computed(() => role.value === 'DOCTOR')
  const isUser = computed(() => role.value === 'USER')

  async function load(token: string, force = false): Promise<BackendProfile | null> {
    if (profile.value && !force) return profile.value
    if (_activeLoad) return _activeLoad

    isLoading.value = true
    errorMessage.value = ''

    _activeLoad = (async () => {
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

        const data = await response.json() as BackendProfile
        const specialization = data.specialization ?? data.doctorType ?? null
        profile.value = {
          ...data,
          specialization,
          doctorType: specialization,
        }
        return profile.value
      } catch (error) {
        profile.value = null
        errorMessage.value = error instanceof Error ? error.message : 'Backend-Profil konnte nicht geladen werden'
        return null
      } finally {
        isLoading.value = false
        _activeLoad = null
      }
    })()

    return _activeLoad
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
