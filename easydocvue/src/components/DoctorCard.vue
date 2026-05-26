<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { Doctor } from '@/stores/doctors'
import { formatDoctorName, getDoctorTypeName } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'

const props = defineProps<{
  doctor: Doctor
}>()

const profileStore = useProfileStore()
const { isAdmin } = storeToRefs(profileStore)
const detailRoute = computed(() => ({ name: 'doctor', params: { id: props.doctor.id } }))
const editRoute = computed(() => ({ name: 'doctor-edit', params: { id: props.doctor.id } }))
</script>

<template>
  <div class="doctor-card">
    <div class="card-icon">
      <v-icon size="48" color="#155dfc">mdi-doctor</v-icon>
    </div>
    <h3>{{ formatDoctorName(doctor) }}</h3>
    <p v-if="doctor.practiceName" class="practice-name">{{ doctor.practiceName }}</p>
    <p class="doctor-type">{{ getDoctorTypeName(doctor.doctorType) }}</p>
    <div class="doctor-meta">
      <span v-if="doctor.rating !== null" class="meta-item">
        <v-icon size="16">mdi-star</v-icon>
        {{ doctor.rating }}
      </span>
      <span v-if="doctor.distance !== null" class="meta-item">
        <v-icon size="16">mdi-map-marker-distance</v-icon>
        {{ doctor.distance }} km
      </span>
    </div>
    <div class="card-actions">
      <router-link v-if="doctor.id !== undefined" class="btn btn-primary" :to="detailRoute">
        Details
      </router-link>
      <router-link v-if="isAdmin && doctor.id !== undefined" class="btn btn-secondary" :to="editRoute">
        Bearbeiten
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.doctor-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.doctor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(21, 93, 252, 0.15);
}

.card-icon {
  margin-bottom: 12px;
}

.doctor-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #333;
}

.doctor-type {
  color: #155dfc;
  font-weight: 600;
  margin: 0 0 12px;
}

.practice-name {
  color: #666;
  font-weight: 500;
  margin: 0 0 4px;
  font-size: 14px;
}

.doctor-meta {
  display: flex;
  gap: 12px;
  justify-content: center;
  min-height: 20px;
  margin-bottom: 16px;
  color: #555;
  font-size: 13px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.3s;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  background: #f0f6fe;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dce8fd;
}
</style>
