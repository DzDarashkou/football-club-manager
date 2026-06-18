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
      <p class="eyebrow text-brand-700">Youth Football PWA</p>
      <h1>Sporting Wroclaw</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        The design system foundation is in place and ready for feature screens.
      </p>
    </div>

    <div class="grid gap-3">
      <Button as="a" href="/test-tokens">Open token showcase</Button>
      <Button as="a" href="/dashboard" variant="outline">Open parent shell</Button>
      <Button as="a" href="/admin" variant="outline">Open admin shell</Button>
    </div>
  </div>
</template>
