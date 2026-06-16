<!-- Minimal public layout used by auth-style screens with a centered brand card. -->
<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-sunken px-4 py-10">
    <div class="w-full max-w-md">
      <div class="mb-6 flex justify-center">
        <ClubLogo variant="full" :inverted="false" />
      </div>
      <div class="card">
        <slot />
      </div>
    </div>
  </div>
</template>
