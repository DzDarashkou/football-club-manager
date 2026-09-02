<!-- Public landing page that points to the design system test route and sample shells. -->
<script setup lang="ts">
definePageMeta({
  layout: 'public',
  public: true,
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">PWA dla młodzieżowej piłki nożnej</p>
      <h1>Sporting Wroclaw</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Podstawa systemu projektowego jest gotowa na kolejne ekrany aplikacji.
      </p>
    </div>

    <div class="grid gap-3">
      <Button as="a" href="/test-tokens">Otwórz prezentację tokenów</Button>
      <Button as="a" href="/dashboard" variant="outline">Otwórz widok rodzica</Button>
      <Button as="a" href="/admin" variant="outline">Otwórz widok administratora</Button>
    </div>
  </div>
</template>
