<script setup lang="ts">
import { getRoleHome } from '@@/lib/auth'
import type { AppRole, LoginCredentials } from '@@/types/auth'

definePageMeta({
  layout: 'public',
  public: true,
})

const router = useRouter()
const { authError, isInitializing, role, signInWithPassword, signOut } = useAppAuth()

const form = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const selectedRole = ref<Extract<AppRole, 'admin' | 'parent'> | null>(null)
const route = useRoute()

watchEffect(() => {
  if (route.query.reason === 'inactive') {
    errorMessage.value = 'Twoje konto jest nieaktywne. Skontaktuj się z administratorem klubu.'
    return
  }

  if (route.query.reset === 'success') {
    errorMessage.value = null
  }
})

async function handleSubmit() {
  if (!selectedRole.value) return

  errorMessage.value = null
  isSubmitting.value = true

  try {
    await signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })

    if (!role.value) {
      throw new Error('Brak roli po zalogowaniu.')
    }

    if (role.value !== selectedRole.value) {
      await signOut()
      errorMessage.value = `To konto nie ma dostępu w roli: ${selectedRole.value === 'admin' ? 'administrator' : 'rodzic'}.`
      return
    }

    await router.push(getRoleHome(role.value))
  }
  catch {
    errorMessage.value = authError.value || 'Nie udało się zalogować przy użyciu tego adresu e-mail i hasła.'
  }
  finally {
    isSubmitting.value = false
  }
}

function selectRole(value: Extract<AppRole, 'admin' | 'parent'>) {
  selectedRole.value = value
  errorMessage.value = null
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <p class="eyebrow text-brand-700">Witamy ponownie</p>
      <h1>Zaloguj się</h1>
    </div>
    <div v-if="!selectedRole" class="grid gap-3">
      <Button class="w-full" @click="selectRole('parent')">Logowanie rodzica</Button>
      <Button class="w-full" variant="outline" @click="selectRole('admin')">Logowanie administratora</Button>
    </div>
    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-[color:var(--color-text-primary)]">{{ selectedRole === 'parent' ? 'Logowanie rodzica' : 'Logowanie administratora' }}</p>
        <Button type="button" variant="ghost" size="sm" @click="selectedRole = null">Zmień rolę</Button>
      </div>
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
        <Label for="password">Hasło</Label>
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
        Twoje hasło zostało zmienione. Zaloguj się nowym hasłem.
      </p>
      <Button class="w-full" type="submit" :disabled="isSubmitting || isInitializing">
        {{ isSubmitting ? 'Logowanie...' : 'Kontynuuj' }}
      </Button>
      <p class="text-center text-label text-[color:var(--color-text-secondary)]">
        <NuxtLink to="/forgot-password" class="font-medium text-brand-700 hover:text-brand-800">
          Nie pamiętasz hasła?
        </NuxtLink>
      </p>
    </form>
  </div>
</template>
