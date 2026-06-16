<!-- Password reset placeholder using the public layout shell. -->
<script setup lang="ts">
definePageMeta({
  layout: 'public',
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Account recovery</p>
      <h1>Forgot password</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Enter your email and we&apos;ll send reset instructions.
      </p>
    </div>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="recovery-email">Email</Label>
        <Input id="recovery-email" type="email" placeholder="parent@sporting.pl" />
      </div>
      <Button class="w-full">Send reset link</Button>
    </div>
  </div>
</template>
