<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import type { QuizLeaderboardEntry } from '@@/types/quiz'

defineProps<{ entries: QuizLeaderboardEntry[] }>()
</script>

<template>
  <section class="card" aria-labelledby="leaderboard-heading">
    <div class="flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-status-pending-bg text-status-pending-text">
        <Trophy class="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p class="eyebrow text-brand-700">Klubowy quiz</p>
        <h2 id="leaderboard-heading">Najlepsza 10</h2>
      </div>
    </div>

    <ol v-if="entries.length" class="mt-4 divide-y divide-border">
      <li v-for="(entry, index) in entries" :key="entry.id" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-medium text-brand-800">
          {{ index + 1 }}
        </span>
        <span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{{ entry.display_name }}</span>
        <span class="text-sm font-medium text-brand-700">{{ entry.score }} pkt</span>
      </li>
    </ol>
    <p v-else class="mt-4 text-sm text-[color:var(--color-text-secondary)]">
      Zagraj jako pierwszy i zapisz swój wynik!
    </p>
  </section>
</template>
