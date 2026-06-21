<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { formatDoctorName, getDoctorTypeName } from '@/stores/doctors'
import { useSymptomStore } from '@/stores/symptoms'
import { formatDoctorAddress } from '@/utils/doctorContact'

const symptomStore = useSymptomStore()
const { symptoms, analysis, isSymptomsLoading, isAnalyzing, errorMessage } = storeToRefs(symptomStore)
const route = useRoute()
const router = useRouter()

const searchTerm = ref('')
const selectedSymptomIds = ref<number[]>([])
const selectedSpecializationId = ref<number | null>(null)
const hasAnalyzed = ref(false)
const visibleSymptomCount = ref(20)
const isHydratingState = ref(true)
const resultsAnchor = ref<HTMLElement | null>(null)

const filteredSymptoms = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  const list = symptoms.value

  if (!term) {
    return list
  }

  return list.filter((symptom) => {
    const haystack = [symptom.bezeichnung, symptom.beschreibung].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(term)
  })
})

const visibleSymptoms = computed(() => filteredSymptoms.value.slice(0, visibleSymptomCount.value))

const hasMoreSymptoms = computed(() => visibleSymptoms.value.length < filteredSymptoms.value.length)

const selectedSymptoms = computed(() =>
  symptoms.value.filter((symptom) => selectedSymptomIds.value.includes(symptom.id)),
)

const resultSpecializations = computed(() => analysis.value?.specializations ?? [])
const selectedSpecialization = computed(() =>
  resultSpecializations.value.find((item) => item.specialization?.id === selectedSpecializationId.value) ?? null,
)
const resultDoctors = computed(() => {
  const doctors = analysis.value?.doctors ?? []

  if (!selectedSpecializationId.value) {
    return doctors
  }

  return doctors.filter((item) => item.doctor.specialization?.id === selectedSpecializationId.value)
})
const hasAnyResults = computed(() => resultSpecializations.value.length > 0 || resultDoctors.value.length > 0)

const analysisPrompt = computed(() => {
  if (isAnalyzing.value) {
    return 'Analyse läuft…'
  }

  if (errorMessage.value) {
    return errorMessage.value
  }

  if (selectedSymptomIds.value.length === 0) {
    return 'Bitte wählen Sie mindestens ein Symptom aus.'
  }

  if (!hasAnalyzed.value) {
    return 'Klicken Sie auf „Symptome analysieren“, um passende Fachrichtungen zu sehen.'
  }

  if (!hasAnyResults.value) {
    return 'Keine passenden Ärzte gefunden.'
  }

  return ''
})

const analysisSummary = computed(() => {
  if (!analysis.value) {
    return null
  }

  return {
    specializations: analysis.value.specializations.length,
    doctors: resultDoctors.value.length,
  }
})

function isSelected(symptomId: number) {
  return selectedSymptomIds.value.includes(symptomId)
}

function invalidateAnalysis() {
  hasAnalyzed.value = false
  selectedSpecializationId.value = null
  symptomStore.clearAnalysis()
}

function parseSymptomIdsFromQuery(input: unknown): number[] {
  const raw = Array.isArray(input) ? input.join(',') : typeof input === 'string' ? input : ''
  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
}

function queryStateMatches() {
  const expectedIds = selectedSymptomIds.value.join(',')
  const queryIds = Array.isArray(route.query.symptoms) ? route.query.symptoms.join(',') : route.query.symptoms ?? ''
  const querySearch = Array.isArray(route.query.q) ? route.query.q.join(',') : route.query.q ?? ''
  const querySpecialization = Array.isArray(route.query.specialization)
    ? route.query.specialization[0]
    : route.query.specialization ?? ''
  const queryAnalyzed = Array.isArray(route.query.analyzed) ? route.query.analyzed[0] : route.query.analyzed ?? ''
  const expectedHash = hasAnalyzed.value && selectedSymptomIds.value.length > 0 ? '#results' : ''

  return (
    queryIds === expectedIds &&
    querySearch === searchTerm.value.trim() &&
    querySpecialization === (selectedSpecializationId.value !== null ? String(selectedSpecializationId.value) : '') &&
    queryAnalyzed === (hasAnalyzed.value && selectedSymptomIds.value.length > 0 ? '1' : '') &&
    route.hash === expectedHash
  )
}

