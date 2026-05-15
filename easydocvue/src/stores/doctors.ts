import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doctors as initialDoctors } from '@/data.js'

export interface Doctor {
  id: number
  name: string
  surname: string
  age: number
  doctorType: string
}

export const useDoctorStore = defineStore('doctors', () => {
  const doctors = ref<Doctor[]>([...initialDoctors])

  function getById(id: number): Doctor | undefined {
    return doctors.value.find((d) => d.id === id)
  }

  function add(doctor: Omit<Doctor, 'id'>) {
    const newId = Math.max(...doctors.value.map((d) => d.id), 0) + 1
    doctors.value.push({ id: newId, ...doctor })
  }

  function update(id: number, data: Omit<Doctor, 'id'>) {
    const index = doctors.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      doctors.value[index] = { id, ...data }
    }
  }

  function remove(id: number) {
    doctors.value = doctors.value.filter((d) => d.id !== id)
  }

  function search(filters: { name?: string; doctorType?: string }): Doctor[] {
    return doctors.value.filter((d) => {
      const matchesName = !filters.name ||
        `${d.name} ${d.surname}`.toLowerCase().includes(filters.name.toLowerCase())
      const matchesType = !filters.doctorType || d.doctorType === filters.doctorType
      return matchesName && matchesType
    })
  }

  return { doctors, getById, add, update, remove, search }
})
