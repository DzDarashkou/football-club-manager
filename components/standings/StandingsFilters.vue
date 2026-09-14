<script setup lang="ts">
import type { StandingsGroup, StandingsSetup } from '@@/types/standings'

defineProps<{ setup: StandingsSetup, groups: StandingsGroup[], disabled?: boolean }>()
const teamId = defineModel<string>('teamId', { required: true })
const groupId = defineModel<string>('groupId', { required: true })
const selectClass = 'min-h-11 w-full min-w-0 rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
</script>

<template>
  <div class="grid gap-4 md:grid-cols-[1fr_2fr]">
    <div class="min-w-0 space-y-2">
      <Label for="standings-team">Drużyna</Label>
      <select id="standings-team" v-model="teamId" :class="selectClass" :disabled="disabled">
        <option value="" disabled>Wybierz drużynę</option>
        <option v-for="team in setup.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
      </select>
    </div>
    <div class="min-w-0 space-y-2">
      <Label for="standings-group">Grupa rozgrywkowa i sezon</Label>
      <select id="standings-group" v-model="groupId" :class="selectClass" :disabled="disabled || !groups.length">
        <option value="" disabled>{{ groups.length ? 'Wybierz grupę' : 'Brak grup dla tej drużyny' }}</option>
        <option v-for="item in groups" :key="item.id" :value="item.id">{{ item.name }} · {{ setup.seasons.find(season => season.id === item.season_id)?.name }}</option>
      </select>
    </div>
  </div>
</template>
