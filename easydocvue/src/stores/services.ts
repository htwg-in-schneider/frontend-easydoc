import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

export interface Dienstleistung {
  id: number
  bezeichnung: string
  preis: number
  doctorId?: number | null
  doctorTypeId?: number | null
  doctorTypeName?: string | null
  scope: 'STANDARD' | 'CUSTOM'
}

export const useServiceStore = defineStore('services', () => {
  const services = ref<Dienstleistung[]>([])
  const isLoading = ref(false)

  async function fetchForDoctor(doctorId: number): Promise<Dienstleistung[]> {
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/dienstleistungen?doctorId=${doctorId}`)
      if (!res.ok) throw new Error(`Failed to load services: ${res.status}`)
      services.value = await res.json()
      return services.value
    } finally {
      isLoading.value = false
    }
  }

  async function create(
    payload: { bezeichnung: string; preis: number; scope?: string },
    token: string,
  ): Promise<Dienstleistung> {
    const res = await fetch(`${API_BASE}/dienstleistungen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message ?? `Failed to create service: ${res.status}`)
    }
    const created: Dienstleistung = await res.json()
    services.value = [...services.value, created]
    return created
  }

  async function update(
    id: number,
    payload: Partial<{ bezeichnung: string; preis: number; scope: string }>,
    token: string,
  ): Promise<Dienstleistung> {
    const res = await fetch(`${API_BASE}/dienstleistungen/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Failed to update service: ${res.status}`)
    const updated: Dienstleistung = await res.json()
    services.value = services.value.map(s => (s.id === id ? updated : s))
    return updated
  }

  async function remove(id: number, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/dienstleistungen/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Failed to delete service: ${res.status}`)
    services.value = services.value.filter(s => s.id !== id)
  }

  return { services, isLoading, fetchForDoctor, create, update, remove }
})
