<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useDoctorStore, type Appointment } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import { usePopupStore } from '@/stores/popup'
import {
  appointmentDateKey,
  appointmentStatusLabel,
  appointmentStatusTone,
  formatAppointmentDateLine,
  formatAppointmentDateParts,
  formatAppointmentTimeRange,
  formatDurationMinutes,
  getAppointmentDoctor,
  getAppointmentDoctorName,
  getAppointmentDoctorPractice,
  getAppointmentDoctorSpecialty,
  getAppointmentDistanceLabel,
  getAppointmentEmailUrl,
  getAppointmentLocationLabel,
  getAppointmentMapsUrl,
  getAppointmentPatient,
  getAppointmentPatientEmailUrl,
  getAppointmentPatientName,
  getAppointmentPatientPhoneUrl,
  getAppointmentPhoneUrl,
  getAppointmentPriceLabel,
  getAppointmentServiceLabel,
  getAppointmentWebsiteUrl,
  getAppointmentDurationMinutes,
  isAppointmentCancelled,
  isAppointmentCompleted,
  isAppointmentUpcoming,
} from '@/utils/appointmentView'

type AppointmentFilterKey = 'all' | 'upcoming' | 'completed' | 'cancelled'

interface AppointmentCardMetaItem {
  icon: string
  label: string
  value: string
}

interface AppointmentCardViewModel {
  id: number
  memoKey: string
  ariaLabel: string
  dateParts: ReturnType<typeof formatAppointmentDateParts>
  eyebrow: string
  title: string
  subtitle: string
  badges: string[]
  metaItems: AppointmentCardMetaItem[]
  statusTone: string
  statusLabel: string
}

interface AppointmentCardsResult {
  cards: AppointmentCardViewModel[]
  total: number
}

const router = useRouter()
const route = useRoute()
const { isAuthenticated, getAccessTokenSilently, user } = useAuth0()
const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { profile, isLoading: isProfileLoading } = storeToRefs(profileStore)

const appointments = ref<Appointment[]>([])
const isAppointmentsLoading = ref(false)
const errorMessage = ref('')
const selectedFilter = ref<AppointmentFilterKey>('upcoming')
const focusedMonth = ref(startOfMonth(new Date()))
const selectedDateKey = ref<string | null>(null)
const selectedAppointmentId = ref<number | null>(null)
const hasManualMonthSelection = ref(false)
const doctorLookupQuery = ref('')
const patientLookupQuery = ref('')
const appointmentVisibleLimit = ref(10)
const hiddenAppointmentIds = ref<Set<number>>(new Set())

let bodyOverflowBackup = ''

const isAdmin = computed(() => profile.value?.role === 'ADMIN')
const isDoctor = computed(() => profile.value?.role === 'DOCTOR')
const isPatient = computed(() => profile.value?.role === 'USER')

const pageTitle = computed(() => {
  if (isAdmin.value) return 'Alle Termine'
  if (isDoctor.value) return 'Patiententermine'
  return 'Meine Termine'
})

const pageDescription = computed(() => {
  if (isAdmin.value) return 'Alle Termine im System auf einen Blick.'
  if (isDoctor.value) return 'Ihre Patiententermine strukturiert und schnell erfassbar.'
  return 'Ihre Termine übersichtlich an einem Ort.'
})

const roleBadgeLabel = computed(() => {
  if (isAdmin.value) return 'Admin'
  if (isDoctor.value) return 'Arzt'
  return 'Patient'
})

const cardEyebrowLabel = computed(() => {
  if (isDoctor.value) return 'Patient'
  if (isAdmin.value) return 'Termin'
  return 'Arzt'
})

const headerActionLabel = computed(() => {
  if (isAdmin.value) return 'Termin erstellen'
  if (isPatient.value) return 'Neuen Termin buchen'
  return ''
})

const headerActionVisible = computed(() => isAdmin.value || isPatient.value)
const loadingState = computed(() => isProfileLoading.value || isAppointmentsLoading.value)

const sortedAppointments = computed(() => {
  return appointments.value
    .filter((appointment) => !hiddenAppointmentIds.value.has(appointment.id))
    .sort((left, right) => {
    return new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime()
    })
})

const appointmentCounts = computed(() => {
  const now = new Date()
  return sortedAppointments.value.reduce(
    (counts, appointment) => {
      counts.all += 1
      if (isAppointmentCancelled(appointment)) {
        counts.cancelled += 1
      } else if (isAppointmentCompleted(appointment) || new Date(appointment.endDateTime).getTime() < now.getTime()) {
        counts.completed += 1
      } else if (isAppointmentUpcoming(appointment, now)) {
        counts.upcoming += 1
      }
      return counts
    },
    { all: 0, upcoming: 0, completed: 0, cancelled: 0 },
  )
})

const filterOptions = computed(() => [
  { key: 'all' as const, label: 'Alle Termine', count: appointmentCounts.value.all },
  { key: 'upcoming' as const, label: 'Bevorstehend', count: appointmentCounts.value.upcoming },
  { key: 'completed' as const, label: 'Abgeschlossen', count: appointmentCounts.value.completed },
  { key: 'cancelled' as const, label: 'Storniert', count: appointmentCounts.value.cancelled },
])