async function syncRouteState() {
  if (isHydratingState.value || queryStateMatches()) {
    return
  }

  const nextQuery: Record<string, string> = {}
  if (selectedSymptomIds.value.length > 0) {
    nextQuery.symptoms = selectedSymptomIds.value.join(',')
  }

  const trimmedSearch = searchTerm.value.trim()
  if (trimmedSearch) {
    nextQuery.q = trimmedSearch
  }

  if (selectedSpecializationId.value !== null) {
    nextQuery.specialization = String(selectedSpecializationId.value)
  }

  if (hasAnalyzed.value && selectedSymptomIds.value.length > 0) {
    nextQuery.analyzed = '1'
  }

  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: hasAnalyzed.value && selectedSymptomIds.value.length > 0 ? '#results' : '',
  })
}

function toggleSymptom(symptomId: number) {
  const nextIds = [...selectedSymptomIds.value]
  const index = nextIds.indexOf(symptomId)

  if (index >= 0) {
    nextIds.splice(index, 1)
  } else {
    nextIds.push(symptomId)
  }

  selectedSymptomIds.value = nextIds
  invalidateAnalysis()
}

function removeSymptom(symptomId: number) {
  selectedSymptomIds.value = selectedSymptomIds.value.filter((id) => id !== symptomId)
  invalidateAnalysis()
}

function resetSelection() {
  selectedSymptomIds.value = []
  invalidateAnalysis()
  visibleSymptomCount.value = 20
}

async function handleAnalyze() {
  if (selectedSymptomIds.value.length === 0) {
    return
  }

  hasAnalyzed.value = true
  try {
    await symptomStore.analyzeSymptoms(selectedSymptomIds.value)
    await syncRouteState()
    await scrollToResults()
  } catch {
    // Error state is shown via the store; no automatic scroll on failed analysis.
  }
}

function loadMoreSymptoms() {
  visibleSymptomCount.value += 20
}

function isSpecializationSelected(specializationId?: number | null) {
  return specializationId !== null && specializationId !== undefined && selectedSpecializationId.value === specializationId
}

async function selectSpecialization(specializationId?: number | null) {
  selectedSpecializationId.value =
    specializationId !== null && specializationId !== undefined && selectedSpecializationId.value === specializationId
      ? null
      : specializationId ?? null
  await syncRouteState()
}

