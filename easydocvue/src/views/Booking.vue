<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router'; // useRouter importieren
import NavBar from '@/components/NavBar.vue'; 
import AppFooter from '@/components/AppFooter.vue'; 

const router = useRouter(); // Router-Instanz holen

// Statische Arzt-Daten für die Anzeige
const doctor = ref({
  id: 1,
  name: 'Dr. med. Eva Musterfrau',
  specialty: 'Kardiologie',
  image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop'
});

// Funktion leitet jetzt zur Slot-Auswahl weiter
const goToSlotSelection = () => {
  router.push('/slot-selection');
};
</script>

<template>
  <NavBar />
  <div class="booking-page">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="text-h4 text-center mb-6">Terminbuchung</h1>
          <v-card>
            <v-row no-gutters>
              <v-col cols="4">
                <v-img
                  :src="doctor.image"
                  height="100%"
                  cover
                  class="rounded-s-lg"
                ></v-img>
              </v-col>
              <v-col cols="8">
                <v-card-title class="text-h5">
                  {{ doctor.name }}
                </v-card-title>
                <v-card-subtitle>
                  {{ doctor.specialty }}
                </v-card-subtitle>
                <v-card-text>
                  Wählen Sie einen Arzt aus, um einen Termin zu vereinbaren.
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="goToSlotSelection">
                    Termin auswählen
                  </v-btn>
                </v-card-actions>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
  <AppFooter />
</template>

<style scoped>
.booking-page {
  padding: 2rem 0;
}
</style>
