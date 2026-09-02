import type { AvailabilityStatus, CompetitionType, GameLocationType, GameStatus, SelectionStatus } from '@@/types/admin-club'
import type { AppRole, AppUserStatus } from '@@/types/auth'

/** Presentation-only Polish labels. Persisted enum values remain language-neutral. */
const availabilityLabels: Record<AvailabilityStatus, string> = {
  pending: 'Oczekuje na odpowiedź',
  available: 'Dostępny',
  unavailable: 'Niedostępny',
}

const gameStatusLabels: Record<GameStatus, string> = {
  scheduled: 'Zaplanowany',
  completed: 'Zakończony',
  postponed: 'Przełożony',
  cancelled: 'Odwołany',
}

const locationLabels: Record<GameLocationType, string> = {
  home: 'U siebie',
  away: 'Na wyjeździe',
  neutral: 'Teren neutralny',
}

const competitionTypeLabels: Record<CompetitionType, string> = {
  league: 'Liga',
  cup: 'Puchar',
  friendly: 'Towarzyskie',
  tournament: 'Turniej',
}

const selectionLabels: Record<SelectionStatus, string> = {
  selected: 'Wybrany',
  started: 'W pierwszym składzie',
  substitute: 'Rezerwowy',
  not_selected: 'Niewybrany',
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  coach: 'Trener',
  parent: 'Rodzic',
}

const userStatusLabels: Record<AppUserStatus, string> = {
  active: 'Aktywne',
  inactive: 'Nieaktywne',
}

export function usePolishLocale() {
  const date = (value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
    new Intl.DateTimeFormat('pl-PL', options).format(new Date(value))

  const dateTime = (value: string | Date) => date(value, { dateStyle: 'medium', timeStyle: 'short' })
  const time = (value: string | Date) => date(value, { hour: '2-digit', minute: '2-digit' })
  const month = (value: string | Date) => date(value, { month: 'long', year: 'numeric' })
  const fullDateTime = (value: string | Date) => date(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const dayDate = (value: string | Date) => date(value, { weekday: 'long', day: 'numeric', month: 'long' })

  return {
    date,
    dateTime,
    time,
    month,
    fullDateTime,
    dayDate,
    availabilityLabel: (value: AvailabilityStatus) => availabilityLabels[value],
    gameStatusLabel: (value: GameStatus) => gameStatusLabels[value],
    locationLabel: (value: GameLocationType) => locationLabels[value],
    competitionTypeLabel: (value: CompetitionType) => competitionTypeLabels[value],
    selectionLabel: (value: SelectionStatus) => selectionLabels[value],
    roleLabel: (value: AppRole) => roleLabels[value],
    userStatusLabel: (value: AppUserStatus) => userStatusLabels[value],
  }
}