async function scrollToResults() {
  await nextTick()
  resultsAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatSlot(iso: string | null) {
  if (!iso) return 'Kein freier Termin'
  return new Date(iso).toLocaleString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRating(rating: number | null | undefined) {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return 'Noch keine Bewertungen'
  }
  return `${Number(rating).toFixed(1)} ★`
}

function formatAddress(doctor: { street?: string | null; postcode?: string | null; city?: string | null; country?: string | null }) {
  const address = formatDoctorAddress({
    street: doctor.street ?? null,
    postcode: doctor.postcode ?? null,
    city: doctor.city ?? null,
    country: doctor.country ?? null,
  })
  return address || 'Adresse nicht hinterlegt'
}

watch([selectedSymptomIds, searchTerm, hasAnalyzed, selectedSpecializationId], () => {
  void syncRouteState()
})

watch(selectedSymptomIds, () => {
  if (selectedSymptomIds.value.length === 0) {
    invalidateAnalysis()
  }
})

onMounted(async () => {
  selectedSymptomIds.value = parseSymptomIdsFromQuery(route.query.symptoms)
  searchTerm.value = Array.isArray(route.query.q) ? route.query.q.join(',') : typeof route.query.q === 'string' ? route.query.q : ''
  selectedSpecializationId.value = (() => {
    const raw = Array.isArray(route.query.specialization)
      ? route.query.specialization[0]
      : route.query.specialization ?? ''
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  })()
  hasAnalyzed.value = route.query.analyzed === '1' && selectedSymptomIds.value.length > 0
  visibleSymptomCount.value = 20
  symptomStore.clearAnalysis()
  await symptomStore.fetchSymptoms()
  isHydratingState.value = false

  if (hasAnalyzed.value && selectedSymptomIds.value.length > 0) {
    await symptomStore.analyzeSymptoms(selectedSymptomIds.value)
  }

  if (route.hash === '#results' || hasAnalyzed.value) {
    await scrollToResults()
  }
})
</script>

<template>
  <NavBar />

  <main class="symptom-page">
    <section class="symptom-hero">
      <div class="hero-icon">
        <v-icon size="34">mdi-heart-pulse</v-icon>
      </div>

      <div class="hero-copy">
        <h1>Wählen Sie Ihre Symptome aus und erhalten Sie passende Fachrichtungen und Ärzte.</h1>
        <p>
          EasyDoc zeigt Ihnen auf Basis Ihrer Auswahl mögliche Fachrichtungen und passende Ärztinnen und Ärzte.
        </p>
      </div>

      <div class="hero-note">
        <v-icon size="20">mdi-information-outline</v-icon>
        <span>Diese Analyse ersetzt keine ärztliche Diagnose. Bei akuten Beschwerden oder Notfällen wenden Sie sich bitte an den Notruf 112.</span>
      </div>
    </section>

    <section class="analysis-layout">
      <div class="selection-card">
        <div class="card-head">
          <div class="card-title-block">
            <span class="step-badge">1</span>
            <div>
              <h2>Symptome auswählen</h2>
              <p>Mehrfachauswahl möglich. Filtern Sie die Liste mit der Suche.</p>
            </div>
          </div>

          <label class="search-box">
            <v-icon size="18">mdi-magnify</v-icon>
            <input v-model="searchTerm" type="search" placeholder="Symptome suchen..." />
          </label>
        </div>

        <div v-if="isSymptomsLoading" class="state-box">
          Symptome werden geladen…
        </div>

        <template v-else>
          <template v-if="visibleSymptoms.length > 0">
            <div class="chip-grid">
              <button
                v-for="symptom in visibleSymptoms"
                :key="symptom.id"
                type="button"
                class="symptom-chip"
                :class="{ 'symptom-chip--active': isSelected(symptom.id) }"
                :aria-pressed="isSelected(symptom.id)"
                @click="toggleSymptom(symptom.id)"
              >
                <v-icon v-if="isSelected(symptom.id)" size="16">mdi-check</v-icon>
                <span>{{ symptom.bezeichnung }}</span>
              </button>
            </div>

            <div v-if="hasMoreSymptoms" class="load-more-row">
              <button type="button" class="load-more-btn" @click="loadMoreSymptoms">
                Weitere Symptome laden
              </button>
            </div>
          </template>

          <div v-else class="state-box state-box--soft">
            Keine Symptome gefunden.
          </div>
        </template>

        <div class="selection-footer">
          <div class="selected-wrap">
            <div class="selected-label-row">
              <span class="selected-label">Ausgewählt ({{ selectedSymptoms.length }})</span>
              <button v-if="selectedSymptoms.length > 0" type="button" class="clear-link" @click="resetSelection">
                Auswahl löschen
              </button>
            </div>

            <div class="selected-chips">
              <button
                v-for="symptom in selectedSymptoms"
                :key="symptom.id"
                type="button"
                class="selected-chip"
                @click="removeSymptom(symptom.id)"
              >
                <span>{{ symptom.bezeichnung }}</span>
                <v-icon size="16">mdi-close</v-icon>
              </button>

              <span v-if="selectedSymptoms.length === 0" class="selected-empty">
                Bitte wählen Sie mindestens ein Symptom aus.
              </span>
            </div>
          </div>

          <button type="button" class="analyze-btn" :disabled="selectedSymptomIds.length === 0 || isAnalyzing" @click="handleAnalyze">
            <v-icon size="18">mdi-magnify-scan</v-icon>
            Symptome analysieren
          </button>
        </div>
      </div>

      <div class="results-card">
        <div class="card-head card-head--results">
          <div class="card-title-block">
            <span class="step-badge step-badge--green">2</span>
            <div>
              <h2>Ihre Ergebnisse</h2>
              <p>Basierend auf Ihren Symptomen empfehlen wir passende Fachrichtungen und Ärzte.</p>
            </div>
          </div>

        <div v-if="analysisSummary" class="result-summary">
            <strong>{{ analysisSummary.specializations }} Fachrichtungen</strong>
            <span>{{ analysisSummary.doctors }} Ärzte gefunden</span>
          </div>
        </div>

        <div v-if="analysisPrompt" class="state-box" :class="{ 'state-box--error': Boolean(errorMessage) }">
          {{ analysisPrompt }}
        </div>

        <template v-else>
          <section ref="resultsAnchor" id="results" class="result-group">
            <div class="section-head">
              <v-icon size="18">mdi-shield-search</v-icon>
              <h3>Passende Fachrichtungen</h3>
            </div>

            <div class="specialization-grid">
              <article
                v-for="item in resultSpecializations"
                :key="item.specialization?.id ?? item.specialization?.name ?? item.score"
                class="specialization-card"
                :class="{ 'specialization-card--active': isSpecializationSelected(item.specialization?.id ?? null) }"
                role="button"
                tabindex="0"
                @click="selectSpecialization(item.specialization?.id ?? null)"
                @keydown.enter.prevent="selectSpecialization(item.specialization?.id ?? null)"
                @keydown.space.prevent="selectSpecialization(item.specialization?.id ?? null)"
              >
                <div class="specialization-card__top">
                  <div>
                    <h4>{{ item.specialization?.name || 'Fachrichtung' }}</h4>
                    <p>{{ item.matchCount }} Symptom{{ item.matchCount === 1 ? '' : 'e' }} zugeordnet</p>
                  </div>
                  <span class="specialization-score">{{ item.relevancePercent }}%</span>
                </div>

                <div class="specialization-bar" aria-hidden="true">
                  <span :style="{ width: `${item.relevancePercent}%` }" />
                </div>

                <div class="symptom-tags">
                  <span v-for="symptom in item.matchedSymptoms" :key="symptom" class="tiny-tag">
                    {{ symptom }}
                  </span>
                </div>
              </article>
            </div>
          </section>

          <section class="result-group">
            <div class="section-head">
              <v-icon size="18">mdi-doctor</v-icon>
              <h3>Empfohlene Ärzte</h3>
            </div>

            <div v-if="selectedSpecialization" class="doctor-filter-note">
              <span>Gefiltert nach {{ selectedSpecialization.specialization?.name }}</span>
              <button type="button" class="clear-link" @click="selectSpecialization(null)">Alle Ärzte anzeigen</button>
            </div>

            <div v-if="resultDoctors.length > 0" class="doctor-list">
              <article
                v-for="item in resultDoctors"
                :key="item.doctor.id"
                class="doctor-card"
              >
                <div class="doctor-card__main">
                  <div class="doctor-avatar">
                    <v-icon size="30">mdi-doctor</v-icon>
                  </div>

                  <div class="doctor-copy">
                    <div class="doctor-title-row">
                      <h4>{{ formatDoctorName(item.doctor) }}</h4>
                      <span class="doctor-score">{{ item.relevancePercent }}%</span>
                    </div>

                    <p class="doctor-specialty">
                      {{ getDoctorTypeName(item.doctor.specialization ?? item.doctor.doctorType ?? null) }}
                    </p>

                    <div class="doctor-meta">
                      <span v-if="item.doctor.rating !== null && item.doctor.rating !== undefined" class="meta-pill meta-pill--rating">
                        {{ formatRating(item.doctor.rating) }}
                      </span>
                      <span v-if="item.doctor.city" class="meta-pill">
                        <v-icon size="14">mdi-map-marker</v-icon>
                        {{ item.doctor.city }}
                      </span>
                      <span class="meta-pill meta-pill--soft">
                        <v-icon size="14">mdi-map-marker-distance</v-icon>
                        {{ item.doctor.distance !== null && item.doctor.distance !== undefined ? `${item.doctor.distance} km` : 'Distanz nicht hinterlegt' }}
                      </span>
                    </div>

                    <div v-if="item.matchedSymptoms.length > 0" class="symptom-tags symptom-tags--compact">
                      <span v-for="symptom in item.matchedSymptoms" :key="symptom" class="tiny-tag tiny-tag--soft">
                        {{ symptom }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="doctor-card__aside">
                  <div class="aside-info">
                    <span class="aside-label">Nächster Termin</span>
                    <strong>{{ formatSlot(item.nextAvailableSlot) }}</strong>
                  </div>

                  <div class="aside-info">
                    <span class="aside-label">Adresse</span>
                    <strong>{{ formatAddress(item.doctor) }}</strong>
                  </div>

                  <div class="doctor-actions">
                    <router-link
                      class="secondary-action"
                      :to="{ name: 'doctor', params: { id: item.doctor.id }, query: { returnTo: route.fullPath, scrollTo: 'top' } }"
                    >
                      Profil anzeigen
                    </router-link>
                    <router-link
                      class="primary-action"
                      :to="{ name: 'booking', params: { id: item.doctor.id }, query: { returnTo: route.fullPath, scrollTo: 'top' } }"
                    >
                      Termin buchen
                    </router-link>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="state-box state-box--soft">
              {{ selectedSpecialization ? 'Keine Ärzte für diese Fachrichtung gefunden.' : 'Keine passenden Ärzte gefunden.' }}
            </div>
          </section>
        </template>

        <div class="disclaimer-box">
          <v-icon size="18">mdi-alert-circle-outline</v-icon>
          <p>{{ analysis?.disclaimer || 'Diese Analyse ersetzt keine ärztliche Diagnose.' }}</p>
        </div>
      </div>
    </section>
  </main>

  <AppFooter />
</template>

<style scoped>
.symptom-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 26px 20px 72px;
  background:
    radial-gradient(circle at top left, rgba(21, 93, 252, 0.08), transparent 30%),
    linear-gradient(180deg, #f7faff 0%, #eef3fb 100%);
}

.symptom-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px 22px;
  align-items: center;
  width: min(1320px, 100%);
  margin: 0 auto 12px;
}

.hero-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  color: #155dfc;
  background: rgba(21, 93, 252, 0.08);
  border-radius: 22px;
  box-shadow: 0 14px 28px rgba(21, 93, 252, 0.08);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-copy h1 {
  margin: 0;
  color: #13213c;
  font-size: clamp(1.45rem, 2vw, 2.2rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.04em;
  max-width: 28ch;
}

.hero-copy p {
  max-width: 62rem;
  margin: 0;
  color: #5d6a82;
  font-size: 15px;
  line-height: 1.65;
}

.hero-note {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px 16px;
  color: #35517b;
  font-size: 14px;
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(216, 227, 247, 0.8);
  border-radius: 18px;
  box-shadow: 0 16px 32px rgba(24, 58, 150, 0.06);
}

.analysis-layout {
  display: grid;
  gap: 22px;
  width: min(1320px, 100%);
  margin: 0 auto;
}

.selection-card,
.results-card {
  padding: 26px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(216, 227, 247, 0.92);
  border-radius: 28px;
  box-shadow: 0 20px 46px rgba(24, 58, 150, 0.08);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-title-block {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.card-title-block h2 {
  margin: 0;
  color: #13213c;
  font-size: 22px;
  line-height: 1.2;
}

.card-title-block p {
  margin: 6px 0 0;
  color: #5d6a82;
  font-size: 15px;
  line-height: 1.55;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
  border-radius: 999px;
  box-shadow: 0 12px 24px rgba(21, 93, 252, 0.22);
}

.step-badge--green {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
}

.search-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: min(320px, 100%);
  padding: 0 16px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
}

.search-box input {
  width: 100%;
  height: 50px;
  border: 0;
  outline: none;
  font: inherit;
  color: #1f2a44;
  background: transparent;
}

.chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  color: #155dfc;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  background: #f0f6fe;
  border: 1px solid rgba(21, 93, 252, 0.14);
  border-radius: 14px;
  cursor: pointer;
}

.load-more-btn:hover {
  background: #e8f1ff;
}

.symptom-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 16px;
  color: #26334d;
  font: inherit;
  font-weight: 600;
  text-align: center;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 16px;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.06);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.symptom-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(21, 93, 252, 0.35);
}