const appointmentDateCounts = computed(() => {
  const counts = new Map<string, number>()
  const now = new Date()
  for (const appointment of sortedAppointments.value) {
    switch (selectedFilter.value) {
      case 'upcoming':
        if (!isAppointmentUpcoming(appointment, now)) continue
        break
      case 'completed':
        if (!isAppointmentCompleted(appointment) && new Date(appointment.endDateTime).getTime() >= now.getTime()) continue
        break
      case 'cancelled':
        if (!isAppointmentCancelled(appointment)) continue
        break
      default:
        if (isAppointmentCancelled(appointment)) continue
        break
    }

    const key = appointmentDateKey(appointment.startDateTime)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
})

const doctorLookupOptions = computed(() => {
  const names = new Set<string>()
  for (const appointment of sortedAppointments.value) {
    const name = getAppointmentDoctorName(appointment).trim()
    if (name && name !== 'Arzt unbekannt') names.add(name)
  }
  return [...names].sort((left, right) => left.localeCompare(right, 'de'))
})

const patientLookupOptions = computed(() => {
  const names = new Set<string>()
  for (const appointment of sortedAppointments.value) {
    const name = getAppointmentPatientName(appointment).trim()
    if (name && name !== 'Patient unbekannt') names.add(name)
  }
  return [...names].sort((left, right) => left.localeCompare(right, 'de'))
})

const showDoctorLookup = computed(() => isAdmin.value || isPatient.value)
const showPatientLookup = computed(() => isAdmin.value || isDoctor.value)
const doctorLookupLabel = computed(() => (isDoctor.value ? 'Patient suchen' : 'Arzt suchen'))
const doctorLookupPlaceholder = computed(() => (isDoctor.value ? 'Patient auswählen...' : 'Arzt auswählen...'))
const doctorLookupClearLabel = computed(() => (isDoctor.value ? 'Patientenfilter löschen' : 'Arztfilter löschen'))
const patientLookupLabel = computed(() => 'Patient suchen')
const patientLookupPlaceholder = computed(() => 'Patient auswählen...')
const patientLookupClearLabel = computed(() => 'Patientenfilter löschen')

const visibleAppointmentCardsResult = computed<AppointmentCardsResult>(() => {
  const now = new Date()
  const doctorQuery = doctorLookupQuery.value.trim().toLowerCase()
  const patientQuery = patientLookupQuery.value.trim().toLowerCase()
  const cards: AppointmentCardViewModel[] = []
  let total = 0

  for (const appointment of sortedAppointments.value) {
    if (isAdmin.value) {
      const doctorName = getAppointmentDoctorName(appointment).toLowerCase()
      const patientName = getAppointmentPatientName(appointment).toLowerCase()

      if (doctorQuery && !doctorName.includes(doctorQuery)) continue
      if (patientQuery && !patientName.includes(patientQuery)) continue
    } else if (isPatient.value) {
      const doctorName = getAppointmentDoctorName(appointment).toLowerCase()
      if (doctorQuery && !doctorName.includes(doctorQuery)) continue
    } else if (isDoctor.value) {
      const patientName = getAppointmentPatientName(appointment).toLowerCase()
      if (patientQuery && !patientName.includes(patientQuery)) continue
    }

    if (selectedDateKey.value && appointmentDateKey(appointment.startDateTime) !== selectedDateKey.value) {
      continue
    }

    if (selectedDateKey.value && isAppointmentCancelled(appointment) && selectedFilter.value !== 'cancelled') {
      continue
    }

    switch (selectedFilter.value) {
      case 'upcoming':
        if (!isAppointmentUpcoming(appointment, now)) continue
        break
      case 'completed':
        if (!isAppointmentCompleted(appointment) && new Date(appointment.endDateTime).getTime() >= now.getTime()) continue
        break
      case 'cancelled':
        if (!isAppointmentCancelled(appointment)) continue
        break
      default:
        break
    }

    total += 1

    if (cards.length >= appointmentVisibleLimit.value) {
      continue
    }

    cards.push(buildAppointmentCardViewModel(appointment))
  }

  return { cards, total }
})

const visibleAppointmentCards = computed(() => visibleAppointmentCardsResult.value.cards)
const visibleAppointmentCount = computed(() => visibleAppointmentCardsResult.value.total)
const hasMoreVisibleAppointments = computed(() => visibleAppointmentCount.value > visibleAppointmentCards.value.length)

const upcomingAppointments = computed(() => {
  const now = new Date()
  return sortedAppointments.value.filter((appointment) => isAppointmentUpcoming(appointment, now))
})

const nextAppointment = computed(() => upcomingAppointments.value[0] ?? null)

const selectedAppointment = computed(() => {
  if (selectedAppointmentId.value === null) return null
  return sortedAppointments.value.find((appointment) => appointment.id === selectedAppointmentId.value) ?? null
})

const appointmentRating = ref<number | null>(null)
const appointmentRatingComment = ref('')
const isRatingSaving = ref(false)

const selectedAppointmentData = computed(() => {
  const appointment = selectedAppointment.value
  if (!appointment) return null

  const doctor = getAppointmentDoctor(appointment)
  const patient = getAppointmentPatient(appointment)
  const durationMinutes = getAppointmentDurationMinutes(appointment.startDateTime, appointment.endDateTime)
  const displayStatus = getDisplayAppointmentStatus(appointment)

  return {
    appointment,
    doctor,
    patient,
    dateParts: formatAppointmentDateParts(appointment.startDateTime),
    dateLine: formatAppointmentDateLine(appointment.startDateTime),
    timeRange: formatAppointmentTimeRange(appointment.startDateTime, appointment.endDateTime),
    durationLabel: formatDurationMinutes(durationMinutes),
    statusLabel: appointmentStatusLabel(displayStatus),
    statusTone: appointmentStatusTone(displayStatus),
    doctorName: getAppointmentDoctorName(appointment),
    doctorPractice: getAppointmentDoctorPractice(appointment),
    doctorSpecialty: getAppointmentDoctorSpecialty(appointment),
    patientName: getAppointmentPatientName(appointment),
    serviceLabel: getAppointmentServiceLabel(appointment),
    priceLabel: getAppointmentPriceLabel(appointment) || 'Preis auf Anfrage',
    locationLabel: getAppointmentLocationLabel(appointment),
    distanceLabel: getAppointmentDistanceLabel(appointment),
    mapsUrl: getAppointmentMapsUrl(appointment),
    doctorPhoneUrl: getAppointmentPhoneUrl(appointment),
    doctorEmailUrl: getAppointmentEmailUrl(appointment),
    doctorWebsiteUrl: getAppointmentWebsiteUrl(appointment),
    patientPhoneUrl: getAppointmentPatientPhoneUrl(appointment),
    patientEmailUrl: getAppointmentPatientEmailUrl(appointment),
    patientPhone: patient?.phoneNumber ?? '',
    patientEmail: patient?.email ?? '',
    rating: appointment.rating ?? null,
    ratingComment: appointment.ratingComment ?? '',
    reason: appointment.reason?.trim() && appointment.reason.trim() !== getAppointmentServiceLabel(appointment)
      ? appointment.reason.trim()
      : '',
  }
})

const canRateSelectedAppointment = computed(() => {
  const appointment = selectedAppointment.value
  if (!appointment) return false
  if (isAppointmentCancelled(appointment)) return false
  if (new Date(appointment.endDateTime).getTime() > Date.now()) return false
  return isAdmin.value || isPatient.value
})

watch(selectedAppointment, (appointment) => {
  appointmentRating.value = appointment?.rating ?? null
  appointmentRatingComment.value = appointment?.ratingComment ?? ''
}, { immediate: true })

const selectedDateLabel = computed(() => {
  if (!selectedDateKey.value) return ''
  const [year, month, day] = selectedDateKey.value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return formatAppointmentDateLine(date)
})

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric',
  }).format(focusedMonth.value)
})

const calendarCells = computed(() => {
  const month = startOfMonth(focusedMonth.value)
  const firstWeekday = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: Array<{ key: string; date: Date | null; activeMonth: boolean }> = []

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - firstWeekday + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push({ key: `blank-${index}`, date: null, activeMonth: false })
      continue
    }

    const date = new Date(month.getFullYear(), month.getMonth(), dayNumber)
    cells.push({ key: appointmentDateKey(date), date, activeMonth: true })
  }

  return cells
})

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function getDisplayAppointmentStatus(appointment: Appointment, referenceDate = new Date()) {
  if (isAppointmentCancelled(appointment)) return appointment.status
  if (isAppointmentCompleted(appointment) || new Date(appointment.endDateTime).getTime() < referenceDate.getTime()) {
    return 'COMPLETED'
  }
  return appointment.status
}

function getRouteAppointmentId() {
  const rawAppointmentId = route.query.appointmentId
  const value = Array.isArray(rawAppointmentId) ? rawAppointmentId[0] : rawAppointmentId

  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const parsedId = Number(value)
  return Number.isInteger(parsedId) ? parsedId : null
}

async function syncRouteAppointmentId(appointmentId: number | null) {
  const currentAppointmentId = getRouteAppointmentId()
  if (currentAppointmentId === appointmentId) return

  const query = { ...route.query }
  if (appointmentId === null) {
    delete query.appointmentId
  } else {
    query.appointmentId = String(appointmentId)
  }

  try {
    await router.replace({ path: route.path, query, hash: route.hash })
  } catch {
    // Ignore duplicate navigation or guard rejections; the local state already updated.
  }
}

