import type { z } from 'zod'
import type { standingsTableSchema } from '@@/validators/standings'

export type StandingsTable = z.infer<typeof standingsTableSchema>
export interface StandingsGroup {
  id: string
  team_id: string
  season_id: string
  name: string
  external_play_id: string | null
}
export interface StandingsSetup {
  teams: Array<{ id: string, name: string }>
  seasons: Array<{ id: string, name: string }>
  groups: StandingsGroup[]
}
export interface StandingsSnapshot {
  id: string
  group_id: string
  imported_at: string
  imported_by: string | null
  external_team_id: string
  table_data: StandingsTable
}
export interface StandingsHistory {
  snapshots: Array<Pick<StandingsSnapshot, 'id' | 'imported_at'>>
  hasMore: boolean
}