.symptom-chip--active {
  color: #155dfc;
  background: rgba(21, 93, 252, 0.08);
  border-color: rgba(21, 93, 252, 0.4);
}

.selection-footer {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(216, 227, 247, 0.7);
}

.selected-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.selected-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.selected-label {
  color: #405069;
  font-size: 14px;
  font-weight: 700;
}

.clear-link {
  padding: 0;
  color: #155dfc;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #155dfc;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  background: #f0f6fe;
  border: 1px solid rgba(21, 93, 252, 0.18);
  border-radius: 999px;
  cursor: pointer;
}

.selected-empty {
  color: #7a8699;
  font-size: 14px;
}

.analyze-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 240px;
  min-height: 54px;
  padding: 0 22px;
  color: #ffffff;
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
  border: 0;
  border-radius: 16px;
  box-shadow: 0 18px 32px rgba(21, 93, 252, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 38px rgba(21, 93, 252, 0.28);
}

.analyze-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 92px;
  padding: 18px 20px;
  color: #1f2a44;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  background: #f8fbff;
  border: 1px solid rgba(216, 227, 247, 0.9);
  border-radius: 18px;
}

.state-box--soft {
  color: #5d6a82;
  background: rgba(21, 93, 252, 0.04);
}

.state-box--error {
  color: #b42318;
  background: rgba(254, 242, 242, 0.9);
  border-color: rgba(248, 180, 180, 0.9);
}

