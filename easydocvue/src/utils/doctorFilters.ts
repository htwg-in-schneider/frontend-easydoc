import type { Doctor, DoctorSearchFilters } from '@/stores/doctors'

function normalizeText(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeSelectionEntries(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []

  return [...new Set(
    rawValues
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter(Boolean),
  )]
}

export function normalizeSelection(value: unknown): string[] {
  return normalizeSelectionEntries(value)
}

export function buildDoctorQuery(filters: Pick<DoctorSearchFilters, 'doctorType' | 'city'>) {
  const query: Record<string, string | string[]> = {}
  const doctorTypes = normalizeSelection(filters.doctorType)
  const cities = normalizeSelection(filters.city)

  if (doctorTypes.length > 0) {
    query.doctorType = doctorTypes
  }

  if (cities.length > 0) {
    query.city = cities
  }

  return query
}

export function matchesDoctorFilters(doctor: Doctor, filters: DoctorSearchFilters) {
  const term = normalizeText(filters.name)
  const selectedTypes = normalizeSelection(filters.doctorType)
  const selectedCities = normalizeSelection(filters.city)
  const doctorTypeName = normalizeText(doctor.specialization?.name ?? doctor.doctorType?.name)
  const doctorTypeId = normalizeText(doctor.specialization?.id ?? doctor.doctorType?.id)
  const city = normalizeText(doctor.city)

  const matchesName =
    !term ||
    [
      doctor.firstName,
      doctor.lastName,
      doctor.practiceName,
      doctor.email,
      doctor.status,
      doctorTypeName,
    ]
      .filter(Boolean)
      .some((value) => normalizeText(value).includes(term))

  const matchesType =
    selectedTypes.length === 0 ||
    selectedTypes.some((selectedType) => {
      const normalized = normalizeText(selectedType)
      return normalized === doctorTypeName || normalized === doctorTypeId
    })

  const matchesCity =
    selectedCities.length === 0 ||
    selectedCities.some((selectedCity) => normalizeText(selectedCity) === city)

  const matchesRating =
    filters.minRating === undefined ||
    filters.minRating === null ||
    doctor.rating === null ||
    doctor.rating >= filters.minRating

  const matchesDistance =
    filters.maxDistance === undefined ||
    filters.maxDistance === null ||
    doctor.distance === null ||
    doctor.distance <= filters.maxDistance

  return matchesName && matchesType && matchesCity && matchesRating && matchesDistance
}