function getAppointmentReturnTo() {
  const query = { ...route.query }
  if (selectedAppointmentId.value === null) {
    delete query.appointmentId
  } else {
    query.appointmentId = String(selectedAppointmentId.value)
  }

  return router.resolve({ path: route.path, query, hash: route.hash }).fullPath
}

function buildAppointmentCardViewModel(appointment: Appointment): AppointmentCardViewModel {
  const dateParts = formatAppointmentDateParts(appointment.startDateTime)
  const doctorName = getAppointmentDoctorName(appointment)
  const patientName = getAppointmentPatientName(appointment)
  const practice = getAppointmentDoctorPractice(appointment)
  const specialty = getAppointmentDoctorSpecialty(appointment)
  const serviceLabel = getAppointmentServiceLabel(appointment)
  const timeRange = formatAppointmentTimeRange(appointment.startDateTime, appointment.endDateTime)
  const durationMinutes = getAppointmentDurationMinutes(appointment.startDateTime, appointment.endDateTime)
  const durationLabel = formatDurationMinutes(durationMinutes) || 'Unbekannt'
  const priceLabel = getAppointmentPriceLabel(appointment)
  const distanceLabel = getAppointmentDistanceLabel(appointment)
  const displayStatus = getDisplayAppointmentStatus(appointment)
  const title = isDoctor.value ? patientName : doctorName
  const subtitle = isDoctor.value
    ? `Praxis: ${practice}`
    : isAdmin.value
      ? `Praxis: ${practice} · Patient: ${patientName}`
      : `Praxis: ${practice}`
  const badges = [serviceLabel, specialty].filter((value): value is string => Boolean(value))
  const metaItems: AppointmentCardMetaItem[] = [
    { icon: 'mdi-map-marker-outline', label: 'Ort', value: getAppointmentLocationLabel(appointment) },
    { icon: 'mdi-clock-outline', label: 'Uhrzeit', value: timeRange },
    { icon: 'mdi-timer-outline', label: 'Dauer', value: durationLabel },
  ]

  if (priceLabel) {
    metaItems.push({ icon: 'mdi-currency-eur', label: 'Preis', value: priceLabel })
  }

  if (distanceLabel) {
    metaItems.push({ icon: 'mdi-map-marker-distance', label: 'Entfernung', value: distanceLabel })
  }

  return {
    id: appointment.id,
    memoKey: [
      appointment.id,
      appointment.status,
      appointment.startDateTime,
      appointment.endDateTime,
      cardEyebrowLabel.value,
      title,
      subtitle,
      serviceLabel,
      specialty,
      timeRange,
      durationLabel,
      priceLabel ?? '',
      distanceLabel ?? '',
      getAppointmentLocationLabel(appointment),
    ].join('|'),
    ariaLabel: `${title} · ${timeRange} · ${appointmentStatusLabel(displayStatus)}`,
    dateParts,
    eyebrow: cardEyebrowLabel.value,
    title,
    subtitle,
    badges,
    metaItems,
    statusTone: appointmentStatusTone(displayStatus),
    statusLabel: appointmentStatusLabel(displayStatus),
  }
}

function canCancelAppointment(appointment: Appointment) {
  const displayStatus = appointmentStatusLabel(getDisplayAppointmentStatus(appointment))
  if (displayStatus === 'STORNIERT' || displayStatus === 'ABGESCHLOSSEN') return false
  if (isAdmin.value) return true
  if (isDoctor.value) return getAppointmentDoctor(appointment)?.id === profile.value?.id
  return getAppointmentPatient(appointment)?.id === profile.value?.id
}

function canDeleteAppointment(appointment: Appointment) {
  return isAdmin.value && !!appointment.id
}

function canOpenDoctorProfile() {
  return !!selectedAppointment.value?.doctor
}

function canOpenPatientProfile() {
  const appointment = selectedAppointment.value
  return !!appointment && !!getAppointmentPatient(appointment) && (isAdmin.value || isDoctor.value)
}

function openAppointmentDetails(appointmentId: number) {
  selectedAppointmentId.value = appointmentId
  void syncRouteAppointmentId(appointmentId)
}

function closeAppointmentDetails() {
  selectedAppointmentId.value = null
  void syncRouteAppointmentId(null)
}

function selectDate(dateKey: string) {
  if ((appointmentDateCounts.value.get(dateKey) ?? 0) === 0) return
  selectedDateKey.value = selectedDateKey.value === dateKey ? null : dateKey
}

function clearFilters() {
  selectedFilter.value = 'upcoming'
  selectedDateKey.value = null
  doctorLookupQuery.value = ''
  patientLookupQuery.value = ''
  appointmentVisibleLimit.value = 10
}

function clearDoctorLookup() {
  doctorLookupQuery.value = ''
}

function clearPatientLookup() {
  patientLookupQuery.value = ''
}

function loadMoreAppointments() {
  appointmentVisibleLimit.value += 10
}

function shiftFocusedMonth(offset: number) {
  hasManualMonthSelection.value = true
  focusedMonth.value = shiftMonth(focusedMonth.value, offset)
}

function goToCurrentMonth() {
  hasManualMonthSelection.value = true
  focusedMonth.value = startOfMonth(new Date())
  selectedFilter.value = 'upcoming'
  const todayKey = appointmentDateKey(new Date())
  selectedDateKey.value = appointmentDateCounts.value.has(todayKey) ? todayKey : null
}

function syncFocusedMonth() {
  if (hasManualMonthSelection.value) return

  const today = new Date()
  if (sortedAppointments.value.some((appointment) => isSameMonth(new Date(appointment.startDateTime), today))) {
    focusedMonth.value = startOfMonth(today)
    return
  }

  const next = nextAppointment.value ?? sortedAppointments.value[0] ?? null
  if (next) {
    focusedMonth.value = startOfMonth(new Date(next.startDateTime))
  }
}

async function loadAppointments() {
  if (!isAuthenticated.value) {
    appointments.value = []
    return
  }

  isAppointmentsLoading.value = true
  errorMessage.value = ''

  try {
    const token = await getAccessTokenSilently()
    const activeAuth0Id = user.value?.sub ?? null
    const shouldForceProfileReload = !profile.value || profile.value.auth0Id !== activeAuth0Id
    await profileStore.load(token, shouldForceProfileReload)

    if (isAdmin.value) {
      appointments.value = await doctorStore.getAllAppointments(token)
    } else if (isDoctor.value) {
      appointments.value = profile.value?.id ? await doctorStore.getAppointments(profile.value.id, token) : []
    } else {
      appointments.value = await doctorStore.getMyAppointments(token)
    }

    syncFocusedMonth()
  } catch (error) {
    appointments.value = []
    errorMessage.value = error instanceof Error ? error.message : 'Termine konnten nicht geladen werden.'
  } finally {
    isAppointmentsLoading.value = false
  }
}

