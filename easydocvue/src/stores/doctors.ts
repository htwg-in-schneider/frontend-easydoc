import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

export interface DoctorType {
  id: number
  name: string
}

export interface User {
  id: number
  auth0Id?: string | null
  title: string | null
  firstName: string
  lastName: string
  practiceName: string | null
  status: string | null
  rating: number | null
  phoneNumber: string | null
  email: string | null
  website: string | null
  distance: number | null
  imageUrl: string | null
  street: string | null
  postcode: string | null
  city: string | null
  country: string | null
  role?: 'USER' | 'DOCTOR' | 'ADMIN' | null
  doctorType: DoctorType | null
}

export type Doctor = User
export type DoctorPayload = Omit<User, 'id' | 'auth0Id'>

export interface UserSummary {
  id: number
  firstName: string | null
  lastName: string | null
}

export interface Appointment {
  id: number
  date: string
  time: string | null
  price: number | null
  doctor?: Doctor | null
  user?: UserSummary | null
}

export interface AppointmentPayload {
  date: string
  time: string | null
  price: number | null
  doctorId: number
  userId?: number | null
}

export interface DoctorSearchFilters {
  name?: string
  doctorType?: string
  city?: string
  status?: string
  minRating?: number
  maxDistance?: number
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return await res.json()
}

function jsonHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function matchesDoctorType(doctor: User, doctorTypeFilter?: string) {
  const filter = doctorTypeFilter?.trim().toLowerCase()
  if (!filter) return true

  return (
    String(doctor.doctorType?.id ?? '').toLowerCase() === filter ||
    (doctor.doctorType?.name ?? '').toLowerCase() === filter
  )
}

export function formatDoctorName(doctor: Pick<User, 'title' | 'firstName' | 'lastName'>) {
  return [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean).join(' ')
}

export function getDoctorTypeName(doctorType: DoctorType | null | undefined) {
  return doctorType?.name || 'Fachrichtung unbekannt'
}

export const useDoctorStore = defineStore('doctors', () => {
  const doctors = ref<User[]>([])
  const doctorTypes = ref<DoctorType[]>([])

  async function fetchAll(): Promise<User[]> {
    const data = await requestJson<User[]>(`${API_BASE}/doctors`)
    doctors.value = Array.isArray(data) ? data : []
    return doctors.value
  }

  async function fetchDoctorTypes(): Promise<DoctorType[]> {
    const data = await requestJson<DoctorType[]>(`${API_BASE}/doctor-types`)
    doctorTypes.value = Array.isArray(data) ? data : []
    return doctorTypes.value
  }

  async function search(filters: DoctorSearchFilters): Promise<User[]> {
    const params = new URLSearchParams()
    const name = filters.name?.trim()
    const city = filters.city?.trim()
    const status = filters.status?.trim()
    const doctorType = filters.doctorType?.trim()

    if (name) {
      params.set('firstName', name)
      params.set('lastName', name)
    }
    if (city) params.set('city', city)
    if (status) params.set('status', status)
    if (doctorType) params.set('doctorType', doctorType)
    if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating))
    if (filters.maxDistance !== undefined) params.set('maxDistance', String(filters.maxDistance))

    const query = params.toString()
    const data = await requestJson<User[]>(`${API_BASE}/doctors${query ? `?${query}` : ''}`)
    doctors.value = (Array.isArray(data) ? data : []).filter((doctor) => {
      if (!matchesDoctorType(doctor, filters.doctorType)) return false
      if (filters.minRating && (doctor.rating === null || doctor.rating < filters.minRating)) return false
      if (filters.maxDistance && (doctor.distance === null || doctor.distance > filters.maxDistance)) return false
      return true
    })
    return doctors.value
  }

  async function getById(id: number): Promise<User | null> {
    const res = await fetch(`${API_BASE}/doctors/${id}`)
    if (!res.ok) return null
    return await res.json()
  }

  async function add(doctor: DoctorPayload, token?: string) {
    await requestJson<User>(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(doctor),
    })
  }

  async function update(id: number, data: DoctorPayload, token?: string) {
    await requestJson<User>(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(data),
    })
  }

  async function remove(id: number, token?: string) {
    await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  }

  async function getAppointments(doctorId: number): Promise<Appointment[]> {
    const data = await requestJson<Appointment[]>(`${API_BASE}/appointments/doctor/${doctorId}`)
    return Array.isArray(data) ? data : []
  }

  async function getMyAppointments(token: string): Promise<Appointment[]> {
    const data = await requestJson<Appointment[]>(`${API_BASE}/appointments/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return Array.isArray(data) ? data : []
  }

  async function addAppointment(appointment: AppointmentPayload) {
    await requestJson<Appointment>(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    })
  }

  async function removeAppointment(id: number, token?: string) {
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    if (!res.ok) {
      throw new Error(`Termin konnte nicht storniert werden: ${res.status} ${res.statusText}`)
    }
  }

  return {
    doctors,
    doctorTypes,
    fetchAll,
    fetchDoctorTypes,
    getById,
    add,
    update,
    remove,
    search,
    getAppointments,
    getMyAppointments,
    addAppointment,
    removeAppointment,
  }
})
