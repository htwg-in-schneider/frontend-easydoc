<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import AppFooter from '@/components/AppFooter.vue';

const router = useRouter();

// Statische Daten, die normalerweise aus dem Router-State oder einem Store kommen würden
const confirmedAppointment = ref({
  doctorName: 'Dr. Sarah Fischer',
  dateTime: 'Dienstag, 14. April 2026 - 08:00',
});

const goToMyBookings = () => {
  // Annahme: Es gibt eine Seite '/my-bookings' für die Terminübersicht
  router.push('/my-bookings'); 
};

const goToHome = () => {
  router.push('/');
};
</script>

<template>
  <NavBar />
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" md="6" lg="4">
        <v-card class="pa-8 text-center" elevation="2">
          <v-icon
            color="success"
            icon="mdi-check-circle"
            size="64"
            class="mb-4"
          ></v-icon>

          <h1 class="text-h5 font-weight-bold mb-2">Termin erfolgreich gebucht!</h1>
          
          <p class="text-body-1 mb-1">{{ confirmedAppointment.doctorName }}</p>
          <p class="text-body-2 text-medium-emphasis mb-6">{{ confirmedAppointment.dateTime }}</p>

          <v-row>
            <v-col>
              <v-btn
                color="primary"
                block
                size="large"
                @click="goToMyBookings"
              >
                Meine Termine
              </v-btn>
            </v-col>
            <v-col>
              <v-btn
                variant="outlined"
                block
                size="large"
                @click="goToHome"
              >
                Startseite
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <AppFooter />
</template>

<style scoped>
.v-card {
  border-radius: 12px;
}
.fill-height {
  min-height: calc(100vh - 128px); /* 100% viewport height minus navbar/footer approx */
}
</style>
