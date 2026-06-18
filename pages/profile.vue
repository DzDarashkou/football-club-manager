<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  allowedRoles: ['parent', 'coach'],
})

const { profile } = useAppAuth()

const items = computed(() => [
  { label: 'Signed in as', value: profile.value?.email ?? 'Unknown' },
  { label: 'Current role', value: profile.value?.role ?? 'Unknown' },
])
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Account"
    title="Profile"
    description="Authenticated users can reach this protected profile area. Account editing and password changes remain out of scope for this phase."
    :items="items"
  />
</template>