async function cancelAppointment(appointment: Appointment) {
  const confirmed = await popup.showConfirmation({
    title: isDoctor.value ? 'Termin absagen' : 'Termin stornieren',
    message: 'Möchten Sie diesen Termin wirklich ändern?',
    confirmLabel: isDoctor.value ? 'Absagen' : 'Stornieren',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    const token = await getAccessTokenSilently()
    await doctorStore.cancelAppointment(appointment.id, token)
    closeAppointmentDetails()
    await loadAppointments()
  } catch (error) {
    await popup.showMessage({
      title: 'Stornierung fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Der Termin konnte nicht storniert werden.',
      variant: 'danger',
    })
  }
}

async function deleteAppointment(appointment: Appointment) {
  const confirmed = await popup.showConfirmation({
    title: 'Termin löschen',
    message: 'Dieser Termin wird dauerhaft entfernt. Möchten Sie fortfahren?',
    confirmLabel: 'Löschen',
    variant: 'danger',
  })

  if (!confirmed) return

  try {
    const token = await getAccessTokenSilently()
    await doctorStore.deleteAppointment(appointment.id, token)
    hiddenAppointmentIds.value = new Set([...hiddenAppointmentIds.value, appointment.id])
    appointments.value = appointments.value.filter((item) => item.id !== appointment.id)
    if (selectedAppointmentId.value === appointment.id) {
      closeAppointmentDetails()
    }
  } catch (error) {
    await popup.showMessage({
      title: 'Löschen fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Der Termin konnte nicht gelöscht werden.',
      variant: 'danger',
    })
  }
}

async function saveAppointmentRating() {
  const appointment = selectedAppointment.value
  if (!appointment) return

  try {
    isRatingSaving.value = true
    const token = await getAccessTokenSilently()
    await doctorStore.rateAppointment(
      appointment.id,
      {
        rating: appointmentRating.value,
        ratingComment: appointmentRatingComment.value,
      },
      token,
    )
    await loadAppointments()
    await popup.showMessage({
      title: 'Bewertung gespeichert',
      message: 'Die Arztbewertung wurde aktualisiert.',
      variant: 'success',
    })
  } catch (error) {
    await popup.showMessage({
      title: 'Bewertung fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Die Bewertung konnte nicht gespeichert werden.',
      variant: 'danger',
    })
  } finally {
    isRatingSaving.value = false
  }
}

function openDoctorProfile() {
  const doctor = selectedAppointment.value?.doctor
  if (!doctor) return
  router.push({ name: 'doctor', params: { id: doctor.id }, query: { returnTo: getAppointmentReturnTo() } })
}

function openPatientProfile() {
  const patient = selectedAppointment.value ? getAppointmentPatient(selectedAppointment.value) : null
  if (!patient) return
  router.push({
    name: 'user-detail',
    params: { id: patient.id },
    query: { returnTo: getAppointmentReturnTo() },
    state: { userSnapshot: JSON.stringify(patient) },
  })
}

function goToDoctors() {
  router.push('/doctors')
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && selectedAppointmentId.value !== null) {
    closeAppointmentDetails()
  }
}

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadAppointments()
  } else {
    appointments.value = []
    errorMessage.value = ''
    selectedAppointmentId.value = null
    void syncRouteAppointmentId(null)
    selectedFilter.value = 'upcoming'
    selectedDateKey.value = null
    doctorLookupQuery.value = ''
    patientLookupQuery.value = ''
    appointmentVisibleLimit.value = 10
    hiddenAppointmentIds.value = new Set()
  }
}, { immediate: true })

watch(
  () => route.query.appointmentId,
  () => {
    const routeAppointmentId = getRouteAppointmentId()
    if (routeAppointmentId === selectedAppointmentId.value) return
    selectedAppointmentId.value = routeAppointmentId
  },
  { immediate: true },
)

watch([selectedFilter, selectedDateKey, doctorLookupQuery, patientLookupQuery], () => {
  appointmentVisibleLimit.value = 10

  if (selectedDateKey.value && !appointmentDateCounts.value.has(selectedDateKey.value)) {
    selectedDateKey.value = null
  }
})

watch(selectedAppointmentId, (value) => {
  if (typeof document === 'undefined') return

  if (value !== null) {
    if (!bodyOverflowBackup) {
      bodyOverflowBackup = document.body.style.overflow
    }
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = bodyOverflowBackup
    bodyOverflowBackup = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = bodyOverflowBackup
  }
  bodyOverflowBackup = ''
})
</script>