.result-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.card-head--results {
  margin-bottom: 18px;
}

.result-summary {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  color: #1f2a44;
  background: rgba(21, 93, 252, 0.06);
  border: 1px solid rgba(21, 93, 252, 0.12);
  border-radius: 16px;
}

.result-summary strong {
  font-size: 15px;
}

.result-summary span {
  color: #5d6a82;
  font-size: 13px;
}

.result-group + .result-group {
  margin-top: 26px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  color: #1f2a44;
}

.section-head h3 {
  margin: 0;
  font-size: 18px;
}

.specialization-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.specialization-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid rgba(216, 227, 247, 0.92);
  border-radius: 20px;
  box-shadow: 0 14px 30px rgba(24, 58, 150, 0.06);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.specialization-card:hover {
  transform: translateY(-1px);
  border-color: rgba(21, 93, 252, 0.3);
}

.specialization-card--active {
  background: linear-gradient(180deg, rgba(21, 93, 252, 0.05), rgba(21, 93, 252, 0.02));
  border-color: rgba(21, 93, 252, 0.42);
  box-shadow: 0 16px 34px rgba(21, 93, 252, 0.12);
}

.specialization-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.specialization-card__top h4 {
  margin: 0;
  color: #1f2a44;
  font-size: 17px;
}

.specialization-card__top p {
  margin: 6px 0 0;
  color: #66758d;
  font-size: 13px;
}

