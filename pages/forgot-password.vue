<script setup lang="ts">
const client = useSupabaseClient()

definePageMeta({
  layout: 'public',
  public: true,
})

const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

async function handleSubmit() {
  errorMessage.value = null
  successMessage.value = null
  isSubmitting.value = true

  try {
    const redirectTo = new URL('/update-password', window.location.origin).toString()
    const { error } = await client.auth.resetPasswordForEmail(email.value.trim().toLowerCase(), { redirectTo })

    if (error) {
      throw error
    }

    successMessage.value = 'Password reset instructions have been sent if an account exists for that email.'
  }
  catch {
    errorMessage.value = 'Unable to send reset instructions right now.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Account recovery</p>
      <h1>Forgot password</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Enter your email and we will send a secure link so you can set a new password.
      </p>
    </div>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" autocomplete="email" placeholder="parent@sporting.pl" required />
      </div>
      <p v-if="successMessage" class="text-label text-[var(--status-confirmed-text)]">
        {{ successMessage }}
      </p>
      <p v-if="errorMessage" class="text-label text-[var(--status-declined-text)]">
        {{ errorMessage }}
      </p>
      <Button class="w-full" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Sending...' : 'Send reset link' }}
      </Button>
      <Button as="a" href="/login" variant="outline" class="w-full">Back to sign in</Button>
    </form>
  </div>
</template>
