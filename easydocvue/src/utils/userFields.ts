export type UserStatus = 'ACTIVE' | 'INACTIVE'

export type UserTitle = 'NONE' | 'DR' | 'DR_MED' | 'PROF' | 'PROF_DR' | 'PROF_DR_MED'

export interface LabeledOption<T extends string> {
  value: T
  label: string
}

export const userStatusOptions: LabeledOption<UserStatus>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const userTitleOptions: LabeledOption<UserTitle>[] = [
  { value: 'NONE', label: 'Kein Titel' },
  { value: 'DR', label: 'Dr.' },
  { value: 'DR_MED', label: 'Dr. med.' },
  { value: 'PROF', label: 'Prof.' },
  { value: 'PROF_DR', label: 'Prof. Dr.' },
  { value: 'PROF_DR_MED', label: 'Prof. Dr. med.' },
]

function normalizeLegacyEnumToken(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/\s+/g, '')
}

export function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === null || value === undefined || value === '') return null
  const token = typeof value === 'string' ? normalizeLegacyEnumToken(value) : String(value).trim().toUpperCase()
  if (token === 'ACTIVE') return 'ACTIVE'
  if (token === 'INACTIVE') return 'INACTIVE'
  return null
}

export function normalizeUserTitle(value: unknown): UserTitle {
  if (value === null || value === undefined || value === '') return 'NONE'

  const token = typeof value === 'string' ? normalizeLegacyEnumToken(value) : String(value).trim().toUpperCase()
  switch (token) {
    case 'NONE':
    case 'KEINTITEL':
      return 'NONE'
    case 'DR':
      return 'DR'
    case 'DRMED':
      return 'DR_MED'
    case 'PROF':
      return 'PROF'
    case 'PROFDR':
      return 'PROF_DR'
    case 'PROFDRMED':
      return 'PROF_DR_MED'
    default:
      return 'NONE'
  }
}

export function formatUserStatusLabel(value: unknown) {
  switch (normalizeUserStatus(value)) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    default:
      return 'Nicht hinterlegt'
  }
}

export function formatUserTitleLabel(value: unknown) {
  switch (normalizeUserTitle(value)) {
    case 'DR':
      return 'Dr.'
    case 'DR_MED':
      return 'Dr. med.'
    case 'PROF':
      return 'Prof.'
    case 'PROF_DR':
      return 'Prof. Dr.'
    case 'PROF_DR_MED':
      return 'Prof. Dr. med.'
    case 'NONE':
    default:
      return 'Kein Titel'
  }
}

export function formatUserName(
  user: {
    title?: UserTitle | string | null
    firstName?: string | null
    lastName?: string | null
    name?: string | null
  },
) {
  const parts: string[] = []
  const title = normalizeUserTitle(user.title)
  if (title !== 'NONE') {
    parts.push(formatUserTitleLabel(title))
  }

  const firstName = user.firstName?.trim()
  const lastName = user.lastName?.trim()
  if (firstName) parts.push(firstName)
  if (lastName) parts.push(lastName)

  if (parts.length === 0 && user.name?.trim()) {
    parts.push(user.name.trim())
  }

  return parts.join(' ').trim()
}
