import { formatDoctorName, getDoctorTypeName, type Appointment, type Doctor, type UserSummary } from '@/stores/doctors'
import { buildGoogleMapsUrl, buildMailtoUrl, buildTelUrl, formatDoctorAddress, toExternalUrl } from '@/utils/doctorContact'

export type AppointmentStatusTone = 'success' | 'info' | 'neutral' | 'danger' | 'warning'

const CLOCK_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

const DATE_LINE_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const CARD_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
})

const MONTH_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  month: 'short',
  year: 'numeric',
})

const DAY_FORMATTER = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
})

function toDate(value: string | Date): Date {
  return value instanceof Date ? new Date(value.getTime()) : new Date(value)
}

function normalizeStatus(status?: string | null): string {
  return (status ?? '').trim().toUpperCase()
}

export function appointmentDateKey(value: string | Date): string {
  const date = toDate(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatAppointmentDateParts(value: string | Date) {
  const date = toDate(value)
  const weekday = CARD_WEEKDAY_FORMATTER.format(date).toUpperCase()
  const day = DAY_FORMATTER.format(date)
  const month = MONTH_FORMATTER.format(date).replace(/\./g, '').toUpperCase()
  const time = CLOCK_FORMATTER.format(date)

  return {
    weekday,
    day,
    monthYear: month,
    time,
  }
}

export function formatAppointmentDateLine(value: string | Date) {
  return DATE_LINE_FORMATTER.format(toDate(value))
}

export function formatAppointmentTimeRange(startDateTime: string, endDateTime: string) {
  return `${CLOCK_FORMATTER.format(toDate(startDateTime))} – ${CLOCK_FORMATTER.format(toDate(endDateTime))}`
}

export function getAppointmentDurationMinutes(startDateTime: string, endDateTime: string) {
  const start = toDate(startDateTime).getTime()
  const end = toDate(endDateTime).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
  return Math.round((end - start) / 60000)
}

export function formatDurationMinutes(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return ''
  return `${minutes} Min.`
}

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getAppointmentDoctor(appointment: Appointment): Doctor | null {
  return appointment.doctor ?? null
}

export function getAppointmentPatient(appointment: Appointment): UserSummary | null {
  return appointment.patient ?? appointment.user ?? null
}

export function getAppointmentService(appointment: Appointment) {
  return appointment.service ?? appointment.dienstleistung ?? null
}

export function getAppointmentDoctorName(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? formatDoctorName(doctor) || 'Arzt unbekannt' : 'Arzt unbekannt'
}

export function getAppointmentDoctorPractice(appointment: Appointment) {
  return getAppointmentDoctor(appointment)?.practiceName?.trim() || 'Praxis unbekannt'
}

export function getAppointmentDoctorSpecialty(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return getDoctorTypeName(doctor?.doctorType ?? doctor?.specialization)
}

export function getAppointmentPatientName(appointment: Appointment) {
  const patient = getAppointmentPatient(appointment)
  return [patient?.firstName, patient?.lastName].filter(Boolean).join(' ') || 'Patient unbekannt'
}

export function getAppointmentPatientContact(appointment: Appointment) {
  const patient = getAppointmentPatient(appointment)
  return {
    phoneNumber: patient?.phoneNumber ?? null,
    email: patient?.email ?? null,
  }
}

export function getAppointmentPatientPhoneUrl(appointment: Appointment) {
  const patient = getAppointmentPatient(appointment)
  return patient?.phoneNumber ? buildTelUrl(patient.phoneNumber) : ''
}

export function getAppointmentPatientEmailUrl(appointment: Appointment) {
  const patient = getAppointmentPatient(appointment)
  return patient?.email ? buildMailtoUrl(patient.email) : ''
}

export function getAppointmentServiceLabel(appointment: Appointment) {
  const service = getAppointmentService(appointment)
  return service?.bezeichnung?.trim() || service?.name?.trim() || appointment.reason?.trim() || 'Dienstleistung unbekannt'
}

export function getAppointmentServicePrice(appointment: Appointment) {
  const service = getAppointmentService(appointment)
  return service?.preis ?? appointment.price ?? null
}

export function getAppointmentPriceLabel(appointment: Appointment) {
  return formatPrice(getAppointmentServicePrice(appointment))
}

export function getAppointmentLocationLabel(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? formatDoctorAddress(doctor) : 'Adresse nicht hinterlegt'
}

export function getAppointmentDistanceLabel(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  if (!doctor || doctor.distance === null || doctor.distance === undefined) return ''

  return `${new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 1,
  }).format(doctor.distance)} km entfernt`
}

export function getAppointmentMapsUrl(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? buildGoogleMapsUrl(doctor) : ''
}

export function getAppointmentPhoneUrl(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? buildTelUrl(doctor.phoneNumber) : ''
}

export function getAppointmentEmailUrl(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? buildMailtoUrl(doctor.email) : ''
}

export function getAppointmentWebsiteUrl(appointment: Appointment) {
  const doctor = getAppointmentDoctor(appointment)
  return doctor ? toExternalUrl(doctor.website) : ''
}

export function appointmentStatusTone(status?: string | null): AppointmentStatusTone {
  switch (normalizeStatus(status)) {
    case 'BOOKED':
      return 'success'
    case 'GEPLANT':
    case 'PLANNED':
      return 'info'
    case 'COMPLETED':
    case 'ABGESCHLOSSEN':
      return 'neutral'
    case 'CANCELLED':
    case 'CANCELED':
    case 'STORNIERT':
      return 'danger'
    default:
      return 'warning'
  }
}

export function appointmentStatusLabel(status?: string | null) {
  switch (normalizeStatus(status)) {
    case 'BOOKED':
      return 'BOOKED'
    case 'GEPLANT':
    case 'PLANNED':
      return 'GEPLANT'
    case 'COMPLETED':
    case 'ABGESCHLOSSEN':
      return 'ABGESCHLOSSEN'
    case 'CANCELLED':
    case 'CANCELED':
    case 'STORNIERT':
      return 'STORNIERT'
    default:
      return normalizeStatus(status) || 'UNBEKANNT'
  }
}

export function isAppointmentCancelled(appointment: Pick<Appointment, 'status'>) {
  const normalized = normalizeStatus(appointment.status)
  return normalized === 'CANCELLED' || normalized === 'CANCELED' || normalized === 'STORNIERT'
}

export function isAppointmentCompleted(appointment: Pick<Appointment, 'status' | 'endDateTime'>) {
  const normalized = normalizeStatus(appointment.status)
  return normalized === 'COMPLETED' || normalized === 'ABGESCHLOSSEN'
}

export function isAppointmentUpcoming(appointment: Pick<Appointment, 'status' | 'startDateTime' | 'endDateTime'>, referenceDate = new Date()) {
  if (isAppointmentCancelled(appointment) || isAppointmentCompleted(appointment)) return false
  return toDate(appointment.startDateTime).getTime() >= referenceDate.getTime()
}
