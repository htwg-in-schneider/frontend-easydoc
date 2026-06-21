<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import {
  formatDoctorName,
  getDoctorTypeName,
  useDoctorStore,
  type Doctor,
} from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import { buildGoogleMapsUrl, buildMailtoUrl, buildTelUrl, formatDoctorAddress, toExternalUrl } from '@/utils/doctorContact'
import { formatUserStatusLabel, formatUserTitleLabel } from '@/utils/userFields'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const { getAccessTokenSilently, isAuthenticated } = useAuth0()
const returnTo = computed(() => (typeof route.query.returnTo === 'string' && route.query.returnTo.trim() ? route.query.returnTo : '/doctors'))
const doctor = ref<Doctor | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const { isAdmin } = storeToRefs(profileStore)
const canBook = computed(() => true)
const displayName = computed(() => doctor.value ? formatDoctorName(doctor.value) : '')
const specialtyName = computed(() => getDoctorTypeName(doctor.value?.doctorType ?? doctor.value?.specialization ?? null))
const practiceName = computed(() => doctor.value?.practiceName?.trim() || 'Praxis nicht hinterlegt')
const doctorImage = computed(() => doctor.value?.imageUrl?.trim() || '')
const avatarFallback = computed(() => {
  const source = [doctor.value?.firstName, doctor.value?.lastName, doctor.value?.name]
    .filter(Boolean)
    .join(' ') || doctor.value?.email || 'D'
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
})
const distanceLabel = computed(() => (doctor.value?.distance !== null && doctor.value?.distance !== undefined ? `${doctor.value.distance} km entfernt` : ''))
const ratingLabel = computed(() => (doctor.value?.rating !== null && doctor.value?.rating !== undefined ? doctor.value.rating.toFixed(1) : 'Noch keine Bewertungen'))
const mapsUrl = computed(() => (doctor.value ? buildGoogleMapsUrl(doctor.value) : ''))
const phoneUrl = computed(() => buildTelUrl(doctor.value?.phoneNumber))
const emailUrl = computed(() => buildMailtoUrl(doctor.value?.email))
const websiteUrl = computed(() => toExternalUrl(doctor.value?.website))

function displayValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? 'Nicht hinterlegt' : String(value)
}