<template>
  <NavBar />

  <main class="appointments-page">
    <section class="appointments-shell">
      <aside class="appointments-sidebar">
        <section class="sidebar-card sidebar-card--next">
          <div class="sidebar-card__head">
            <div class="sidebar-title">
              <v-icon size="20">mdi-calendar-clock-outline</v-icon>
              <span>Nächster Termin</span>
            </div>
          </div>

          <div v-if="nextAppointment" class="next-appointment">
            <p class="next-appointment__date">{{ formatAppointmentDateLine(nextAppointment.startDateTime) }}</p>
            <strong>{{ formatAppointmentTimeRange(nextAppointment.startDateTime, nextAppointment.endDateTime) }}</strong>
            <span>{{ isDoctor ? getAppointmentPatientName(nextAppointment) : getAppointmentDoctorName(nextAppointment) }}</span>
            <small>{{ getAppointmentServiceLabel(nextAppointment) }}</small>
            <button class="secondary-button" type="button" @click="openAppointmentDetails(nextAppointment.id)">
              Details anzeigen
            </button>
          </div>

          <div v-else class="next-appointment next-appointment--empty">
            <p>Kein bevorstehender Termin vorhanden.</p>
          </div>
        </section>

        <section class="sidebar-card sidebar-card--calendar">
          <div class="sidebar-card__head">
            <div class="sidebar-title">
              <v-icon size="20">mdi-calendar-month-outline</v-icon>
              <span>Übersicht</span>
            </div>
            <button class="mini-button" type="button" @click="goToCurrentMonth">Heute</button>
          </div>

          <div class="calendar-header">
            <button class="icon-button" type="button" aria-label="Vorheriger Monat" @click="shiftFocusedMonth(-1)">
              <v-icon size="18">mdi-chevron-left</v-icon>
            </button>
            <strong>{{ monthLabel }}</strong>
            <button class="icon-button" type="button" aria-label="Nächster Monat" @click="shiftFocusedMonth(1)">
              <v-icon size="18">mdi-chevron-right</v-icon>
            </button>
          </div>

          <div class="weekday-row" aria-hidden="true">
            <span>MO</span>
            <span>DI</span>
            <span>MI</span>
            <span>DO</span>
            <span>FR</span>
            <span>SA</span>
            <span>SO</span>
          </div>

          <div class="calendar-grid">
            <button
              v-for="cell in calendarCells"
              :key="cell.key"
              class="calendar-day"
              :class="{
                'is-empty': !cell.date,
                'is-selected': cell.key === selectedDateKey,
                'has-appointments': cell.date && (appointmentDateCounts.get(cell.key) ?? 0) > 0,
                'is-today': cell.date && cell.key === appointmentDateKey(new Date()),
              }"
              type="button"
              :disabled="!cell.date || (appointmentDateCounts.get(cell.key) ?? 0) === 0"
              @click="cell.date && selectDate(cell.key)"
            >
              <span v-if="cell.date" class="calendar-day__number">{{ cell.date.getDate() }}</span>
              <span v-if="cell.date && (appointmentDateCounts.get(cell.key) ?? 0) > 0" class="calendar-day__dot" />
            </button>
          </div>
        </section>

        <section class="sidebar-card sidebar-card--filters">
          <div class="sidebar-card__head">
            <div class="sidebar-title">
              <v-icon size="20">mdi-filter-variant</v-icon>
              <span>Filter</span>
            </div>
          </div>

          <div v-if="showDoctorLookup" class="lookup-stack">
            <label class="lookup-field">
              <span>{{ doctorLookupLabel }}</span>
              <div class="lookup-input-shell">
                <input
                  v-model="doctorLookupQuery"
                  type="text"
                  list="doctor-lookup-options"
                  :placeholder="doctorLookupPlaceholder"
                  autocomplete="off"
                >
                <button
                  v-if="doctorLookupQuery"
                  class="lookup-clear-button"
                  type="button"
                  :aria-label="doctorLookupClearLabel"
                  @click="clearDoctorLookup"
                >
                  ×
                </button>
              </div>
            </label>
          </div>

          <div v-if="showPatientLookup" class="lookup-stack">
            <label class="lookup-field">
              <span>{{ patientLookupLabel }}</span>
              <div class="lookup-input-shell">
                <input
                  v-model="patientLookupQuery"
                  type="text"
                  list="patient-lookup-options"
                  :placeholder="patientLookupPlaceholder"
                  autocomplete="off"
                >
                <button
                  v-if="patientLookupQuery"
                  class="lookup-clear-button"
                  type="button"
                  :aria-label="patientLookupClearLabel"
                  @click="clearPatientLookup"
                >
                  ×
                </button>
              </div>
            </label>
          </div>

          <datalist id="doctor-lookup-options">
            <option v-for="option in doctorLookupOptions" :key="option" :value="option" />
          </datalist>

          <datalist id="patient-lookup-options">
            <option v-for="option in patientLookupOptions" :key="option" :value="option" />
          </datalist>

          <div class="filter-list">
            <button
              v-for="option in filterOptions"
              :key="option.key"
              class="filter-pill"
              :class="{ active: selectedFilter === option.key }"
              type="button"
              @click="selectedFilter = option.key"
            >
              <span>{{ option.label }}</span>
              <strong>{{ option.count }}</strong>
            </button>
          </div>

          <div v-if="selectedDateKey" class="active-date-chip">
            <div>
              <span>Aktiver Tag</span>
              <strong>{{ selectedDateLabel }}</strong>
            </div>
            <button class="chip-close" type="button" aria-label="Auswahl entfernen" @click="selectedDateKey = null">
              ×
            </button>
          </div>
        </section>
      </aside>

      <section class="appointments-main">
        <header class="appointments-hero">
          <div class="hero-copy">
            <p class="eyebrow">Terminverwaltung</p>
            <div class="hero-title-row">
              <h1>{{ pageTitle }}</h1>
              <span class="role-pill">{{ roleBadgeLabel }}</span>
            </div>
            <p>{{ pageDescription }}</p>
          </div>

          <router-link v-if="headerActionVisible" class="primary-button" to="/doctors">
            <v-icon size="18">mdi-plus</v-icon>
            <span>{{ headerActionLabel }}</span>
          </router-link>
        </header>

        <div class="main-toolbar">
          <div class="toolbar-chips">
            <span class="toolbar-chip">{{ visibleAppointmentCount }} Termine</span>
            <span v-if="selectedDateKey" class="toolbar-chip toolbar-chip--soft">{{ selectedDateLabel }}</span>
          </div>

          <button
            v-if="selectedFilter !== 'upcoming' || selectedDateKey || doctorLookupQuery || patientLookupQuery"
            class="toolbar-link"
            type="button"
            @click="clearFilters"
          >
            Filter zurücksetzen
          </button>
        </div>

        <p v-if="loadingState" class="state-message">Termine werden geladen...</p>
        <p v-else-if="errorMessage" class="state-message state-message--error">{{ errorMessage }}</p>
        <p v-else-if="appointments.length === 0" class="state-message">
          {{ isAdmin ? 'Im System sind derzeit keine Termine hinterlegt.' : 'Es sind derzeit keine Termine vorhanden.' }}
        </p>
        <div v-else-if="visibleAppointmentCards.length === 0" class="empty-state">
          <h2>Keine Termine für diese Auswahl</h2>
          <p>Bitte passen Sie die Filter an oder setzen Sie die Auswahl zurück.</p>
          <button class="secondary-button" type="button" @click="clearFilters">Filter zurücksetzen</button>
        </div>

        <div v-else class="appointments-grid">
          <button
            v-for="card in visibleAppointmentCards"
            :key="card.id"
            v-memo="[card.memoKey]"
            type="button"
            class="appointment-card"
            :class="`tone-${card.statusTone}`"
            :aria-label="card.ariaLabel"
            :data-appointment-id="card.id"
            @click="openAppointmentDetails(card.id)"
          >
            <div class="appointment-card__date">
              <span class="appointment-card__weekday">{{ card.dateParts.weekday }}</span>
              <strong class="appointment-card__day">{{ card.dateParts.day }}</strong>
              <span class="appointment-card__month">{{ card.dateParts.monthYear }}</span>
              <span class="appointment-card__time">{{ card.dateParts.time }}</span>
            </div>

            <div class="appointment-card__content">
              <div class="appointment-card__head">
                <div class="appointment-card__head-copy">
                  <p class="appointment-card__eyebrow">{{ card.eyebrow }}</p>
                  <h2>{{ card.title }}</h2>
                  <p class="appointment-card__subtitle">{{ card.subtitle }}</p>
                </div>

                <div class="appointment-card__head-actions">
                  <span class="status-badge" :class="`tone-${card.statusTone}`">
                    {{ card.statusLabel }}
                  </span>
                  <v-icon class="appointment-card__chevron" size="20">mdi-chevron-right</v-icon>
                </div>
              </div>

              <div class="appointment-card__badges">
                <span v-for="badge in card.badges" :key="badge" class="info-badge">
                  {{ badge }}
                </span>
              </div>

              <div class="appointment-card__meta">
                <div v-for="item in card.metaItems" :key="`${card.id}-${item.label}`" class="meta-item">
                  <v-icon size="18" class="meta-item__icon">{{ item.icon }}</v-icon>
                  <div class="meta-item__copy">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div v-if="hasMoreVisibleAppointments" class="load-more-row">
          <button class="secondary-button load-more-button" type="button" @click="loadMoreAppointments">
            Mehr laden
          </button>
        </div>
      </section>
    </section>

    <div
      v-if="selectedAppointmentData"
      class="appointment-modal-backdrop"
      role="presentation"
      @click.self="closeAppointmentDetails"
    >
      <section class="appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
        <header class="appointment-modal__header">
          <div>
            <p class="modal-kicker">Termindetails</p>
            <h2 id="appointment-modal-title">{{ selectedAppointmentData.serviceLabel }}</h2>
            <p class="modal-subtitle">{{ selectedAppointmentData.dateLine }}</p>
          </div>

          <button class="modal-close" type="button" aria-label="Schließen" @click="closeAppointmentDetails">
            ×
          </button>
        </header>

        <div class="appointment-modal__summary">
          <div class="modal-date-card">
            <span class="modal-date-card__weekday">{{ selectedAppointmentData.dateParts.weekday }}</span>
            <strong class="modal-date-card__day">{{ selectedAppointmentData.dateParts.day }}</strong>
            <span class="modal-date-card__month">{{ selectedAppointmentData.dateParts.monthYear }}</span>
            <span class="modal-date-card__time">{{ selectedAppointmentData.dateParts.time }}</span>
          </div>

          <div class="modal-summary-copy">
            <div class="modal-summary-copy__head">
              <div>
                <p class="modal-summary-copy__eyebrow">{{ cardEyebrowLabel }}</p>
                <h3>{{ isDoctor ? selectedAppointmentData.patientName : selectedAppointmentData.doctorName }}</h3>
                <p>{{ selectedAppointmentData.doctorPractice }}</p>
              </div>
              <span class="status-badge" :class="`tone-${selectedAppointmentData.statusTone}`">
                {{ selectedAppointmentData.statusLabel }}
              </span>
            </div>

            <div class="modal-summary-tags">
              <span class="info-badge">{{ selectedAppointmentData.serviceLabel }}</span>
              <span class="info-badge info-badge--soft">{{ selectedAppointmentData.doctorSpecialty }}</span>
            </div>
          </div>
        </div>

        <div class="appointment-modal__grid">
          <section class="detail-panel">
            <h3>Termininformationen</h3>
            <dl class="detail-list">
              <div>
                <dt>Datum</dt>
                <dd>{{ selectedAppointmentData.dateLine }}</dd>
              </div>
              <div>
                <dt>Uhrzeit</dt>
                <dd>{{ selectedAppointmentData.timeRange }}</dd>
              </div>
              <div>
                <dt>Dauer</dt>
                <dd>{{ selectedAppointmentData.durationLabel || 'Unbekannt' }}</dd>
              </div>
              <div>
                <dt>Preis</dt>
                <dd>{{ selectedAppointmentData.priceLabel }}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span class="status-badge" :class="`tone-${selectedAppointmentData.statusTone}`">
                    {{ selectedAppointmentData.statusLabel }}
                  </span>
                </dd>
              </div>
              <div v-if="selectedAppointmentData.distanceLabel">
                <dt>Entfernung</dt>
                <dd>{{ selectedAppointmentData.distanceLabel }}</dd>
              </div>
              <div>
                <dt>Ort</dt>
                <dd>{{ selectedAppointmentData.locationLabel }}</dd>
              </div>
            </dl>
          </section>

          <section class="detail-panel">
            <h3>{{ isDoctor ? 'Patient' : 'Arzt' }}</h3>

            <div class="contact-block">
              <strong>{{ isDoctor ? selectedAppointmentData.patientName : selectedAppointmentData.doctorName }}</strong>
              <span>{{ isDoctor ? 'Patientendetails' : selectedAppointmentData.doctorPractice }}</span>
              <span>{{ isDoctor ? 'Gebuchte Sitzung' : selectedAppointmentData.doctorSpecialty }}</span>

              <div class="contact-links">
                <a v-if="!isDoctor && selectedAppointmentData.mapsUrl" :href="selectedAppointmentData.mapsUrl" target="_blank" rel="noopener noreferrer">
                  <v-icon size="18">mdi-map-marker</v-icon>
                  <span>Google Maps</span>
                </a>
                <a v-if="!isDoctor && selectedAppointmentData.doctorPhoneUrl" :href="selectedAppointmentData.doctorPhoneUrl">
                  <v-icon size="18">mdi-phone</v-icon>
                  <span>Telefon</span>
                </a>
                <a v-if="!isDoctor && selectedAppointmentData.doctorEmailUrl" :href="selectedAppointmentData.doctorEmailUrl">
                  <v-icon size="18">mdi-email</v-icon>
                  <span>E-Mail</span>
                </a>
                <a v-if="!isDoctor && selectedAppointmentData.doctorWebsiteUrl" :href="selectedAppointmentData.doctorWebsiteUrl" target="_blank" rel="noopener noreferrer">
                  <v-icon size="18">mdi-web</v-icon>
                  <span>Website</span>
                </a>
                <a v-if="isDoctor && selectedAppointmentData.patientPhoneUrl" :href="selectedAppointmentData.patientPhoneUrl">
                  <v-icon size="18">mdi-phone</v-icon>
                  <span>Patient anrufen</span>
                </a>
                <a v-if="isDoctor && selectedAppointmentData.patientEmailUrl" :href="selectedAppointmentData.patientEmailUrl">
                  <v-icon size="18">mdi-email</v-icon>
                  <span>Patient schreiben</span>
                </a>
              </div>
            </div>

            <div v-if="selectedAppointmentData.reason" class="hint-box">
              <h4>Hinweis</h4>
              <p>{{ selectedAppointmentData.reason }}</p>
            </div>

            <div v-if="canRateSelectedAppointment" class="rating-box">
              <h4>Bewertung</h4>
              <div class="rating-chip-row">
                <button
                  v-for="score in [5, 4, 3, 2, 1]"
                  :key="score"
                  type="button"
                  class="rating-chip"
                  :class="{ active: appointmentRating === score }"
                  @click="appointmentRating = score"
                >
                  {{ score }} ★
                </button>
                <button
                  type="button"
                  class="rating-chip rating-chip--clear"
                  :class="{ active: appointmentRating === null }"
                  @click="appointmentRating = null"
                >
                  Löschen
                </button>
              </div>

              <label class="rating-comment">
                <span>Kommentar</span>
                <textarea
                  v-model="appointmentRatingComment"
                  rows="3"
                  placeholder="Optionales Feedback zum Termin"
                />
              </label>

              <button class="primary-button" type="button" :disabled="isRatingSaving" @click="saveAppointmentRating">
                {{ isRatingSaving ? 'Speichern...' : 'Bewertung speichern' }}
              </button>
            </div>
          </section>
        </div>

        <footer class="appointment-modal__actions">
          <button class="secondary-button" type="button" @click="closeAppointmentDetails">Schließen</button>

          <button
            v-if="selectedAppointment && canCancelAppointment(selectedAppointment)"
            class="danger-button"
            type="button"
            @click="cancelAppointment(selectedAppointment)"
          >
            {{ isDoctor ? 'Termin absagen' : 'Termin stornieren' }}
          </button>

          <button
            v-if="selectedAppointment && canDeleteAppointment(selectedAppointment)"
            class="danger-outline-button"
            type="button"
            @click="deleteAppointment(selectedAppointment)"
          >
            Termin löschen
          </button>

          <button v-if="canOpenDoctorProfile()" class="secondary-button" type="button" @click="openDoctorProfile">
            Arztprofil öffnen
          </button>

          <button v-if="canOpenPatientProfile()" class="secondary-button" type="button" @click="openPatientProfile">
            Patientendetails öffnen
          </button>
        </footer>
      </section>
    </div>
  </main>

  <AppFooter />
