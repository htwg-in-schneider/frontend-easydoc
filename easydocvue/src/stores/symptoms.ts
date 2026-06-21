import { defineStore } from 'pinia'
import { ref } from 'vue'
import { normalizeUserStatus, normalizeUserTitle } from '@/utils/userFields'
import type { Doctor, Specialization } from '@/stores/doctors'

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

export interface Symptom {
  id: number
  bezeichnung: string
  beschreibung: string | null
  active: boolean
}

export interface SymptomSpecializationResult {
  specialization: Specialization | null
  score: number
  relevancePercent: number
  matchCount: number
  matchedSymptoms: string[]
}

export interface SymptomDoctorResult {
  doctor: Doctor
  score: number
  relevancePercent: number
  matchedSymptoms: string[]
  nextAvailableSlot: string | null
}

export interface SymptomAnalysisResult {
  specializations: SymptomSpecializationResult[]
  doctors: SymptomDoctorResult[]
  disclaimer: string
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`
    try {
      if (contentType.includes('application/json')) {
        const body = await response.json() as { message?: string; error?: string }
        message = body.message || body.error || message
      } else {
        const text = await response.text()
        if (text) {
          message = text
        }
      }
    } catch {
      // Fallback message remains intact.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (contentType.includes('application/json')) {
    return await response.json()
  }

  return (await response.text()) as T
}

function normalizeSpecialization(value: any): Specialization | null {
  if (!value || (value.id === undefined && !value.name)) {
    return null
  }

  return {
    id: Number(value.id),
    name: value.name ?? '',
  }
}

function normalizeDoctor(value: any): Doctor {
  const specialization = normalizeSpecialization(value.specialization ?? value.doctorType)
  const rating = value.rating !== null && value.rating !== undefined ? Number(value.rating) : null
  const distance = value.distance !== null && value.distance !== undefined ? Number(value.distance) : null

  return {
    ...value,
    id: Number(value.id),
    title: normalizeUserTitle(value.title),
    status: normalizeUserStatus(value.status),
    rating: rating !== null && Number.isFinite(rating) ? rating : null,
    distance: distance !== null && Number.isFinite(distance) ? distance : null,
    specialization,
    doctorType: specialization,
    city: typeof value.city === 'string' ? value.city : value.city?.name ?? null,
  }
}

function normalizeAnalysisResult(value: any): SymptomAnalysisResult {
  const specializations = Array.isArray(value?.specializations)
    ? value.specializations.map((entry: any) => ({
      specialization: normalizeSpecialization(entry.specialization),
      score: Number(entry.score ?? 0),
      relevancePercent: Number(entry.relevancePercent ?? 0),
      matchCount: Number(entry.matchCount ?? 0),
      matchedSymptoms: Array.isArray(entry.matchedSymptoms)
        ? entry.matchedSymptoms.map((item: unknown) => String(item))
        : [],
    }))
    : []

  const doctors = Array.isArray(value?.doctors)
    ? value.doctors.map((entry: any) => ({
      doctor: normalizeDoctor(entry.doctor),
      score: Number(entry.score ?? 0),
      relevancePercent: Number(entry.relevancePercent ?? 0),
      matchedSymptoms: Array.isArray(entry.matchedSymptoms)
        ? entry.matchedSymptoms.map((item: unknown) => String(item))
        : [],
      nextAvailableSlot: entry.nextAvailableSlot ?? null,
    }))
    : []

  return {
    specializations,
    doctors,
    disclaimer: typeof value?.disclaimer === 'string' ? value.disclaimer : '',
  }
}

export const useSymptomStore = defineStore('symptoms', () => {
  const symptoms = ref<Symptom[]>([])
  const analysis = ref<SymptomAnalysisResult | null>(null)
  const isSymptomsLoading = ref(false)
  const isAnalyzing = ref(false)
  const errorMessage = ref('')

  async function fetchSymptoms(): Promise<Symptom[]> {
    isSymptomsLoading.value = true
    errorMessage.value = ''

    try {
      const data = await requestJson<Symptom[]>(`${API_BASE}/symptoms`)
      symptoms.value = Array.isArray(data)
        ? data
            .map((symptom) => ({
              id: Number(symptom.id),
              bezeichnung: symptom.bezeichnung ?? '',
              beschreibung: symptom.beschreibung ?? null,
              active: Boolean(symptom.active),
            }))
            .filter((symptom) => symptom.active)
        : []
      return symptoms.value
    } catch (error) {
      symptoms.value = []
      errorMessage.value = error instanceof Error ? error.message : 'Symptome konnten nicht geladen werden.'
      return []
    } finally {
      isSymptomsLoading.value = false
    }
  }

  async function analyzeSymptoms(symptomIds: number[]): Promise<SymptomAnalysisResult> {
    isAnalyzing.value = true
    errorMessage.value = ''

    try {
      const payload = {
        symptomIds: symptomIds.filter((id) => Number.isFinite(id)),
      }
      const data = await requestJson<any>(`${API_BASE}/symptom-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      analysis.value = normalizeAnalysisResult(data)
      return analysis.value
    } catch (error) {
      analysis.value = null
      errorMessage.value = error instanceof Error ? error.message : 'Analyse konnte nicht ausgeführt werden.'
      throw error
    } finally {
      isAnalyzing.value = false
    }
  }

  function clearAnalysis() {
    analysis.value = null
    errorMessage.value = ''
  }

  return {
    symptoms,
    analysis,
    isSymptomsLoading,
    isAnalyzing,
    errorMessage,
    fetchSymptoms,
    analyzeSymptoms,
    clearAnalysis,
  }
})
