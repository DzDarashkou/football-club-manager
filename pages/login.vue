<script setup lang="ts">
import { getRoleHome } from '@@/lib/auth'
import type { LoginCredentials } from '@@/types/auth'

definePageMeta({
  layout: 'public',
  public: true,
})

const router = useRouter()
const { authError, isInitializing, role, signInWithPassword } = useAppAuth()

const form = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const route = useRoute()

watchEffect(() => {
  if (route.query.reason === 'inactive') {
    errorMessage.value = 'Your account is inactive. Please contact the club administrator.'
    return
  }

  if (route.query.reset === 'success') {
    errorMessage.value = null
  }
})

async function handleSubmit() {
  errorMessage.value = null
  isSubmitting.value = true

  try {
    await signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })

    if (!role.value) {
      throw new Error('Missing role after sign-in.')
    }

    await router.push(getRoleHome(role.value))
  }
  catch {
    errorMessage.value = authError.value || 'Unable to sign in with that email and password.'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Welcome back</p>
      <h1>Sign in</h1>
    </div>
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="admin@sporting.pl"
          required
        />
      </div>
      <div class="space-y-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>
      <p v-if="errorMessage" class="text-label text-[var(--status-declined-text)]">
        {{ errorMessage }}
      </p>
      <p v-if="route.query.reset === 'success'" class="text-label text-[var(--status-confirmed-text)]">
        Your password has been updated. Please sign in with the new password.
      </p>
      <Button class="w-full" type="submit" :disabled="isSubmitting || isInitializing">
        {{ isSubmitting ? 'Signing in...' : 'Continue' }}
      </Button>
      <p class="text-center text-label text-[color:var(--color-text-secondary)]">
        <NuxtLink to="/forgot-password" class="font-medium text-brand-700 hover:text-brand-800">
          Forgot your password?
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
