<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({
  allowedRoles: ['admin', 'parent', 'coach'],
})

const { profile } = useAppAuth()

const items = computed(() => [
  { label: 'Zalogowano jako', value: profile.value?.email ?? 'Nieznany użytkownik' },
  { label: 'Aktualna rola', value: profile.value?.role ?? 'Nieznana' },
])
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Konto"
    title="Profil"
    description="Zalogowani użytkownicy mogą przejść do tej chronionej strefy profilu. Edycja konta i zmiana hasła nie są jeszcze dostępne."
    :items="items"
  />
</template>