</template>

<style scoped>
.appointments-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 40px 20px 56px;
  background:
    radial-gradient(circle at top left, rgba(21, 93, 252, 0.08), transparent 36%),
    linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
}

.appointments-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  width: min(1460px, 100%);
  margin: 0 auto;
}

.appointments-sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 128px);
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-gutter: stable;
}

.sidebar-card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #d8e3f7;
  border-radius: 22px;
  box-shadow: 0 12px 30px rgba(21, 31, 58, 0.05);
  backdrop-filter: blur(8px);
}

.sidebar-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.sidebar-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1f2a44;
  font-size: 16px;
  font-weight: 700;
}

.lookup-stack {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.lookup-field {
  display: grid;
  gap: 6px;
}

.lookup-field span {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.lookup-input-shell {
  position: relative;
}

.lookup-field input {
  width: 100%;
  min-height: 42px;
  padding: 0 42px 0 14px;
  color: #1f2a44;
  background: #f8fbff;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  outline: none;
}

.lookup-field input:focus {
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.12);
}

.lookup-clear-button {
  position: absolute;
  top: 50%;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: #155dfc;
  background: #fff;
  border: 1px solid rgba(21, 93, 252, 0.16);
  border-radius: 999px;
  cursor: pointer;
  transform: translateY(-50%);
}

.lookup-clear-button:hover {
  border-color: #155dfc;
}

.lookup-clear-button:focus-visible {
  outline: 2px solid rgba(21, 93, 252, 0.32);
  outline-offset: 2px;
}

.mini-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  background: #fff;
  color: #1f2a44;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.mini-button {
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
}

