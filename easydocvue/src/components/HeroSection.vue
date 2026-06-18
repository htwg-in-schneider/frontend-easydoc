<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDoctorStore } from '@/stores/doctors'
import { buildDoctorQuery, normalizeSelection } from '@/utils/doctorFilters'
import MultiSelectDropdown from '@/components/MultiSelectDropdown.vue'
import bgImage from '@/assets/images/Background_City.svg'

const router = useRouter()
const doctorStore = useDoctorStore()
const { doctorTypes, cities } = storeToRefs(doctorStore)

const selectedTypes = ref<string[]>([])
const selectedCities = ref<string[]>([])

onMounted(async () => {
  try {
    await Promise.all([
      doctorTypes.value.length === 0 ? doctorStore.fetchDoctorTypes() : Promise.resolve(),
      cities.value.length === 0 ? doctorStore.fetchCities() : Promise.resolve(),
    ])
  } catch {
    // Fallback: keine Auswahl vorbelegt
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
  <div class="background-img" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="hero-copy">
      <span class="hero-kicker">EasyDoc</span>
      <h1 class="hero-heading">Finden Sie den passenden Arzt in Ihrer Nähe.</h1>
    </div>

    <div class="arzt-finden-box">
      <div class="suchfelder">
        <MultiSelectDropdown
          v-model="selectedTypes"
          class="search-field"
          variant="hero"
          placeholder="Arzt-Typ auswählen"
          :options="doctorTypes.map((type) => ({ value: type.name, label: type.name }))"
          style="width: min(100%, 400px); height: 55px;"
        />

        <MultiSelectDropdown
          v-model="selectedCities"
          class="search-field"
          variant="hero"
          placeholder="Ort auswählen"
          :options="cities.map((city) => ({ value: city.name, label: city.name }))"
          style="width: min(100%, 400px); height: 55px;"
        />
      </div>

      <div class="arzt-finden">
        <button @click="handleFindDoctor" class="btn-find-doctor">Arzt finden</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.background-img {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-img::before {
  position: absolute;
  inset: 0;
  content: '';
  background: rgba(11, 31, 74, 0.28);
}

.hero-copy {
  position: relative;
  z-index: 2;
  width: min(900px, 90%);
  margin: 0 auto;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.hero-kicker {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-heading {
  margin: 0;
  font-size: 40px;
  line-height: 1.2;
  font-weight: 800;
  white-space: nowrap;
  transition: transform 0.3s ease;
}

.hero-heading:hover {
  transform: scale(1.05);
}

.hero-copy p {
  margin: 16px 0 0;
  font-size: 19px;
  font-weight: 600;
}

.arzt-finden-box {
  position: relative;
  z-index: 2;
  width: 1000px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 22px;
  margin: 40px auto 0;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(216, 227, 247, 0.9);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(24, 58, 150, 0.24);
}

.suchfelder {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.btn-find-doctor {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 810px;
  max-width: 90vw;
  height: 58px;
  padding: 0 28px;
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  background: #155dfc;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-find-doctor:hover {
  background: #0f4ad4;
}

@media (max-width: 1024px) {
  .hero-heading {
    font-size: 42px;
  }
}

@media (max-width: 768px) {
  .hero-heading {
    font-size: 28px;
    white-space: normal;
    line-height: 1.3;
  }

  .hero-copy {
    margin-bottom: 20px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .suchfelder {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .search-field {
    width: 100%;
    max-width: 100%;
  }

  .btn-find-doctor {
    width: 100%;
    font-size: 18px;
    height: 50px;
  }

  .arzt-finden-box {
    gap: 12px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .hero-heading {
    font-size: 24px;
  }

  .hero-kicker {
    font-size: 12px;
  }

  .hero-copy p {
    font-size: 14px;
  }

  .select-trigger {
    font-size: 14px;
  }

  .btn-find-doctor {
    font-size: 16px;
    height: 45px;
  }
}
</style>
