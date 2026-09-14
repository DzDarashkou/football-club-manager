import type { StandingsSetup } from '@@/types/standings'

export async function useStandingsSelection() {
  const route = useRoute()
  const { data, pending, error, refresh } = await useFetch<StandingsSetup>('/api/standings/setup', {
    default: () => ({ teams: [], seasons: [], groups: [] }),
  })
  const initialGroup = data.value.groups.find(group => group.id === route.query.group)
  const teamId = ref(initialGroup?.team_id ?? data.value.teams.find(team => data.value.groups.some(group => group.team_id === team.id))?.id ?? data.value.teams[0]?.id ?? '')
  const groupId = ref(initialGroup?.id ?? '')
  const groups = computed(() => data.value.groups.filter(group => group.team_id === teamId.value))
  const group = computed(() => groups.value.find(item => item.id === groupId.value))
  watch(groups, (items) => {
    if (!items.some(item => item.id === groupId.value)) groupId.value = items[0]?.id ?? ''
  }, { immediate: true, flush: 'sync' })
  return { setup: data, setupPending: pending, setupError: error, refreshSetup: refresh, teamId, groupId, groups, group }
}
