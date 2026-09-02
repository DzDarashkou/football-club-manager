<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()
const session = useSupabaseSession()

definePageMeta({
  layout: 'public',
  public: true,
})

const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const recoveryReady = ref(false)

const passwordError = computed(() => {
  if (!password.value) {
    return null
  }

  return password.value.length >= 8
    ? null
    : 'Hasło musi mieć co najmniej 8 znaków.'
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) {
    return null
  }

  return password.value === confirmPassword.value
    ? null
    : 'Hasła nie są takie same.'
})

const isFormValid = computed(() => !passwordError.value && !confirmPasswordError.value)

if (session.value) {
  recoveryReady.value = true
}

if (import.meta.client) {
  const { data: authSubscription } = client.auth.onAuthStateChange((event, currentSession) => {
    if (event === 'PASSWORD_RECOVERY' || currentSession) {
      recoveryReady.value = true
    }
  })

  onBeforeUnmount(() => {
    authSubscription.subscription.unsubscribe()
  })
}

async function handleSubmit() {
  errorMessage.value = null
  successMessage.value = null

  if (!recoveryReady.value) {
    errorMessage.value = 'Ten link do odzyskania hasła nie jest już aktywny. Poproś o nowy.'
    return
  }

  if (passwordError.value) {
    errorMessage.value = passwordError.value
    return
  }

  if (confirmPasswordError.value) {
    errorMessage.value = confirmPasswordError.value
    return
  }

  isSubmitting.value = true

  try {
    const { error } = await client.auth.updateUser({
      password: password.value,
    })

    if (error) {
      throw error
    }

    await client.auth.signOut()
    successMessage.value = 'Hasło zostało zmienione. Przekierowujemy do logowania...'
    await router.push('/login?reset=success')
  }
  catch {
    errorMessage.value = 'Nie udało się teraz zmienić hasła.'
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
      <h1>Ustaw nowe hasło</h1>
      <p class="mt-2 text-body text-[color:var(--color-text-secondary)]">
        Wybierz nowe hasło do swojego konta Sporting.
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <Label for="password">Nowe hasło</Label>
        <Input
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          placeholder="Co najmniej 8 znaków"
          minlength="8"
          required
        />
        <p v-if="passwordError" class="text-label text-[var(--status-declined-text)]">
          {{ passwordError }}
        </p>
      </div>
      <div class="space-y-2">
        <Label for="confirm_password">Potwierdź hasło</Label>
        <Input
          id="confirm_password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          placeholder="Powtórz hasło"
          required
        />
        <p v-if="confirmPasswordError" class="text-label text-[var(--status-declined-text)]">
          {{ confirmPasswordError }}
        </p>
      </div>
      <p v-if="successMessage" class="text-label text-[var(--status-confirmed-text)]">
        {{ successMessage }}
      </p>
      <p v-if="errorMessage" class="text-label text-[var(--status-declined-text)]">
        {{ errorMessage }}
      </p>
      <Button class="w-full" type="submit" :disabled="isSubmitting || !isFormValid">
        {{ isSubmitting ? 'Zapisywanie...' : 'Zmień hasło' }}
      </Button>
      <p class="text-center text-label text-[color:var(--color-text-secondary)]">
        Jeśli ten link wygasł, poproś o nową wiadomość odzyskiwania na ekranie logowania.
      </p>
    </form>
  </div>
</template>