.icon-button {
  width: 34px;
}

.mini-button:hover,
.icon-button:hover {
  border-color: #155dfc;
  color: #155dfc;
  transform: translateY(-1px);
}

.calendar-header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.calendar-header strong {
  text-align: center;
  color: #1f2a44;
  font-size: 18px;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 8px;
  color: #64708a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.calendar-day {
  display: grid;
  place-items: center;
  gap: 4px;
  min-height: 42px;
  padding: 6px;
  color: #1f2a44;
  background: #f7f9fe;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.calendar-day:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #155dfc;
  background: #fff;
}

.calendar-day:disabled {
  cursor: default;
  opacity: 0.35;
}

.calendar-day.is-empty {
  background: transparent;
  border-color: transparent;
}

.calendar-day.is-today {
  border-color: rgba(21, 93, 252, 0.35);
}

.calendar-day.has-appointments {
  background: rgba(21, 93, 252, 0.08);
}

.calendar-day.is-selected {
  color: #fff;
  background: linear-gradient(135deg, #155dfc, #2f7bfd);
  border-color: #155dfc;
  box-shadow: 0 12px 24px rgba(21, 93, 252, 0.24);
}

.calendar-day__number {
  font-size: 14px;
  font-weight: 700;
}

.calendar-day__dot {
  width: 6px;
  height: 6px;
  background: #155dfc;
  border-radius: 999px;
}

.calendar-day.is-selected .calendar-day__dot {
  background: rgba(255, 255, 255, 0.92);
}

.filter-list {
  display: grid;
  gap: 10px;
}

.filter-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 13px 16px;
  color: #1f2a44;
  background: #f7f9fe;
  border: 1px solid #dce6f8;
  border-radius: 16px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.filter-pill:hover {
  border-color: #155dfc;
  transform: translateY(-1px);
}

.filter-pill.active {
  color: #155dfc;
  background: rgba(21, 93, 252, 0.08);
  border-color: rgba(21, 93, 252, 0.25);
}

.filter-pill strong {
  min-width: 24px;
  padding: 2px 8px;
  color: #64708a;
  background: #fff;
  border-radius: 999px;
  text-align: center;
}

.active-date-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 14px 16px;
  color: #1f2a44;
  background: #eef4ff;
  border-radius: 16px;
}

.active-date-chip span {
  display: block;
  color: #64708a;
  font-size: 12px;
}

.active-date-chip strong {
  font-size: 14px;
}

.chip-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #155dfc;
  background: #fff;
  border: 1px solid rgba(21, 93, 252, 0.12);
  border-radius: 999px;
  cursor: pointer;
}

.next-appointment {
  display: grid;
  gap: 8px;
  padding: 16px;
  color: #1f2a44;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  border: 1px solid rgba(21, 93, 252, 0.14);
  border-radius: 18px;
}

.next-appointment__date {
  margin: 0;
  color: #64708a;
  font-size: 13px;
  font-weight: 600;
}

.next-appointment strong {
  font-size: 18px;
}

.next-appointment span {
  color: #64708a;
  font-size: 14px;
}

.next-appointment small {
  color: #64708a;
  font-size: 13px;
}

.next-appointment--empty {
  color: #64708a;
  text-align: center;
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  color: #155dfc;
  background: #eef4ff;
  border: 1px solid rgba(21, 93, 252, 0.18);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.secondary-button:hover {
  transform: translateY(-1px);
  border-color: #155dfc;
  box-shadow: 0 10px 20px rgba(21, 93, 252, 0.12);
}

.appointments-main {
  min-width: 0;
  padding: 4px 0 0;
}

.appointments-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
  padding: 26px 28px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #d8e3f7;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(21, 31, 58, 0.05);
  backdrop-filter: blur(8px);
}

.eyebrow {
  margin: 0 0 10px;
  color: #64708a;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.appointments-hero h1 {
  margin: 0;
  color: #1f2a44;
  font-size: 34px;
  line-height: 1.1;
}

.appointments-hero p {
  margin: 12px 0 0;
  color: #64708a;
  font-size: 16px;
}

.role-pill {
  padding: 6px 12px;
  color: #155dfc;
  background: #eef4ff;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 18px;
  color: #fff;
  background: linear-gradient(135deg, #155dfc, #2f7bfd);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 12px 24px rgba(21, 93, 252, 0.24);
}

.primary-button:hover {
  transform: translateY(-1px);
}

.main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.toolbar-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  color: #1f2a44;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #d8e3f7;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.toolbar-chip--soft {
  color: #155dfc;
  background: #eef4ff;
  border-color: rgba(21, 93, 252, 0.18);
}

.toolbar-link {
  color: #155dfc;
  font-size: 14px;
  font-weight: 700;
  background: transparent;
  border: none;
  cursor: pointer;
}

.state-message,
.empty-state {
  padding: 28px;
  color: #64708a;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #d8e3f7;
  border-radius: 22px;
  box-shadow: 0 12px 30px rgba(21, 31, 58, 0.05);
}

.state-message--error {
  color: #b42318;
}

.empty-state {
  display: grid;
  gap: 10px;
  justify-items: start;
}

.empty-state h2 {
  margin: 0;
  color: #1f2a44;
  font-size: 22px;
}

.empty-state p {
  margin: 0;
}

.appointments-grid {
  display: grid;
  gap: 16px;
}

