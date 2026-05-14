<script setup lang="ts">
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
  <article class="doctor-card">
    <h3>{{ doctor.name }} {{ doctor.surname }}</h3>
    <p>Age: {{ doctor.age }}</p>
    <p>Type: {{ doctor.doctorType }}</p>
  </article>
</template>

<style scoped>
</style>