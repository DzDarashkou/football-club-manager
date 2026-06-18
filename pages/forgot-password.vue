<script setup lang="ts">
definePageMeta({
  layout: 'public',
  public: true,
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Account recovery</p>
      <h1>Forgot password</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Password reset will be added in a later phase. For now, please contact a club administrator to regain access.
      </p>
    </div>
    <div class="space-y-4">
      <Button as="a" href="/login" class="w-full">Back to sign in</Button>
    </div>
  </div>
</template>
