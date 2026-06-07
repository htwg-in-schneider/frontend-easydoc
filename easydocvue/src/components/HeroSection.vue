<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import bgImage from '@/assets/images/Background_City.svg'

const router = useRouter()
const isTypeOpen = ref(false)
const selectedType = ref('')
const selectedCity = ref('Konstanz')
const isCityOpen = ref(false)
const typeDropdownRef = ref<HTMLElement | null>(null)
const cityDropdownRef = ref<HTMLElement | null>(null)

const doctorTypes = [
  { label: 'Hausarzt', value: 'Allgemeinmedizin' },
  { label: 'Kardiologe', value: 'Kardiologie' },
  { label: 'Dermatologe', value: 'Dermatologie' },
  { label: 'Orthopäde', value: 'Orthopädie' },
  { label: 'Neurologe', value: 'Neurologie' },
  { label: 'HNO-Arzt', value: 'HNO' },
  { label: 'Augenarzt', value: 'Augenheilkunde' },
  { label: 'Frauenarzt', value: 'Gynäkologie' },
]

const cities = ['Konstanz', 'Radolfzell', 'Singen', 'Überlingen']
const selectedTypeLabel = computed(() =>
  doctorTypes.find((type) => type.value === selectedType.value)?.label || '',
)

function selectType(type: string) {
  selectedType.value = type
  isTypeOpen.value = false
}

function selectCity(city: string) {
  selectedCity.value = city
  isCityOpen.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (!event.target) return
  const target = event.target as Node

  if (typeDropdownRef.value && !typeDropdownRef.value.contains(target)) {
    isTypeOpen.value = false
  }

  if (cityDropdownRef.value && !cityDropdownRef.value.contains(target)) {
    isCityOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

function handleFindDoctor() {
  router.push({
    path: '/doctors/map',
    query: {
      ...(selectedType.value ? { doctorType: selectedType.value } : {}),
      ...(selectedCity.value ? { city: selectedCity.value } : {}),
    },
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
        <div ref="typeDropdownRef" class="search-field custom-select">
          <button type="button" class="select-trigger" @click="isTypeOpen = !isTypeOpen">
            {{ selectedTypeLabel || 'Arzt-Typ auswählen' }}
            <span>⌄</span>
          </button>

          <div v-if="isTypeOpen" class="select-popup">
            <button
              v-for="type in doctorTypes"
              :key="type.value"
              type="button"
              @click="selectType(type.value)"
            >
              {{ type.label }}
            </button>
          </div>
        </div>

        <div ref="cityDropdownRef" class="search-field custom-select">
          <button type="button" class="select-trigger" @click="isCityOpen = !isCityOpen">
            {{ selectedCity }}
            <span>⌄</span>
          </button>

          <div v-if="isCityOpen" class="select-popup">
            <button
              v-for="city in cities"
              :key="city"
              type="button"
              @click="selectCity(city)"
            >
              {{ city }}
            </button>
          </div>
        </div>
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

.search-field {
  height: 55px;
  border-radius: 10px;
  width: 400px;
  max-width: 45%;
  border: 1px solid #d8e3f7;
  padding: 0 16px;
  font-size: 16px;
  color: #1f2a44;
  background: #ffffff;
}

.custom-select {
  position: relative;
  padding: 0;
}

.select-trigger {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #1f2a44;
  font: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.select-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  display: grid;
  width: 100%;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  box-shadow: 0 16px 34px rgba(24, 58, 150, 0.18);
}

.select-popup button {
  padding: 10px 12px;
  color: #26334d;
  font: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.select-popup button:hover {
  color: #155dfc;
  background: #eef3fb;
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
