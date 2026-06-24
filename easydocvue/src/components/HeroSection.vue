<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDoctorStore } from '@/stores/doctors'
import { buildDoctorQuery, normalizeSelection } from '@/utils/doctorFilters'
import MultiSelectDropdown from '@/components/MultiSelectDropdown.vue'
import heroImage from '@/assets/images/Dcotor background.png'

const router = useRouter()
const doctorStore = useDoctorStore()
const { doctorTypes, cities } = storeToRefs(doctorStore)

const selectedTypes = ref<string[]>([])
const selectedCities = ref<string[]>([])

const heroStyle = computed(() => ({
  backgroundImage: [
    'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.96) 28%, rgba(255, 255, 255, 0.82) 46%, rgba(255, 255, 255, 0.30) 68%, rgba(255, 255, 255, 0.06) 84%, rgba(255, 255, 255, 0) 100%)',
    `url(${heroImage})`,
  ].join(', '),
}))

onMounted(async () => {
  try {
    await Promise.all([
      doctorTypes.value.length === 0 ? doctorStore.fetchDoctorTypes() : Promise.resolve(),
      cities.value.length === 0 ? doctorStore.fetchCities() : Promise.resolve(),
    ])
  } catch {
    // Die Suchfunktion bleibt auch dann nutzbar, wenn Optionen später geladen werden.
  }
})

function handleFindDoctor() {
  router.push({
    path: '/doctors/map',
    query: buildDoctorQuery({
      doctorType: normalizeSelection(selectedTypes.value),
      city: normalizeSelection(selectedCities.value),
    }),
  })
}
</script>

<template>
  <section class="hero-section" :style="heroStyle">
    <div class="hero-inner">
      <div class="hero-copy">
        <span class="hero-kicker">EasyDoc</span>
        <h1 class="hero-heading">
          <span class="hero-heading-line">Finden Sie den</span>
          <span class="hero-heading-line">
            <span class="hero-heading-accent">passenden Arzt</span>
            <span> in Ihrer Nähe.</span>
          </span>
        </h1>
        <p class="hero-description">
          EasyDoc verbindet Sie mit passenden Fachärzten, klaren Informationen und einer schnellen Terminübersicht.
        </p>
        <p class="hero-subline">
          Einfach, schnell und vertrauenswürdig den richtigen Arzt finden.
        </p>

        <div class="search-card">
          <div class="search-row">
            <MultiSelectDropdown
              v-model="selectedTypes"
              class="search-field"
              variant="hero"
              placeholder="Arzt-Typ auswählen"
              :options="doctorTypes.map((type) => ({ value: type.name, label: type.name }))"
            />

            <MultiSelectDropdown
              v-model="selectedCities"
              class="search-field"
              variant="hero"
              placeholder="Ort auswählen"
              :options="cities.map((city) => ({ value: city.name, label: city.name }))"
            />

            <button type="button" class="find-btn" @click="handleFindDoctor">
              <v-icon size="18">mdi-magnify</v-icon>
              Arzt finden
            </button>
          </div>

          <div class="search-hint-row">
            <span><v-icon size="16">mdi-account-group-outline</v-icon> Über 1.000 Ärzte</span>
            <span><v-icon size="16">mdi-calendar-clock-outline</v-icon> Schnelle Terminvergabe</span>
            <span><v-icon size="16">mdi-shield-check-outline</v-icon> Vertrauenswürdige Bewertungen</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  z-index: 2;
  overflow: visible;
  min-height: 720px;
  padding: 44px 24px 110px;
  background-color: #f7fbff;
  background-position: center right;
  background-size: cover;
  background-repeat: no-repeat;
}

.hero-section::after {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 28%, rgba(255, 255, 255, 0.18) 100%);
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 1440px;
  margin: 0 auto;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 700px;
  padding-top: 18px;
}

.hero-kicker {
  display: inline-flex;
  align-self: flex-start;
  padding: 8px 14px;
  color: #155dfc;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  box-shadow: 0 10px 22px rgba(21, 93, 252, 0.08);
}

.hero-heading {
  margin: 0;
  color: #13213c;
  font-size: clamp(2.7rem, 4.3vw, 5rem);
  line-height: 1.02;
  font-weight: 800;
  letter-spacing: -0.045em;
  max-width: 13.5ch;
}

.hero-heading-line {
  display: block;
}

.hero-heading-accent {
  color: #155dfc;
}

.hero-description {
  max-width: 40rem;
  margin: 0;
  color: #5d6a82;
  font-size: clamp(1.02rem, 1.25vw, 1.16rem);
  line-height: 1.7;
}

.hero-subline {
  max-width: 34rem;
  margin: 0;
  color: #27406d;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.search-card {
  width: min(100%, 900px);
  margin-top: 10px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(216, 227, 247, 0.95);
  border-radius: 30px;
  box-shadow: 0 24px 50px rgba(24, 58, 150, 0.12);
  backdrop-filter: blur(16px);
}

.search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 16px;
  align-items: stretch;
}

.search-field {
  min-width: 0;
  height: 64px;
}

.find-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 210px;
  padding: 0 28px;
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
  border: none;
  border-radius: 16px;
  box-shadow: 0 18px 30px rgba(21, 93, 252, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.find-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 36px rgba(21, 93, 252, 0.28);
}

.search-hint-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 16px;
  padding-top: 14px;
  color: #405069;
  font-size: 14px;
  font-weight: 600;
  border-top: 1px solid rgba(216, 227, 247, 0.72);
}

.search-hint-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.search-hint-row :deep(.v-icon) {
  color: #155dfc;
}

@media (max-width: 1120px) {
  .hero-section {
    min-height: auto;
    padding-bottom: 92px;
    background-position: center center;
  }

  .hero-copy {
    max-width: 760px;
  }
}

@media (max-width: 640px) {
  .hero-section {
    padding: 32px 16px 68px;
  }

  .search-card {
    width: 100%;
  }

  .search-row {
    grid-template-columns: 1fr;
  }

  .find-btn {
    width: 100%;
    min-width: 0;
    height: 54px;
  }

  .search-hint-row {
    gap: 12px 18px;
  }
}
</style>
