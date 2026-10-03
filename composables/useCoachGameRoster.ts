import { toValue, type MaybeRefOrGetter } from 'vue'
import type { GamePlayer } from '@@/types/admin-club'

export function useCoachGameRoster(gameId: string, canManageGame: MaybeRefOrGetter<boolean>) {
  const requestFetch = useRequestFetch()

  return useAsyncData<{ players: GamePlayer[] }>(`coach-game-roster:${gameId}`, async () => {
    // Global resume refreshes also run requests created with immediate: false.
    // Check the current role on every execution, before calling the coach API.
    if (!toValue(canManageGame)) return { players: [] }

    return requestFetch<{ players: GamePlayer[] }>(`/api/coach/games/${gameId}/players`)
  }, {
    default: () => ({ players: [] }),
    immediate: toValue(canManageGame),
    watch: [() => toValue(canManageGame)],
  })
}