onMounted(async () => {
  const rawId = route.params.id
  const id = Number(rawId)

  if (!rawId || Number.isNaN(id)) {
    doctor.value = null
    errorMessage.value = 'Arzt wurde nicht gefunden.'
    isLoading.value = false
    return
  }

  try {
    doctor.value = await doctorStore.getById(id)
    if (!doctor.value) {
      errorMessage.value = 'Arzt wurde nicht gefunden.'
    } else if (isAuthenticated.value) {
      void (async () => {
        const token = await getAccessTokenSilently().catch(() => null)
        if (token) {
          await profileStore.load(token, true).catch(() => null)
        }
      })()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Arzt konnte nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <NavBar />

  <main class="doctor-detail-page">
    <section v-if="isLoading" class="detail-shell detail-shell--state">
      <div class="state-card">
        <p>Arzt wird geladen...</p>
      </div>
    </section>

    <section v-else-if="errorMessage || !doctor" class="detail-shell detail-shell--state">
      <div class="state-card">
        <p>{{ errorMessage || 'Arzt wurde nicht gefunden.' }}</p>
        <router-link class="secondary-button" :to="returnTo">Zurück</router-link>
      </div>
    </section>

    <section v-else class="detail-shell">
      <div class="detail-panel">
        <div class="detail-topline">
          <router-link class="back-link" :to="returnTo">
            <v-icon size="18">mdi-arrow-left</v-icon>
            <span>Zurück zur Übersicht</span>
          </router-link>

          <span v-if="distanceLabel" class="distance-pill">{{ distanceLabel }}</span>
        </div>

        <header class="doctor-hero">
          <div class="doctor-avatar">
            <img v-if="doctorImage" :src="doctorImage" :alt="displayName">
            <span v-else class="doctor-fallback">{{ avatarFallback }}</span>
          </div>

          <div class="doctor-copy">
            <p class="eyebrow">Arztprofil</p>
            <div class="doctor-title-row">
              <h1>{{ displayName }}</h1>
              <span class="role-pill">{{ isAdmin ? 'Admin-Ansicht' : 'Öffentliche Ansicht' }}</span>
            </div>
            <p class="doctor-practice">{{ practiceName }}</p>
            <div class="doctor-meta">
              <span class="specialty-pill">
                <v-icon size="18">mdi-stethoscope</v-icon>
                <span>{{ specialtyName }}</span>
              </span>
              <span v-if="ratingLabel" class="meta-pill">{{ ratingLabel }} ★</span>
            </div>
          </div>
        </header>

        <div class="doctor-grid">
          <section class="detail-card">
            <h2>Kontakt & Adresse</h2>

            <div class="contact-links">
              <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer">
                <v-icon size="18">mdi-map-marker</v-icon>
                <span>{{ formatDoctorAddress(doctor) }}</span>
              </a>
              <a v-if="phoneUrl" :href="phoneUrl">
                <v-icon size="18">mdi-phone</v-icon>
                <span>{{ displayValue(doctor.phoneNumber) }}</span>
              </a>
              <a v-if="emailUrl" :href="emailUrl">
                <v-icon size="18">mdi-email</v-icon>
                <span>{{ displayValue(doctor.email) }}</span>
              </a>
              <a v-if="websiteUrl" :href="websiteUrl" target="_blank" rel="noopener noreferrer">
                <v-icon size="18">mdi-web</v-icon>
                <span>{{ displayValue(doctor.website) }}</span>
              </a>
            </div>

            <dl class="detail-list">
              <div>
                <dt>Status</dt>
                <dd>{{ formatUserStatusLabel(doctor.status) }}</dd>
              </div>
              <div>
                <dt>Praxis</dt>
                <dd>{{ practiceName }}</dd>
              </div>
              <div>
                <dt>Fachrichtung</dt>
                <dd>{{ specialtyName }}</dd>
              </div>
              <div v-if="doctor.consultationFee !== null && doctor.consultationFee !== undefined">
                <dt>Honorar</dt>
                <dd>{{ doctor.consultationFee.toFixed(2) }} €</dd>
              </div>
            </dl>
          </section>

          <section class="detail-card">
            <h2>Grunddaten</h2>
            <dl class="detail-list detail-list--compact">
              <div>
                <dt>Titel</dt>
                <dd>{{ formatUserTitleLabel(doctor.title) }}</dd>
              </div>
              <div>
                <dt>Vorname</dt>
                <dd>{{ displayValue(doctor.firstName) }}</dd>
              </div>
              <div>
                <dt>Nachname</dt>
                <dd>{{ displayValue(doctor.lastName) }}</dd>
              </div>
              <div>
                <dt>Postleitzahl</dt>
                <dd>{{ displayValue(doctor.postcode) }}</dd>
              </div>
              <div>
                <dt>Stadt</dt>
                <dd>{{ displayValue(doctor.city) }}</dd>
              </div>
              <div>
                <dt>Land</dt>
                <dd>{{ displayValue(doctor.country) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <footer class="detail-actions">
          <router-link
            v-if="canBook"
            class="secondary-button"
            :to="{ name: 'booking', params: { id: doctor.id } }"
          >
            Termin buchen
          </router-link>
          <router-link
            v-if="isAdmin"
            class="primary-button"
            :to="{ name: 'doctor-edit', params: { id: doctor.id }, query: { returnTo: route.fullPath } }"
          >
            Bearbeiten
          </router-link>
        </footer>
      </div>
    </section>
  </main>

  <AppFooter />
</template>

<style scoped>
.doctor-detail-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px 60px;
  background:
    radial-gradient(circle at top left, rgba(21, 93, 252, 0.08), transparent 32%),
    linear-gradient(180deg, #f7faff 0%, #eef3fb 100%);
}

.detail-shell {
  width: min(1260px, 100%);
  margin: 0 auto;
}

.detail-shell--state {
  display: grid;
  place-items: center;
  min-height: 420px;
}

.state-card {
  display: grid;
  gap: 14px;
  padding: 28px 32px;
  color: #1f2a44;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  border-radius: 24px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.detail-panel {
  padding: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #d8e3f7;
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.detail-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #155dfc;
  text-decoration: none;
  font-weight: 700;
}

.back-link:hover {
  text-decoration: underline;
}

.distance-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  color: #0f7b5d;
  background: #eafaf2;
  border: 1px solid #caeede;
  border-radius: 999px;
  font-weight: 700;
}

.doctor-hero {
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
  padding-bottom: 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid #e5ecf7;
}

.doctor-avatar {
  width: 156px;
  height: 156px;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(180deg, #eef4ff 0%, #dfeaff 100%);
  border: 2px solid #d8e3f7;
}

.doctor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.doctor-fallback {
  display: inline-flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #155dfc;
  font-size: 50px;
  font-weight: 800;
}

.doctor-copy {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.doctor-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.doctor-title-row h1 {
  margin: 0;
  color: #12213f;
  font-size: clamp(28px, 2.8vw, 44px);
  line-height: 1.04;
}

.role-pill,
.meta-pill,
.specialty-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.role-pill {
  color: #155dfc;
  background: #eaf1ff;
}

.doctor-practice {
  margin: 14px 0 0;
  color: #64708a;
  font-size: 16px;
}

.doctor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.specialty-pill {
  gap: 8px;
  color: #155dfc;
  background: #eef4ff;
  border: 1px solid #d8e3f7;
}

.meta-pill {
  color: #1f2a44;
  background: #f3f6fb;
}

.doctor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.detail-card {
  padding: 20px;
  background: #fff;
  border: 1px solid #e2eaf9;
  border-radius: 22px;
}

.detail-card h2 {
  margin: 0 0 14px;
  color: #1f2a44;
  font-size: 18px;
}

.contact-links {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.contact-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: #155dfc;
  text-decoration: none;
  font-weight: 600;
}

.contact-links a:hover {
  text-decoration: underline;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
  margin: 0;
}

.detail-list--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-list div {
  display: grid;
  gap: 4px;
}

.detail-list dt {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail-list dd {
  margin: 0;
  color: #1f2a44;
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.secondary-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.secondary-button {
  color: #155dfc;
  background: #f0f6fe;
  border: 1px solid #d8e3f7;
}

.primary-button {
  color: #fff;
  background: #155dfc;
  border: 1px solid #155dfc;
}

.secondary-button:hover,
.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(21, 93, 252, 0.12);
}

@media (max-width: 1080px) {
  .doctor-hero,
  .doctor-grid {
    grid-template-columns: 1fr;
  }

  .doctor-avatar {
    width: 138px;
    height: 138px;
  }
}

@media (max-width: 640px) {
  .doctor-detail-page {
    padding: 24px 14px 40px;
  }

  .detail-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .detail-topline,
  .detail-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-list,
  .detail-list--compact {
    grid-template-columns: 1fr;
  }

  .doctor-avatar {
    width: 124px;
    height: 124px;
  }
}
</style>
