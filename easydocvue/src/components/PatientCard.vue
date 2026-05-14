<script setup lang="ts">
defineProps<{
  patient: {
    id: number
    name: string
    surname: string
    age: number
    insurance: string
  }
}>()
</script>

<template>
  <article class="patient-card">
    <h3>{{ patient.name }} {{ patient.surname }}</h3>
    <p>Age: {{ patient.age }}</p>
    <p>Insurance: {{ patient.insurance }}</p>
  </article>
</template>

<style scoped>
</style>