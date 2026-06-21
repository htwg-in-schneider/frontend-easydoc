import { defineStore } from 'pinia'
import { ref } from 'vue'
import { normalizeSelection } from '@/utils/doctorFilters'
import {
  formatUserName,
  normalizeUserStatus,
  normalizeUserTitle,
  type UserStatus,
  type UserTitle,
} from '@/utils/userFields'

const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')}/api`

export interface Specialization {
  id: number
  name: string
}

export type DoctorType = Specialization

export interface User {
  id: number
  auth0Id?: string | null
  name?: string | null
  title: UserTitle | null
  firstName: string
  lastName: string
  practiceName: string | null
  status: UserStatus | null
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
  consultationFee?: number
  role?: 'USER' | 'DOCTOR' | 'ADMIN' | null
  specialization?: Specialization | null
  doctorType?: Specialization | null
}

export type Doctor = User
export type DoctorPayload = Omit<User, 'id' | 'auth0Id' | 'rating'> & {
  specialization?: Specialization | null
  doctorType?: Specialization | null
}

export interface UserSummary {
  id: number
  firstName: string | null
  lastName: string | null
  email?: string | null
  phoneNumber?: string | null
  practiceName?: string | null
  street?: string | null
  postcode?: string | null
  city?: string | null
  country?: string | null
}

export interface AppointmentServiceSummary {
  id?: number | null
  bezeichnung?: string | null
  name?: string | null
  preis?: number | null
}

export interface Appointment {
  id: number
  startDateTime: string
  endDateTime: string
  status: string
  price: number | null
  rating: number | null
  ratingComment: string | null
  reason: string | null
  doctor?: Doctor | null
  patient?: UserSummary | null
  user?: UserSummary | null
  service?: AppointmentServiceSummary | null
  dienstleistung?: AppointmentServiceSummary | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface AppointmentPayload {
  doctorId: number
  startDateTime: string
  reason?: string | null
  dienstleistungId?: number | null
}

export interface AppointmentRatingPayload {
  rating?: number | null
  ratingComment?: string | null
}

export interface AvailabilitySlot {
  startDateTime: string
  endDateTime: string
}

export interface AvailabilityRule {
  id?: number | null
  doctorId?: number | null
  dayOfWeek: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  bufferMinutes: number
  enabled: boolean
}

export interface DoctorSearchFilters {
  name?: string
  doctorType?: string | string[]
  city?: string | string[]
  status?: string
  minRating?: number
  maxDistance?: number
  sortByEarliestSlot?: boolean
}

export interface EarliestAvailability {
  doctorId: number
  earliestSlot: string | null
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const contentType = res.headers.get('content-type') || ''

