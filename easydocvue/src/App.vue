<script setup lang="ts">
import { doctors, patients } from './data.js'
import DoctorCard from '@/components/DoctorCard.vue'
import PatientCard from '@/components/PatientCard.vue'
</script>

<template>
  <v-app>
    <v-main>
      <v-container class="py-8">
        <section class="mb-10">
          <div class="text-center mb-6">
            <h2 class="text-h4 font-weight-bold">Patients</h2>
            <p class="text-body-1 text-medium-emphasis">
              Overview of all registered patients.
            </p>
          </div>

          <v-row dense>
            <v-col
              v-for="patient in patients"
              :key="patient.id"
              cols="12"
              md="4"
            >
              <PatientCard :patient="patient" />
            </v-col>
          </v-row>
        </section>

        <section>
          <div class="text-center mb-6">
            <h2 class="text-h4 font-weight-bold">Doctors</h2>
            <p class="text-body-1 text-medium-emphasis">
              Overview of all registered doctors.
            </p>
          </div>

          <v-row dense>
            <v-col
              v-for="doctor in doctors"
              :key="doctor.id"
              cols="12"
              md="4"
            >
              <DoctorCard :doctor="doctor" />
            </v-col>
          </v-row>
        </section>
      </v-container>
    </v-main>

    <v-btn
      class="ma-2"
      icon="mdi-theme-light-dark"
      location="top right"
      position="absolute"
      @click="$vuetify.theme.cycle()"
    />
  </v-app>
</template>
