import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE = 'http://localhost:8080/api'

export interface Doctor {
  id: number
  name: string
  surname: string
  age: number
  doctorType: string
}

export interface Appointment {
  id: number
  patientName: string
  date: string
  description: string
  doctor?: { id: number }
}

export const useDoctorStore = defineStore('doctors', () => {
  const doctors = ref<Doctor[]>([])

  async function fetchAll() {
    const res = await fetch(`${API_BASE}/doctor`)
    doctors.value = await res.json()
  }

  async function search(filters: { name?: string; doctorType?: string }): Promise<Doctor[]> {
    const params = new URLSearchParams()
    if (filters.name) params.set('name', filters.name)
    if (filters.doctorType) params.set('doctorType', filters.doctorType)
    const res = await fetch(`${API_BASE}/doctor?${params.toString()}`)
    const data = await res.json()
    doctors.value = data
    return data
  }

  async function getById(id: number): Promise<Doctor | null> {
    const res = await fetch(`${API_BASE}/doctor/${id}`)
    if (!res.ok) return null
    return await res.json()
  }

  async function add(doctor: Omit<Doctor, 'id'>) {
    await fetch(`${API_BASE}/doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    })
  }

  async function update(id: number, data: Omit<Doctor, 'id'>) {
    await fetch(`${API_BASE}/doctor/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async function remove(id: number) {
    await fetch(`${API_BASE}/doctor/${id}`, { method: 'DELETE' })
  }

  async function getAppointments(doctorId: number): Promise<Appointment[]> {
    const res = await fetch(`${API_BASE}/appointment/doctor/${doctorId}`)
    return await res.json()
  }

  async function addAppointment(appointment: Omit<Appointment, 'id'>) {
    await fetch(`${API_BASE}/appointment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    })
  }

  async function removeAppointment(id: number) {
    await fetch(`${API_BASE}/appointment/${id}`, { method: 'DELETE' })
  }

  return { doctors, fetchAll, getById, add, update, remove, search, getAppointments, addAppointment, removeAppointment }
})