  if (!res.ok) {
    const messageFromBody = async () => {
      try {
        if (contentType.includes('application/json')) {
          const body = await res.json() as { message?: string; error?: string }
          return body.message || body.error
        }
        const text = await res.text()
        return text || undefined
      } catch {
        return undefined
      }
    }

    const message = await messageFromBody()
    throw new Error(message || `Request failed: ${res.status} ${res.statusText}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  if (contentType.includes('application/json')) {
    return await res.json()
  }

  return (await res.text()) as T
}

function jsonHeaders(token?: string) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
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

function normalizeUserSummary(value: any): UserSummary | null {
  if (!value || value.id === undefined || value.id === null) {
    return null
  }

  return {
    ...value,
    id: Number(value.id),
    firstName: value.firstName ?? null,
    lastName: value.lastName ?? null,
    email: value.email ?? null,
    phoneNumber: value.phoneNumber ?? null,
    practiceName: value.practiceName ?? null,
    street: value.street ?? null,
    postcode: value.postcode ?? null,
    city: value.city ?? null,
    country: value.country ?? null,
  }
}

function normalizeAppointmentService(value: any): AppointmentServiceSummary | null {
  if (!value || (value.id === undefined && !value.bezeichnung && !value.name)) {
    return null
  }

  return {
    ...value,
    id: value.id !== undefined && value.id !== null ? Number(value.id) : null,
    bezeichnung: value.bezeichnung ?? null,
    name: value.name ?? null,
    preis: value.preis ?? null,
  }
}

function normalizeDoctor(doctor: any): Doctor {
  const specialization = normalizeSpecialization(doctor.specialization ?? doctor.doctorType)
  return {
    ...doctor,
    title: normalizeUserTitle(doctor.title),
    status: normalizeUserStatus(doctor.status),
    specialization,
    doctorType: specialization,
  }
}

function normalizeAppointment(appointment: any): Appointment {
  const patient = normalizeUserSummary(appointment.patient ?? appointment.user)
  const service = normalizeAppointmentService(appointment.service ?? appointment.dienstleistung)
  const ratingValue = Number(appointment.rating)
  return {
    ...appointment,
    status: typeof appointment.status === 'string' ? appointment.status.toUpperCase() : String(appointment.status ?? ''),
    rating: Number.isFinite(ratingValue) ? ratingValue : null,
    ratingComment: typeof appointment.ratingComment === 'string' && appointment.ratingComment.trim()
      ? appointment.ratingComment.trim()
      : null,
    patient,
    user: patient,
    service,
    dienstleistung: service,
  }
}

function normalizeAvailabilityRule(rule: any): AvailabilityRule {
  return {
    ...rule,
    startTime: typeof rule.startTime === 'string' ? rule.startTime.slice(0, 5) : '09:00',
    endTime: typeof rule.endTime === 'string' ? rule.endTime.slice(0, 5) : '17:00',
  }
}

function matchesSpecialization(doctor: User, doctorTypeFilter?: string) {
  const filter = doctorTypeFilter?.trim().toLowerCase()
  if (!filter) return true

  return (
    String(doctor.specialization?.id ?? doctor.doctorType?.id ?? '').toLowerCase() === filter ||
    (doctor.specialization?.name ?? doctor.doctorType?.name ?? '').toLowerCase() === filter
  )
}

export function formatDoctorName(doctor: Pick<User, 'title' | 'firstName' | 'lastName' | 'name'>) {
  return formatUserName(doctor)
}

export function getDoctorTypeName(doctorType: Specialization | null | undefined) {
  return doctorType?.name || 'Fachrichtung unbekannt'
}

export interface City {
  id: number
  name: string
}

export const useDoctorStore = defineStore('doctors', () => {
  const doctors = ref<User[]>([])
  const doctorTypes = ref<Specialization[]>([])
  const cities = ref<City[]>([])
  const earliestAvailability = ref<Map<number, string | null>>(new Map())

  async function fetchAll(): Promise<User[]> {
    const data = await requestJson<any[]>(`${API_BASE}/doctors`)
    doctors.value = (Array.isArray(data) ? data : []).map(normalizeDoctor)
    return doctors.value
  }

  async function fetchDoctorTypes(): Promise<Specialization[]> {
    const data = await requestJson<Specialization[]>(`${API_BASE}/specializations`)
    doctorTypes.value = Array.isArray(data) ? data : []
    return doctorTypes.value
  }

  async function fetchCities(): Promise<City[]> {
    const data = await requestJson<City[]>(`${API_BASE}/cities`)
    cities.value = Array.isArray(data) ? data : []
    return cities.value
  }

  async function fetchEarliestAvailability(from?: string, to?: string): Promise<Map<number, string | null>> {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    const data = await requestJson<EarliestAvailability[]>(
      `${API_BASE}/doctors/earliest-availability${query ? `?${query}` : ''}`,
    )
    const map = new Map<number, string | null>()
    for (const item of Array.isArray(data) ? data : []) {
      map.set(item.doctorId, item.earliestSlot)
    }
    earliestAvailability.value = map
    return map
  }

  async function search(filters: DoctorSearchFilters): Promise<User[]> {
    const params = new URLSearchParams()
    const name = filters.name?.trim()
    const city = normalizeSelection(filters.city)
    const status = filters.status?.trim()
    const doctorType = normalizeSelection(filters.doctorType)
    const primaryDoctorType = doctorType[0]

    if (name) {
      params.set('firstName', name)
      params.set('lastName', name)
    }
    if (city.length > 0) params.set('city', city.join(','))
    if (status) params.set('status', status)
    if (doctorType.length > 0) params.set('doctorType', doctorType.join(','))
    if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating))
    if (filters.maxDistance !== undefined) params.set('maxDistance', String(filters.maxDistance))

    const query = params.toString()
    const data = await requestJson<any[]>(`${API_BASE}/doctors${query ? `?${query}` : ''}`)
    doctors.value = (Array.isArray(data) ? data : []).map(normalizeDoctor).filter((doctor) => {
      if (!matchesSpecialization(doctor, primaryDoctorType)) return false
      if (filters.minRating && (doctor.rating === null || doctor.rating < filters.minRating)) return false
      if (filters.maxDistance && (doctor.distance === null || doctor.distance > filters.maxDistance)) return false
      return true
    })
    return doctors.value
  }

  async function getById(id: number): Promise<User | null> {
    const res = await fetch(`${API_BASE}/doctors/${id}`)
    if (!res.ok) return null
    return normalizeDoctor(await res.json())
  }

  async function add(doctor: DoctorPayload, token?: string) {
    const payload = {
      ...doctor,
      specialization: doctor.specialization ?? doctor.doctorType ?? null,
    }
    delete (payload as Partial<DoctorPayload>).doctorType
    await requestJson<User>(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    })
  }

  async function update(id: number, data: DoctorPayload, token?: string) {
    const payload = {
      ...data,
      specialization: data.specialization ?? data.doctorType ?? null,
    }
    delete (payload as Partial<DoctorPayload>).doctorType
    await requestJson<User>(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    })
  }

  async function remove(id: number, token?: string) {
    await requestJson<void>(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  }

  async function getAppointments(doctorId: number, token?: string): Promise<Appointment[]> {
    const data = await requestJson<any[]>(`${API_BASE}/appointments/doctor/${doctorId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return (Array.isArray(data) ? data : []).map(normalizeAppointment)
  }

  async function getMyAppointments(token: string): Promise<Appointment[]> {
    const data = await requestJson<any[]>(`${API_BASE}/appointments/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return (Array.isArray(data) ? data : []).map(normalizeAppointment)
  }

  async function getAllAppointments(token: string): Promise<Appointment[]> {
    const data = await requestJson<any[]>(`${API_BASE}/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return (Array.isArray(data) ? data : []).map(normalizeAppointment)
  }

  async function getAvailability(doctorId: number, from: string, to: string): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({ from, to })
    const data = await requestJson<AvailabilitySlot[]>(
      `${API_BASE}/doctors/${doctorId}/availability?${params.toString()}`,
    )
    return Array.isArray(data) ? data : []
  }

  async function getAvailabilityRules(doctorId: number, token?: string): Promise<AvailabilityRule[]> {
    const data = await requestJson<AvailabilityRule[]>(`${API_BASE}/doctors/${doctorId}/availability-rules`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    return (Array.isArray(data) ? data : []).map(normalizeAvailabilityRule)
  }

  async function saveAvailabilityRule(doctorId: number, rule: AvailabilityRule, token: string) {
    const method = rule.id ? 'PUT' : 'POST'
    const url = rule.id
      ? `${API_BASE}/doctors/${doctorId}/availability-rules/${rule.id}`
      : `${API_BASE}/doctors/${doctorId}/availability-rules`

    return await requestJson<AvailabilityRule>(url, {
      method,
      headers: jsonHeaders(token),
      body: JSON.stringify({
        ...rule,
        startTime: rule.startTime.length === 5 ? `${rule.startTime}:00` : rule.startTime,
        endTime: rule.endTime.length === 5 ? `${rule.endTime}:00` : rule.endTime,
      }),
    })
  }

  async function removeAvailabilityRule(doctorId: number, ruleId: number, token: string) {
    await requestJson<void>(`${API_BASE}/doctors/${doctorId}/availability-rules/${ruleId}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    })
  }

  async function bookAppointment(appointment: AppointmentPayload, token: string) {
    return await requestJson<Appointment>(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(appointment),
    })
  }

  async function cancelAppointment(id: number, token: string) {
    return await requestJson<Appointment>(`${API_BASE}/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
    })
  }

  async function rateAppointment(id: number, payload: AppointmentRatingPayload, token: string) {
    return await requestJson<Appointment>(`${API_BASE}/appointments/${id}/rating`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(payload),
    })
  }

  async function deleteAppointment(id: number, token: string) {
    return await requestJson<void>(`${API_BASE}/appointments/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    })
  }

  return {
    doctors,
    doctorTypes,
    cities,
    earliestAvailability,
    fetchAll,
    fetchDoctorTypes,
    fetchCities,
    fetchEarliestAvailability,
    getById,
    add,
    update,
    remove,
    search,
    getAppointments,
    getMyAppointments,
    getAllAppointments,
    getAvailability,
    getAvailabilityRules,
    saveAvailabilityRule,
    removeAvailabilityRule,
    bookAppointment,
    cancelAppointment,
    rateAppointment,
    deleteAppointment,
  }
})
