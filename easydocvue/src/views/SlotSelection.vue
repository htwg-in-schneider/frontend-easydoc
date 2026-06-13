<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { formatDoctorName, getDoctorTypeName, type AvailabilitySlot, type Doctor, useDoctorStore } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const route = useRoute()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { profile } = storeToRefs(profileStore)
const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0()

const doctor = ref<Doctor | null>(null)
const loadingDoctor = ref(true)
const loadingAvailability = ref(false)
const booking = ref(false)
const calendarOpen = ref(false)
const visibleMonth = ref(startOfMonth(new Date()))
const availabilitySlots = ref<AvailabilitySlot[]>([])
const selectedDay = ref<string | null>(null)
const selectedSlot = ref<string | null>(null)
const forcedDaySelection = ref<string | null>(null)
const todayKey = formatDateKey(new Date())

const doctorTypeName = computed(() => getDoctorTypeName(doctor.value?.specialization ?? doctor.value?.doctorType))
const selectedSlotLabel = computed(() => {
  if (!selectedSlot.value) return ''
  const value = new Date(selectedSlot.value)
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
})

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''

  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${selectedDay.value}T12:00:00`))
})

const slotsByDay = computed(() => {
  const groups = new Map<string, AvailabilitySlot[]>()
  for (const slot of availabilitySlots.value) {
    const day = slot.startDateTime.slice(0, 10)
    if (!groups.has(day)) groups.set(day, [])
    groups.get(day)?.push(slot)
  }
  return groups
})

const monthDays = computed(() => {
  const first = startOfMonth(visibleMonth.value)
  const last = endOfMonth(visibleMonth.value)
  const offset = (first.getDay() + 6) % 7
  const days: Array<{ key: string; date: Date | null }> = []

  for (let i = 0; i < offset; i += 1) {
    days.push({ key: `blank-${i}`, date: null })
  }

  for (let day = new Date(first); day <= last; day = addDays(day, 1)) {
    days.push({ key: formatDateKey(day), date: new Date(day) })
  }

  return days
})

const selectedDaySlots = computed(() => (selectedDay.value ? slotsByDay.value.get(selectedDay.value) ?? [] : []))

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function formatDateKey(date: Date) {
  return date.toLocaleDateString('en-CA')
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function loadDoctor() {
  const id = Number(route.query.doctorId)
  if (!id) {
    router.push('/doctors')
    return false
  }

  doctor.value = await doctorStore.getById(id)
  loadingDoctor.value = false
  return Boolean(doctor.value)
}

async function loadMonthAvailability() {
  if (!doctor.value) return

  loadingAvailability.value = true
  try {
    const from = startOfMonth(visibleMonth.value)
    const to = endOfMonth(visibleMonth.value)
    availabilitySlots.value = await doctorStore.getAvailability(
      doctor.value.id,
      formatDateKey(from),
      formatDateKey(to),
    )

    const availableDays = Array.from(slotsByDay.value.keys()).sort()
    const previousSelectedDay = selectedDay.value
    const selectableDays = availableDays.filter((day) => !isPastDate(new Date(`${day}T00:00:00`)))

    if (forcedDaySelection.value && slotsByDay.value.has(forcedDaySelection.value)) {
      selectedDay.value = forcedDaySelection.value
    } else if (
      visibleMonth.value.getMonth() === new Date().getMonth() &&
      visibleMonth.value.getFullYear() === new Date().getFullYear() &&
      slotsByDay.value.has(todayKey) &&
      !isPastDate(new Date(`${todayKey}T00:00:00`))
    ) {
      selectedDay.value = todayKey
    } else if (
      previousSelectedDay &&
      slotsByDay.value.has(previousSelectedDay) &&
      !isPastDate(new Date(`${previousSelectedDay}T00:00:00`))
    ) {
      selectedDay.value = previousSelectedDay
    } else {
      selectedDay.value = selectableDays[0] ?? null
    }

    forcedDaySelection.value = null

    if (selectedDay.value) {
      const slotsForDay = slotsByDay.value.get(selectedDay.value) ?? []
      const stillValidSelection = slotsForDay.some((slot) => slot.startDateTime === selectedSlot.value)
      selectedSlot.value = stillValidSelection ? selectedSlot.value : slotsForDay[0]?.startDateTime ?? null
    } else {
      selectedSlot.value = null
    }
  } finally {
    loadingAvailability.value = false
  }
}

function openCalendar() {
  calendarOpen.value = true
}

function closeCalendar() {
  calendarOpen.value = false
}

function goToToday() {
  forcedDaySelection.value = todayKey
  visibleMonth.value = startOfMonth(new Date())
  selectedDay.value = todayKey
  selectedSlot.value = null
}

function chooseMonth(offset: number) {
  visibleMonth.value = addMonths(visibleMonth.value, offset)
}

function selectDay(day: string) {
  const date = new Date(`${day}T00:00:00`)
  if (isPastDate(date) || daySlotCount(day) === 0) {
    popup.showMessage({
      title: 'Termin nicht verfügbar',
      message: 'Dieser Tag kann nicht gebucht werden. Bitte wählen Sie einen freien Termin aus.',
      variant: 'danger',
    })
    return
  }

  selectedDay.value = day
  selectedSlot.value = slotsByDay.value.get(day)?.[0]?.startDateTime ?? null
}

function selectSlot(slot: AvailabilitySlot) {
  selectedSlot.value = slot.startDateTime
}

function daySlotCount(key: string) {
  return slotsByDay.value.get(key)?.length ?? 0
}

function isPastDate(date: Date) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const candidate = new Date(date)
  candidate.setHours(0, 0, 0, 0)

  return candidate < start
}

async function confirmAppointment() {
  if (!isAuthenticated.value) {
    await loginWithRedirect({ appState: { target: router.currentRoute.value.fullPath } })
    return
  }

  if (!doctor.value || !selectedDay.value || !selectedSlot.value) return

  const selectedDate = new Date(`${selectedDay.value}T00:00:00`)
  if (isPastDate(selectedDate) || selectedDaySlots.value.length === 0) {
    await popup.showMessage({
      title: 'Termin nicht verfügbar',
      message: 'Der ausgewählte Tag kann nicht gebucht werden. Bitte wählen Sie einen freien Termin aus.',
      variant: 'danger',
    })
    return
  }

  const slotStillVisible = selectedDaySlots.value.some((slot) => slot.startDateTime === selectedSlot.value)
  if (!slotStillVisible) {
    await popup.showMessage({
      title: 'Termin nicht verfügbar',
      message: 'Der gewählte Termin ist nicht mehr verfügbar. Bitte wählen Sie einen anderen Slot aus.',
      variant: 'danger',
    })
    await loadMonthAvailability()
    calendarOpen.value = true
    return
  }

  booking.value = true
  try {
    const token = await getAccessTokenSilently()
    await profileStore.load(token)

    if (!profile.value?.id) return

    const savedAppointment = await doctorStore.bookAppointment(
      {
        doctorId: doctor.value.id,
        startDateTime: selectedSlot.value,
        reason: 'Online gebuchter Termin',
        price: null,
      },
      token,
    )

    router.push({
      path: '/booking-confirmation',
      query: {
        doctorName: formatDoctorName(savedAppointment.doctor ?? doctor.value),
        startDateTime: savedAppointment.startDateTime,
      },
    })
  } catch (error) {
    await popup.showMessage({
      title: 'Buchung nicht möglich',
      message: error instanceof Error ? error.message : 'Der Termin konnte nicht gebucht werden.',
      variant: 'danger',
    })
    await loadMonthAvailability()
    calendarOpen.value = true
  } finally {
    booking.value = false
  }
}

watch(visibleMonth, async () => {
  if (calendarOpen.value) {
    await loadMonthAvailability()
  }
})

watch(calendarOpen, async (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''

  if (isOpen) {
    await loadMonthAvailability()
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

onMounted(async () => {
  const hasDoctor = await loadDoctor()
  if (hasDoctor) {
    await loadMonthAvailability()
  }
})
</script>

<template>
  <NavBar />
  <main class="booking-shell">
    <section class="booking-panel">
      <div class="booking-head">
        <div>
          <h1>Termin buchen</h1>
          <p v-if="doctor">{{ formatDoctorName(doctor) }} · {{ doctorTypeName }}</p>
        </div>

        <router-link v-if="doctor" class="doctor-link" :to="{ name: 'doctor', params: { id: doctor.id } }">
          Arzt ansehen
        </router-link>
      </div>

      <div v-if="loadingDoctor" class="message">Arzt wird geladen...</div>
      <div v-else-if="!doctor" class="message">Arzt nicht gefunden.</div>

      <template v-else>
        <div class="picker-row">
          <button class="picker-button" type="button" @click="openCalendar">
            {{ selectedSlotLabel || 'Termin auswählen' }}
          </button>
          <div class="picker-hint">
            {{ selectedSlotLabel ? 'Ausgewählter Termin' : 'Wähle einen freien Termin im Kalender.' }}
          </div>
        </div>

        <div v-if="selectedSlotLabel" class="summary-box">
          <span class="summary-label">Ausgewählt</span>
          <strong>{{ selectedSlotLabel }}</strong>
        </div>

        <div class="booking-actions">
          <button class="confirm-btn" type="button" :disabled="booking || !selectedSlot" @click="confirmAppointment">
            {{ booking ? 'Buchung läuft...' : 'Termin bestätigen' }}
          </button>
        </div>
      </template>
    </section>

    <div v-if="calendarOpen" class="modal-backdrop" @click.self="closeCalendar">
      <section class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
        <header class="calendar-head">
          <div>
            <p class="modal-kicker">Termin auswählen</p>
            <h2 id="calendar-title">Wählen Sie einen freien Slot</h2>
            <p>Monat wählen, Tag auswählen und Uhrzeit bestätigen.</p>
          </div>
          <button type="button" class="close-icon" @click="closeCalendar">×</button>
        </header>

        <div class="calendar-toolbar">
          <div class="month-controls">
            <button type="button" class="nav-btn" aria-label="Vorheriger Monat" @click="chooseMonth(-1)">‹</button>
            <div class="month-pill">{{ formatMonth(visibleMonth) }}</div>
            <button type="button" class="nav-btn" aria-label="Nächster Monat" @click="chooseMonth(1)">›</button>
            <button type="button" class="today-btn" @click="goToToday">Heute</button>
          </div>

          <div class="legend" aria-hidden="true">
            <span><i class="legend-dot"></i> verfügbar</span>
            <span><i class="legend-dot legend-dot-today"></i> heute</span>
            <span><i class="legend-dot legend-dot-selected"></i> gewählt</span>
          </div>
        </div>

        <div v-if="loadingAvailability" class="modal-message">Verfügbarkeiten werden geladen...</div>

        <div v-else class="calendar-layout">
          <section class="calendar-surface">
            <div class="weekday-row">
              <span>Mo</span>
              <span>Di</span>
              <span>Mi</span>
              <span>Do</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>So</span>
            </div>

            <div class="calendar-grid">
              <button
                v-for="cell in monthDays"
                :key="cell.key"
                type="button"
                class="day-cell"
                :class="{
                  blank: !cell.date,
                  selected: cell.key === selectedDay,
                  available: cell.date && daySlotCount(cell.key) > 0,
                  muted: cell.date && daySlotCount(cell.key) === 0,
                  today: cell.date && cell.key === todayKey,
                  past: cell.date && isPastDate(cell.date),
                }"
                :disabled="!cell.date || isPastDate(cell.date) || daySlotCount(cell.key) === 0"
                @click="cell.date && !isPastDate(cell.date) && daySlotCount(cell.key) > 0 && selectDay(cell.key)"
              >
                <span class="day-top">
                  <span class="day-number">{{ cell.date?.getDate() }}</span>
                  <span v-if="cell.date && daySlotCount(cell.key) > 0" class="availability-dot"></span>
                </span>
                <span class="day-meta">
                  <template v-if="cell.date && daySlotCount(cell.key) > 0">{{ daySlotCount(cell.key) }} frei</template>
                  <template v-else-if="cell.date && isPastDate(cell.date)">Vergangen</template>
                  <template v-else-if="cell.date">Keine Zeiten</template>
                </span>
              </button>
            </div>
          </section>

          <section class="time-surface">
            <div class="time-head">
              <div>
                <p class="section-label">Ausgewählter Tag</p>
                <h3>{{ selectedDay ? selectedDayLabel : 'Tag wählen' }}</h3>
              </div>
              <button type="button" class="close-btn" @click="closeCalendar">Schließen</button>
            </div>

            <div v-if="!selectedDay" class="empty-state">
              Wählen Sie links einen Tag mit freien Terminen aus.
            </div>
            <template v-else>
              <div v-if="selectedDaySlots.length === 0" class="empty-state">
                Für diesen Tag sind keine freien Zeiten verfügbar.
              </div>
              <div v-else class="time-grid">
                <button
                  v-for="slot in selectedDaySlots"
                  :key="slot.startDateTime"
                  type="button"
                  class="time-btn"
                  :class="{ selected: selectedSlot === slot.startDateTime }"
                  @click="selectSlot(slot)"
                >
                  {{ formatTime(slot.startDateTime) }}
                </button>
              </div>

              <div v-if="selectedSlot" class="confirmation-card">
                <span class="summary-label">Ausgewählter Termin</span>
                <strong>{{ selectedSlotLabel }}</strong>
                <p>Wenn alles passt, können Sie den Termin direkt bestätigen.</p>
                <button class="confirm-btn modal-confirm" type="button" :disabled="booking || !selectedSlot" @click="confirmAppointment">
                  {{ booking ? 'Buchung läuft...' : 'Termin bestätigen' }}
                </button>
              </div>
            </template>
          </section>
        </div>
      </section>
    </div>
  </main>
  <AppFooter />
</template>

<style scoped>
.booking-shell {
  min-height: calc(100vh - 75px - 180px);
  padding: 48px 20px;
  background: linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
}

.booking-panel {
  width: min(760px, 100%);
  margin: 0 auto;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.booking-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.booking-head h1 {
  margin: 0 0 6px;
  color: #1f2a44;
  font-size: 28px;
}

.booking-head p {
  margin: 0;
  color: #64708a;
}

.doctor-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  color: #155dfc;
  background: #eef3fb;
}

.picker-row {
  display: grid;
  gap: 8px;
}

.picker-button {
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid #c9d7ef;
  border-radius: 10px;
  background: #fff;
  color: #1f2a44;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.picker-hint {
  color: #64708a;
  font-size: 14px;
}

.summary-box {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  background: #fbfcfe;
  display: grid;
  gap: 4px;
}

.summary-label {
  color: #64708a;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
}

.booking-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.confirm-btn {
  min-width: 220px;
  height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 10px;
  background: #155dfc;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.message {
  padding: 36px 0;
  color: #64708a;
  text-align: center;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 20px;
}

.calendar-modal {
  width: min(1040px, 100%);
  max-height: min(90vh, 920px);
  overflow: auto;
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
}

.calendar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.calendar-head h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2a44;
  text-align: left;
}

.calendar-head p {
  margin: 6px 0 0;
  color: #64708a;
  font-size: 14px;
  text-align: left;
  max-width: 44ch;
  line-height: 1.5;
}

.modal-kicker {
  margin: 0 0 6px;
  color: #5d7fd3;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
  font-weight: 800;
}

.close-icon {
  width: 44px;
  height: 44px;
  border: 1px solid #d4def0;
  background: #fff;
  color: #1f2a44;
  border-radius: 12px;
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 18px;
}

.month-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.month-pill {
  min-width: 176px;
  height: 42px;
  padding: 0 16px;
  border: 1px solid #d4def0;
  border-radius: 999px;
  background: #f8fbff;
  color: #1f2a44;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.today-btn {
  height: 42px;
  padding: 0 16px;
  border: 1px solid #c9d7ef;
  border-radius: 999px;
  background: #fff;
  color: #155dfc;
  font-weight: 800;
  cursor: pointer;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: #64708a;
  font-size: 13px;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #155dfc;
  display: inline-block;
}

.legend-dot-today {
  background: #64748b;
  box-shadow: 0 0 0 4px rgba(21, 93, 252, 0.08);
}

.legend-dot-selected {
  background: #fff;
  border: 2px solid #155dfc;
  box-sizing: border-box;
}

.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.calendar-surface,
.time-surface {
  border: 1px solid #e3ebf7;
  border-radius: 18px;
  background: #fbfcfe;
  padding: 18px;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
  color: #64708a;
  font-size: 12px;
  text-transform: uppercase;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.day-cell {
  min-height: 96px;
  padding: 10px;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.day-cell:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b9caf1;
  box-shadow: 0 10px 18px rgba(21, 93, 252, 0.08);
}

.day-cell.blank {
  border: 0;
  background: transparent;
  cursor: default;
  opacity: 0;
  pointer-events: none;
}

.day-cell.available {
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
}

.day-cell.muted {
  opacity: 0.72;
}

.day-cell.past {
  opacity: 0.45;
}

.day-cell.today {
  border-color: #8fb0ff;
}

.day-cell.selected {
  border-color: #155dfc;
  box-shadow: 0 0 0 2px rgba(21, 93, 252, 0.18);
}

.day-top {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.availability-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #155dfc;
  display: inline-block;
  margin-top: 4px;
  flex-shrink: 0;
}

.day-number {
  font-size: 17px;
  font-weight: 800;
  color: #1f2a44;
}

.day-meta {
  font-size: 12px;
  color: #64708a;
}

.time-surface {
  background: #fff;
}

.time-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.time-head h3 {
  margin: 2px 0 0;
  font-size: 20px;
  color: #1f2a44;
  line-height: 1.35;
}

.section-label {
  margin: 0;
  color: #64708a;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0;
  font-weight: 800;
}

.close-btn {
  height: 40px;
  padding: 0 14px;
  border: 1px solid #c9d7ef;
  background: #fff;
  color: #1f2a44;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  flex-shrink: 0;
}

.empty-state {
  padding: 18px;
  border: 1px dashed #d4def0;
  border-radius: 14px;
  background: #f8fbff;
  color: #5f6f8c;
  line-height: 1.5;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.time-btn {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid #c9d7ef;
  border-radius: 12px;
  background: #fff;
  color: #1f2a44;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.time-btn:hover {
  border-color: #9cb7ee;
  box-shadow: 0 8px 14px rgba(21, 93, 252, 0.08);
  transform: translateY(-1px);
}

.time-btn.selected {
  color: #fff;
  background: #155dfc;
  border-color: #155dfc;
}

.confirmation-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #d9e4f7;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.confirmation-card strong {
  font-size: 16px;
  color: #1f2a44;
  line-height: 1.4;
}

.confirmation-card p {
  margin: 0;
  color: #64708a;
  font-size: 14px;
  line-height: 1.5;
}

.modal-confirm {
  width: 100%;
  margin-top: 6px;
}

.modal-message {
  padding: 16px;
  color: #64708a;
  text-align: center;
  border: 1px dashed #d4def0;
  border-radius: 14px;
  background: #f8fbff;
}

@media (max-width: 960px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .booking-head {
    flex-direction: column;
  }

  .modal-backdrop {
    padding: 10px;
  }

  .calendar-modal {
    padding: 16px;
    border-radius: 18px;
  }

  .calendar-head {
    flex-direction: column;
  }

  .close-icon {
    align-self: flex-end;
  }

  .calendar-toolbar {
    align-items: stretch;
  }

  .month-controls {
    width: 100%;
  }

  .month-pill {
    flex: 1;
    min-width: 0;
  }

  .legend {
    justify-content: flex-start;
  }

  .calendar-surface,
  .time-surface {
    padding: 14px;
  }

  .calendar-grid {
    gap: 8px;
  }

  .day-cell {
    min-height: 78px;
    padding: 8px;
  }

  .time-grid {
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  }
}
</style>