.load-more-row {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

.load-more-button {
  min-width: 180px;
}

.appointment-card {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: 18px;
  width: 100%;
  padding: 18px;
  color: inherit;
  text-align: left;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #d8e3f7;
  border-left-width: 5px;
  border-radius: 24px;
  box-shadow: 0 12px 28px rgba(21, 31, 58, 0.05);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  content-visibility: auto;
  contain-intrinsic-size: 260px;
}

.appointment-card:hover,
.appointment-card:focus-visible {
  transform: translateY(-2px);
  border-color: #155dfc;
  box-shadow: 0 16px 34px rgba(21, 93, 252, 0.12);
  outline: none;
}

.appointment-card.tone-success {
  border-left-color: #1f9d55;
}

.appointment-card.tone-info {
  border-left-color: #155dfc;
}

.appointment-card.tone-neutral {
  border-left-color: #64708a;
}

.appointment-card.tone-danger {
  border-left-color: #dc3545;
}

.appointment-card.tone-warning {
  border-left-color: #d97706;
}

.appointment-card__date {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 6px;
  padding: 14px 10px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
  border: 1px solid #e2eaf9;
  border-radius: 20px;
}

.appointment-card__weekday {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.appointment-card__day {
  color: #1f2a44;
  font-size: 40px;
  line-height: 1;
}

.appointment-card__month {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.appointment-card__time {
  color: #155dfc;
  font-size: 14px;
  font-weight: 700;
}

.appointment-card__content {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.appointment-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.appointment-card__head-copy {
  min-width: 0;
}

.appointment-card__eyebrow {
  margin: 0 0 6px;
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.appointment-card__head-copy h2 {
  margin: 0;
  color: #1f2a44;
  font-size: 22px;
  line-height: 1.2;
}

.appointment-card__subtitle {
  margin: 6px 0 0;
  color: #64708a;
  font-size: 14px;
}

.appointment-card__head-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.appointment-card__chevron {
  color: #93a4c0;
}

.appointment-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  color: #155dfc;
  background: rgba(21, 93, 252, 0.08);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.info-badge--soft {
  color: #64708a;
  background: #edf2fb;
}

.appointment-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  background: #f8fbff;
  border: 1px solid #e2eaf9;
  border-radius: 16px;
}

.meta-item__icon {
  margin-top: 2px;
  color: #155dfc;
  flex-shrink: 0;
}

.meta-item__copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.meta-item__copy span {
  color: #64708a;
  font-size: 12px;
}

.meta-item__copy strong {
  color: #1f2a44;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}

.appointment-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(6px);
}

.appointment-modal {
  width: min(1020px, 100%);
  max-height: min(90vh, 1040px);
  overflow: auto;
  padding: 24px;
  color: #1f2a44;
  background: #fff;
  border-radius: 26px;
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.25);
}

.appointment-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.modal-kicker {
  margin: 0 0 8px;
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.appointment-modal__header h2 {
  margin: 0;
  font-size: 28px;
}

.modal-subtitle {
  margin: 8px 0 0;
  color: #64708a;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #1f2a44;
  background: #f7f9fe;
  border: 1px solid #d8e3f7;
  border-radius: 999px;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
}

.appointment-modal__summary {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 20px;
  padding: 18px;
  background: #f8fbff;
  border: 1px solid #e2eaf9;
  border-radius: 22px;
}

.modal-date-card {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 6px;
  padding: 16px 10px;
  color: #1f2a44;
  background: linear-gradient(180deg, #eef4ff 0%, #ffffff 100%);
  border: 1px solid #d8e3f7;
  border-radius: 20px;
}

.modal-date-card__weekday {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.modal-date-card__day {
  font-size: 44px;
  line-height: 1;
}

.modal-date-card__month {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.modal-date-card__time {
  color: #155dfc;
  font-size: 14px;
  font-weight: 700;
}

.modal-summary-copy {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.modal-summary-copy__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.modal-summary-copy__eyebrow {
  margin: 0 0 6px;
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-summary-copy__head h3 {
  margin: 0;
  font-size: 24px;
}

.modal-summary-copy__head p {
  margin: 6px 0 0;
  color: #64708a;
}

.modal-summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.appointment-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

.detail-panel {
  display: grid;
  gap: 16px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e2eaf9;
  border-radius: 22px;
}

.detail-panel h3,
.detail-panel h4 {
  margin: 0;
  color: #1f2a44;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
  margin: 0;
}

.detail-list div {
  display: grid;
  gap: 4px;
}

.detail-list dt {
  color: #64708a;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-list dd {
  margin: 0;
  color: #1f2a44;
  font-size: 14px;
  line-height: 1.45;
}

.contact-block {
  display: grid;
  gap: 8px;
  padding: 18px;
  background: #f8fbff;
  border: 1px solid #e2eaf9;
  border-radius: 18px;
}

.contact-block strong {
  font-size: 18px;
}

.contact-block span {
  color: #64708a;
  font-size: 14px;
}

.contact-links {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}

.contact-links a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #155dfc;
  text-decoration: none;
  width: fit-content;
}

.contact-links a:hover {
  text-decoration: underline;
}

.hint-box {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  background: #fff8e6;
  border: 1px solid #f2d48a;
  border-radius: 18px;
}

.hint-box h4 {
  margin: 0;
  color: #7a4d00;
  font-size: 14px;
}

.hint-box p {
  margin: 0;
  color: #7a4d00;
  font-size: 14px;
}

.rating-box {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  background: #f8fbff;
  border: 1px solid #dce6f8;
  border-radius: 18px;
}

.rating-box h4 {
  margin: 0;
  color: #1f2a44;
  font-size: 14px;
}

.rating-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rating-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  color: #1f2a44;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 999px;
  cursor: pointer;
}

.rating-chip.active {
  color: #155dfc;
  background: rgba(21, 93, 252, 0.1);
  border-color: rgba(21, 93, 252, 0.35);
}

.rating-chip--clear {
  color: #64708a;
}

.rating-comment {
  display: grid;
  gap: 6px;
  color: #64708a;
  font-size: 13px;
}

.rating-comment textarea {
  width: 100%;
  min-height: 88px;
  padding: 12px 14px;
  color: #1f2a44;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 14px;
  resize: vertical;
}

.rating-comment textarea:focus {
  outline: none;
  border-color: #155dfc;
  box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.12);
}

.appointment-modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.danger-button,
.danger-outline-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.danger-button {
  color: #fff;
  background: #dc3545;
  border: 1px solid #dc3545;
}

.danger-outline-button {
  color: #dc3545;
  background: #fff;
  border: 1px solid #dc3545;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-badge.tone-success {
  color: #1f7a3d;
  background: #e7f7ec;
}

.status-badge.tone-info {
  color: #155dfc;
  background: #eaf1ff;
}

.status-badge.tone-neutral {
  color: #64708a;
  background: #edf2fb;
}

.status-badge.tone-danger {
  color: #b42318;
  background: #fee4e2;
}

.status-badge.tone-warning {
  color: #9a6700;
  background: #fff4d6;
}

@media (max-width: 1200px) {
  .appointments-shell {
    grid-template-columns: 1fr;
  }

  .appointments-sidebar {
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media (max-width: 900px) {
  .appointments-hero,
  .main-toolbar,
  .appointment-modal__header,
  .appointment-modal__summary,
  .appointment-modal__grid {
    grid-template-columns: 1fr;
  }

  .appointments-hero,
  .main-toolbar {
    display: grid;
  }

  .appointment-card {
    grid-template-columns: 1fr;
  }

  .appointment-card__date {
    justify-items: start;
  }

  .appointment-card__head,
  .modal-summary-copy__head,
  .appointment-modal__header {
    flex-direction: column;
  }

  .detail-list {
    grid-template-columns: 1fr;
  }

  .appointment-modal {
    padding: 18px;
  }
}

@media (max-width: 640px) {
  .appointments-page {
    padding-inline: 14px;
  }

  .appointments-hero {
    padding: 20px;
  }

  .appointments-hero h1 {
    font-size: 28px;
  }

  .appointment-card {
    padding: 16px;
  }

  .appointment-card__head-actions {
    align-items: flex-start;
  }

  .appointment-card__meta {
    grid-template-columns: 1fr;
  }

  .appointment-modal-backdrop {
    padding: 12px;
  }

  .appointment-modal__summary,
  .appointment-modal__grid {
    gap: 14px;
  }
}
</style>
