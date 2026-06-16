<!-- Minimal auth screen using the public layout shell. -->
<script setup lang="ts">
definePageMeta({
  layout: 'public',
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Welcome back</p>
      <h1>Sign in</h1>
    </div>
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="admin@sporting.pl" />
      </div>
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" placeholder="••••••••" />
      </div>
      <Button class="w-full">Continue</Button>
    </div>
  </div>
</template>