.specialization-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 8px 10px;
  color: #155dfc;
  font-size: 13px;
  font-weight: 800;
  background: #eef4ff;
  border-radius: 999px;
}

.specialization-card--active .specialization-score {
  color: #ffffff;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
}

.specialization-bar {
  overflow: hidden;
  height: 10px;
  background: #edf2fb;
  border-radius: 999px;
}

.specialization-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-radius: inherit;
}

.symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.symptom-tags--compact {
  margin-top: 2px;
}

.tiny-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  color: #155dfc;
  font-size: 12px;
  font-weight: 700;
  background: #eef4ff;
  border-radius: 999px;
}

.tiny-tag--soft {
  color: #35517b;
  background: #f5f8fd;
}

.doctor-list {
  display: grid;
  gap: 14px;
}

.doctor-filter-note {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin: 0 0 14px;
  padding: 12px 14px;
  color: #35517b;
  background: rgba(21, 93, 252, 0.06);
  border: 1px solid rgba(21, 93, 252, 0.12);
  border-radius: 16px;
}

.doctor-filter-note span {
  font-size: 14px;
  font-weight: 600;
}

.doctor-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 18px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid rgba(216, 227, 247, 0.92);
  border-radius: 22px;
  box-shadow: 0 16px 34px rgba(24, 58, 150, 0.07);
}

