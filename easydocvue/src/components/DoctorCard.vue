<script setup lang="ts">
const doctorTypeLabels: Record<string, string> = {
  GENERAL_PRACTITIONER: 'Hausarzt',
  CARDIOLOGIST: 'Kardiologe',
  DERMATOLOGIST: 'Dermatologe',
  ORTHOPEDIST: 'Orthopäde',
  NEUROLOGIST: 'Neurologe',
}

defineProps<{
  doctor: {
    id: number
    name: string
    surname: string
    age: number
    doctorType: string
  }
}>()
</script>

<template>
  <div class="doctor-card">
    <div class="card-icon">
      <v-icon size="48" color="#155dfc">mdi-doctor</v-icon>
    </div>
    <h3>Dr. {{ doctor.name }} {{ doctor.surname }}</h3>
    <p class="doctor-type">{{ doctorTypeLabels[doctor.doctorType] || doctor.doctorType }}</p>
    <p class="doctor-age">Alter: {{ doctor.age }}</p>
    <div class="card-actions">
      <router-link class="btn btn-primary" :to="`/doctor/view/${doctor.id}`">
        Details
      </router-link>
      <router-link class="btn btn-secondary" :to="`/doctor/edit/${doctor.id}`">
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
  margin: 0 0 4px;
}

.doctor-age {
  color: #888;
  margin: 0 0 16px;
  font-size: 14px;
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