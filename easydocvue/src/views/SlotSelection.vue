<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // 1. useRouter importieren
import { useAuth0 } from '@auth0/auth0-vue';
import { storeToRefs } from 'pinia';
import { useDoctorStore } from '@/stores/doctors';
import { useProfileStore } from '@/stores/profile';
import NavBar from '@/components/NavBar.vue';
import AppFooter from '@/components/AppFooter.vue';

const router = useRouter(); // 2. Router-Instanz holen
const route = useRoute();
const doctorStore = useDoctorStore();
const profileStore = useProfileStore();
const { profile } = storeToRefs(profileStore);
const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

const doctor = ref(null);
const loading = ref(true);

const selectedDate = ref('Montag, 15. Juni 2026');
const selectedTime = ref('08:00');
const visitReason = ref('Ich habe Bauchschmerzen!');
const dateValueMap = {
  'Montag, 15. Juni 2026': '2026-06-15',
};

const timeSlots = ref([
  '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]);

const doctorTypeName = computed(() => doctor.value?.doctorType?.name || '');

onMounted(async () => {
  const id = Number(route.query.doctorId);
  if (!id) {
    router.push('/doctors');
    return;
  }

  doctor.value = await doctorStore.getById(id);
  loading.value = false;
});

const confirmAppointment = async () => {
  if (!isAuthenticated.value) {
    await loginWithRedirect({ appState: { target: router.currentRoute.value.fullPath } });
    return;
  }

  const token = await getAccessTokenSilently();
  await profileStore.load(token);

  if (!doctor.value || !profile.value?.id) return;

  await doctorStore.addAppointment({
    date: dateValueMap[selectedDate.value] || selectedDate.value,
    time: selectedTime.value,
    price: null,
    doctorId: doctor.value.id,
    userId: profile.value.id,
  });

  // 3. Zur Bestätigungsseite weiterleiten
  router.push('/booking-confirmation');
};
</script>

<template>
  <NavBar />
  <v-container class="my-10">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6">
          <h1 class="text-h5 font-weight-bold mb-1">Termin buchen</h1>
          <p class="text-body-1 mb-6 text-primary">
            {{ loading ? 'Laden...' : `${doctor?.title ?? ''} ${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''} • ${doctorTypeName}` }}
          </p>

          <label class="font-weight-medium">Datum auswählen</label>
          <v-select
            v-model="selectedDate"
            :items="['Montag, 15. Juni 2026']"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-calendar"
            class="mt-2 mb-6"
          ></v-select>

          <label class="font-weight-medium">Uhrzeit auswählen</label>
          <v-row class="mt-2 mb-6">
            <v-col
              v-for="slot in timeSlots"
              :key="slot"
              cols="3"
            >
              <v-btn
                :variant="selectedTime === slot ? 'flat' : 'outlined'"
                :color="selectedTime === slot ? 'primary' : 'grey-darken-1'"
                block
                @click="selectedTime = slot"
              >
                {{ slot }}
              </v-btn>
            </v-col>
          </v-row>

          <label class="font-weight-medium">Grund des Besuchs</label>
          <v-textarea
            v-model="visitReason"
            variant="outlined"
            placeholder="Beschreiben Sie kurz Ihre Symptome"
            rows="3"
            class="mt-2 mb-6"
          ></v-textarea>

          <v-btn
            color="primary"
            block
            size="large"
            @click="confirmAppointment"
            :disabled="loading"
          >
            Termin bestätigen
          </v-btn>
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
label {
  color: #4a4a4a;
}
</style>
