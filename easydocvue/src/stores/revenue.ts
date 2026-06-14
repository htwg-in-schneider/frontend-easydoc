import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

export interface RevenueEntry {
  doctorId: number
  doctorName: string
  practiceName: string | null
  year: number
  month: number
  adminRevenue: number
  appointmentCount: number
}

export const useRevenueStore = defineStore('revenue', () => {
  const revenueData = ref<RevenueEntry[]>([])
  const isLoading = ref(false)
  const selectedYear = ref<number | null>(new Date().getFullYear())

  async function fetchRevenue(token: string) {
    isLoading.value = true
    try {
      const params = new URLSearchParams()
      if (selectedYear.value !== null) params.set('year', String(selectedYear.value))
      const query = params.toString()

      const res = await fetch(`${API_BASE}/admin/revenue${query ? `?${query}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Revenue request failed: ${res.status}`)
      revenueData.value = await res.json()
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    revenueData.value = []
    selectedYear.value = new Date().getFullYear()
  }

  return {
    revenueData,
    isLoading,
    selectedYear,
    fetchRevenue,
    reset,
  }
})