.doctor-card__main {
  display: flex;
  gap: 16px;
  min-width: 0;
}

.doctor-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  flex: 0 0 auto;
  color: #155dfc;
  background: #eef4ff;
  border-radius: 22px;
}

.doctor-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.doctor-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.doctor-title-row h4 {
  margin: 0;
  color: #13213c;
  font-size: 18px;
}

.doctor-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  padding: 8px 10px;
  color: #16a34a;
  font-size: 12px;
  font-weight: 800;
  background: rgba(22, 163, 74, 0.1);
  border-radius: 999px;
}

.doctor-specialty {
  margin: 6px 0 12px;
  color: #5d6a82;
  font-size: 14px;
  font-weight: 600;
}

.doctor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  color: #35517b;
  font-size: 12px;
  font-weight: 700;
  background: #f4f8fe;
  border-radius: 999px;
}

.meta-pill--soft {
  color: #66758d;
  background: #f8fbff;
}

.meta-pill--rating {
  color: #155dfc;
  background: #eef4ff;
}

.doctor-card__aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 18px;
  border-left: 1px solid rgba(216, 227, 247, 0.8);
}

.aside-info {
  display: grid;
  gap: 6px;
}

.aside-label {
  color: #66758d;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.aside-info strong {
  color: #1f2a44;
  font-size: 14px;
  line-height: 1.45;
}

.doctor-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.primary-action,
.secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 16px;
  border-radius: 14px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}

.primary-action {
  color: #ffffff;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
  box-shadow: 0 14px 28px rgba(21, 93, 252, 0.22);
}

.secondary-action {
  color: #155dfc;
  background: #f0f6fe;
  border: 1px solid rgba(21, 93, 252, 0.14);
}

.disclaimer-box {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 22px;
  padding: 14px 16px;
  color: #35517b;
  font-size: 14px;
  line-height: 1.6;
  background: rgba(21, 93, 252, 0.06);
  border: 1px solid rgba(21, 93, 252, 0.12);
  border-radius: 18px;
}

.disclaimer-box p {
  margin: 0;
}

@media (max-width: 1100px) {
  .specialization-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .doctor-card {
    grid-template-columns: 1fr;
  }

  .doctor-card__aside {
    padding-left: 0;
    padding-top: 16px;
    border-left: 0;
    border-top: 1px solid rgba(216, 227, 247, 0.8);
  }
}

@media (max-width: 820px) {
  .symptom-page {
    padding: 28px 14px 64px;
  }

  .symptom-hero {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 22px;
  }

  .hero-copy h1 {
    max-width: none;
  }

  .selection-card,
  .results-card {
    padding: 18px;
    border-radius: 24px;
  }

  .card-head,
  .selection-footer,
  .result-head,
  .card-head--results {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box,
  .analyze-btn {
    width: 100%;
    min-width: 0;
  }

  .specialization-grid {
    grid-template-columns: 1fr;
  }

  .doctor-title-row {
    flex-direction: column;
  }

  .doctor-filter-note {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
