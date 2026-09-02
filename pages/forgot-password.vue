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

    successMessage.value = 'Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy instrukcję resetowania hasła.'
  }
  catch {
    errorMessage.value = 'Nie udało się teraz wysłać instrukcji resetowania.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Odzyskiwanie konta</p>
      <h1>Nie pamiętasz hasła?</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Wpisz adres e-mail, a wyślemy bezpieczny link do ustawienia nowego hasła.
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
        {{ isSubmitting ? 'Wysyłanie...' : 'Wyślij link do resetowania' }}
      </Button>
      <Button as="a" href="/login" variant="outline" class="w-full">Wróć do logowania</Button>
    </form>
  </div>
</template>
