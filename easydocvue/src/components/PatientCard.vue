<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  patient: {
    id: number
    name: string
    surname: string
    birthday?: string | null
    insurance: string
  }
}>()

function calculateAge(birthday?: string | null) {
  if (!birthday) return null
  const date = new Date(`${birthday}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1
  }
  return age
}

const age = computed(() => calculateAge(props.patient.birthday))
</script>

<template>
  <article class="patient-card">
    <h3>{{ patient.name }} {{ patient.surname }}</h3>
    <p>Age: {{ age ?? 'Nicht hinterlegt' }}</p>
    <p>Insurance: {{ patient.insurance }}</p>
  </article>
</template>

<style scoped>
</style>
