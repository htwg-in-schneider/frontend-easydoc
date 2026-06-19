import type { Doctor } from '@/stores/doctors'

type DoctorAddressSource = Pick<Doctor, 'street' | 'postcode' | 'city' | 'country'>

function formatAddressParts(source: DoctorAddressSource): string[] {
  const line1 = source.street?.trim() || ''
  const line2 = [source.postcode?.trim(), source.city?.trim()].filter(Boolean).join(' ')
  const line3 = source.country?.trim() || ''

  return [line1, line2, line3].filter(Boolean)
}

export function formatDoctorAddress(source: DoctorAddressSource): string {
  return formatAddressParts(source).join(', ')
}

export function buildGoogleMapsUrl(source: DoctorAddressSource): string {
  const address = formatDoctorAddress(source)
  if (!address) return ''

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function buildTelUrl(phoneNumber: string | null | undefined): string {
  const normalized = phoneNumber?.trim().replace(/[^\d+]/g, '')
  return normalized ? `tel:${normalized}` : ''
}

export function buildMailtoUrl(email: string | null | undefined): string {
  const normalized = email?.trim()
  return normalized ? `mailto:${normalized}` : ''
}

export function toExternalUrl(url: string | null | undefined): string {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
