<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ShieldAlert, Trash2, UserPlus, UserRoundPen } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
import type {
  AdminManagedUser,
  AdminUserListRoleFilter,
  AdminUserListStatusFilter,
  AdminUserMutationResponse,
  AdminUserUpsertInput,
  AdminUsersListResponse,
} from '@@/types/admin-users'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({
  allowedRoles: ['admin'],
})

type ConfirmAction =
  | { type: 'delete', user: AdminManagedUser }
  | { type: 'status', user: AdminManagedUser, nextStatus: 'active' | 'inactive' }
  | null

const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const searchInput = ref('')
const search = ref('')
const roleFilter = ref<AdminUserListRoleFilter>('all')
const statusFilter = ref<AdminUserListStatusFilter>('all')
const selectedUserId = ref<string | null>(null)
const isCreateMode = ref(true)
const isSubmitting = ref(false)
const actionUserId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const pageSuccess = ref<string | null>(null)
const confirmAction = ref<ConfirmAction>(null)
const { roleLabel } = usePolishLocale()

const form = reactive<AdminUserUpsertInput>({
  email: '',
  full_name: '',
  role: 'parent',
  status: 'active',
})

watchDebounced(searchInput, (value) => {
  search.value = value.trim()
}, { debounce: 300, maxWait: 900 })

const query = computed(() => ({
  q: search.value,
  role: roleFilter.value,
  status: statusFilter.value,
}))

const { data, pending, error, refresh } = await useFetch<AdminUsersListResponse>('/api/admin/users', {
  query,
  default: () => ({ users: [] }),
})

const users = computed(() => data.value?.users ?? [])

const selectedUser = computed(() => (
  selectedUserId.value
    ? users.value.find((user) => user.id === selectedUserId.value) ?? null
    : null
))

const emptyStateMessage = computed(() => {
  if (pending.value) {
    return 'Wczytywanie użytkowników...'
  }

  if (users.value.length > 0) {
    return null
  }

  if (search.value || roleFilter.value !== 'all' || statusFilter.value !== 'all') {
    return 'Żaden użytkownik nie spełnia bieżących kryteriów wyszukiwania i filtrów.'
  }

  return 'Nie utworzono jeszcze kont rodziców ani trenerów.'
})

watch(selectedUser, (user) => {
  if (!user || isCreateMode.value) {
    return
  }

  fillForm(user)
}, { immediate: true })

watch(error, (value) => {
  pageError.value = value?.data?.statusMessage || value?.message || null
})

function fillForm(user: AdminManagedUser) {
  form.email = user.email
  form.full_name = user.full_name ?? ''
  form.role = user.role
  form.status = user.status
}

function resetForm() {
  form.email = ''
  form.full_name = ''
  form.role = 'parent'
  form.status = 'active'
}

function openCreateForm() {
  isCreateMode.value = true
  selectedUserId.value = null
  pageError.value = null
  pageSuccess.value = null
  resetForm()
}

function openEditForm(user: AdminManagedUser) {
  isCreateMode.value = false
  selectedUserId.value = user.id
  pageError.value = null
  pageSuccess.value = null
  fillForm(user)
}

async function submitForm() {
  pageError.value = null
  pageSuccess.value = null
  isSubmitting.value = true

  try {
    const payload = {
      email: form.email.trim().toLowerCase(),
      full_name: form.full_name.trim(),
      role: form.role,
      status: form.status,
    } satisfies AdminUserUpsertInput

    if (isCreateMode.value) {
      const response = await $fetch<AdminUserMutationResponse>('/api/admin/users', {
        method: 'POST',
        body: payload,
      })

      pageSuccess.value = response.setupEmailSent
        ? 'Użytkownik został utworzony, a wiadomość do ustawienia hasła została wysłana.'
        : 'Użytkownik został utworzony, ale nie udało się jeszcze wysłać wiadomości do ustawienia hasła.'

      if (!response.setupEmailSent && response.setupEmailError) {
        pageError.value = response.setupEmailError
      }

      openEditForm(response.user)
    }
    else if (selectedUserId.value) {
      const response = await $fetch<AdminUserMutationResponse>(`/api/admin/users/${selectedUserId.value}`, {
        method: 'PATCH',
        body: payload,
      })

      pageSuccess.value = 'Użytkownik został zaktualizowany.'
      openEditForm(response.user)
    }

    await refresh()
  }
  catch (fetchError) {
    const details = fetchError as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Nie udało się zapisać użytkownika.'
  }
  finally {
    isSubmitting.value = false
  }
}

async function sendSetupEmail(user: AdminManagedUser) {
  pageError.value = null
  pageSuccess.value = null
  actionUserId.value = user.id

  try {
    await $fetch(`/api/admin/users/${user.id}/send-setup`, {
      method: 'POST',
    })

    pageSuccess.value = `Wiadomość do ustawienia hasła została wysłana na adres ${user.email}.`
  }
  catch (fetchError) {
    const details = fetchError as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Nie udało się wysłać wiadomości do ustawienia hasła.'
  }
  finally {
    actionUserId.value = null
  }
}

async function applyStatusChange(user: AdminManagedUser, nextStatus: 'active' | 'inactive') {
  pageError.value = null
  pageSuccess.value = null
  actionUserId.value = user.id

  try {
    const response = await $fetch<AdminUserMutationResponse>(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      body: {
        status: nextStatus,
      },
    })

    pageSuccess.value = nextStatus === 'inactive'
      ? `Konto ${user.email} zostało dezaktywowane.`
      : `Konto ${user.email} zostało ponownie aktywowane.`

    if (selectedUserId.value === user.id) {
      openEditForm(response.user)
    }

    await refresh()
  }
  catch (fetchError) {
    const details = fetchError as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Nie udało się zaktualizować statusu użytkownika.'
  }
  finally {
    actionUserId.value = null
    confirmAction.value = null
  }
}

async function deleteUser(user: AdminManagedUser) {
  pageError.value = null
  pageSuccess.value = null
  actionUserId.value = user.id

  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE',
    })

    if (selectedUserId.value === user.id) {
      openCreateForm()
    }

    pageSuccess.value = `Konto ${user.email} zostało trwale usunięte.`
    await refresh()
  }
  catch (fetchError) {
    const details = fetchError as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Nie udało się usunąć użytkownika.'
  }
  finally {
    actionUserId.value = null
    confirmAction.value = null
  }
}

async function confirmCurrentAction() {
  if (!confirmAction.value) {
    return
  }

  if (confirmAction.value.type === 'delete') {
    await deleteUser(confirmAction.value.user)
    return
  }

  await applyStatusChange(confirmAction.value.user, confirmAction.value.nextStatus)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusBadge(user: AdminManagedUser) {
  return user.status === 'active'
    ? { label: 'Aktywne', tone: 'confirmed' as const }
    : { label: 'Nieaktywne', tone: 'neutral' as const }
}

const editorTitle = computed(() => isCreateMode.value ? 'Utwórz użytkownika' : 'Edytuj użytkownika')
const editorDescription = computed(() => (
  isCreateMode.value
    ? 'Utwórz konto trenera lub rodzica i wyślij wiadomość do ustawienia hasła.'
    : 'Zaktualizuj dane konta, zmień status dostępu lub wyślij wiadomość do ustawienia hasła ponownie.'
))
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-2">
        <p class="eyebrow text-brand-700">Strefa administratora</p>
        <h1>Użytkownicy</h1>
        <p class="max-w-2xl text-body text-[color:var(--color-text-secondary)]">
          Twórz i zarządzaj kontami rodziców oraz trenerów, kontroluj dostęp i wysyłaj wiadomości do ustawienia hasła ponownie.
        </p>
      </div>
      <Button class="gap-2" @click="openCreateForm">
        <UserPlus class="h-4 w-4" />
        Utwórz użytkownika
      </Button>
    </div>

    <div v-if="pageSuccess" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] px-4 py-3 text-sm text-[var(--status-confirmed-text)]">
      {{ pageSuccess }}
    </div>
    <div v-if="pageError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] px-4 py-3 text-sm text-[var(--status-declined-text)]">
      {{ pageError }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
      <div class="space-y-6">
        <Card class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2>Katalog</h2>
              <p class="mt-1 text-label text-[color:var(--color-text-secondary)]">
                Wyszukuj po adresie e-mail lub imieniu i nazwisku oraz filtruj według roli i statusu konta.
              </p>
            </div>
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <div class="md:col-span-2">
              <Label for="user-search">Szukaj</Label>
              <Input id="user-search" v-model="searchInput" placeholder="Szukaj po adresie e-mail lub imieniu i nazwisku" />
            </div>
            <div>
              <Label for="role-filter">Rola</Label>
              <select id="role-filter" v-model="roleFilter" :class="selectClass">
                <option value="all">Wszystkie role</option>
                <option value="parent">Rodzice</option>
                <option value="coach">Trenerzy</option>
              </select>
            </div>
            <div class="md:col-span-3">
              <Label for="status-filter">Status</Label>
              <select id="status-filter" v-model="statusFilter" :class="selectClass">
                <option value="all">Wszystkie statusy</option>
                <option value="active">Aktywne</option>
                <option value="inactive">Nieaktywne</option>
              </select>
            </div>
          </div>
        </Card>

        <Card class="overflow-hidden p-0">
          <div class="border-b border-border px-4 py-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2>Konta</h2>
                <p class="mt-1 text-label text-[color:var(--color-text-secondary)]">
                  Liczba zarządzanych kont: {{ users.length }}
                </p>
              </div>
              <Badge variant="secondary">{{ pending ? 'Odświeżanie' : 'Aktualne' }}</Badge>
            </div>
          </div>

          <div v-if="emptyStateMessage" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">
            {{ emptyStateMessage }}
          </div>

          <div
            v-for="user in users"
            :key="user.id"
            class="border-b border-border px-4 py-5 last:border-b-0"
            :class="selectedUserId === user.id && !isCreateMode ? 'bg-brand-50/50' : ''"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="min-w-0 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-base font-medium text-[color:var(--color-text-primary)]">
                    {{ user.full_name || 'Brak imienia i nazwiska' }}
                  </p>
                  <Badge :status="getStatusBadge(user).tone">{{ getStatusBadge(user).label }}</Badge>
                  <Badge variant="outline">{{ roleLabel(user.role) }}</Badge>
                </div>
                <div class="space-y-1 text-sm text-[color:var(--color-text-secondary)]">
                  <p class="truncate">{{ user.email }}</p>
                  <p>Utworzono: {{ formatDate(user.created_at) }}</p>
                  <p>Zaktualizowano: {{ formatDate(user.updated_at) }}</p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" class="gap-2" @click="openEditForm(user)">
                  <UserRoundPen class="h-4 w-4" />
                  Edytuj
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="actionUserId === user.id"
                  @click="sendSetupEmail(user)"
                >
                  {{ actionUserId === user.id ? 'Wysyłanie...' : 'Wyślij wiadomość do ustawienia hasła' }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-[color:var(--color-text-secondary)]"
                  :disabled="actionUserId === user.id"
                  @click="confirmAction = { type: 'status', user, nextStatus: user.status === 'active' ? 'inactive' : 'active' }"
                >
                  {{ user.status === 'active' ? 'Dezaktywuj' : 'Aktywuj ponownie' }}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  :disabled="actionUserId === user.id"
                  @click="confirmAction = { type: 'delete', user }"
                >
                  Usuń
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card class="h-fit space-y-5">
        <div class="space-y-2">
          <h2>{{ editorTitle }}</h2>
          <p class="text-body text-[color:var(--color-text-secondary)]">
            {{ editorDescription }}
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div class="space-y-2">
            <Label for="full_name">Imię i nazwisko</Label>
            <Input id="full_name" v-model="form.full_name" placeholder="Imię i nazwisko rodzica lub trenera" required />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" autocomplete="email" placeholder="name@sporting.pl" required />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="role">Rola</Label>
              <select id="role" v-model="form.role" :class="selectClass">
                <option value="parent">Rodzic</option>
                <option value="coach">Trener</option>
              </select>
            </div>

            <div class="space-y-2">
              <Label for="status">Status</Label>
              <select id="status" v-model="form.status" :class="selectClass">
                <option value="active">Aktywne</option>
                <option value="inactive">Nieaktywne</option>
              </select>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" class="sm:flex-1" :disabled="isSubmitting">
              {{ isSubmitting ? 'Zapisywanie...' : isCreateMode ? 'Utwórz użytkownika' : 'Zapisz zmiany' }}
            </Button>
            <Button type="button" variant="outline" class="sm:flex-1" @click="openCreateForm">
              Wyczyść formularz
            </Button>
          </div>
        </form>

        <div v-if="selectedUser && !isCreateMode" class="rounded-lg border border-border bg-[var(--color-surface-sunken)] p-4">
          <div class="flex items-start gap-3">
            <ShieldAlert class="mt-0.5 h-5 w-5 text-brand-700" />
            <div class="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <p class="font-medium text-[color:var(--color-text-primary)]">Przydatne kolejne kroki</p>
              <p>Użyj „Wyślij wiadomość do ustawienia hasła” po zmianie adresu e-mail lub gdy użytkownik zgłasza, że nie ustawił hasła.</p>
              <p>Dezaktywowani użytkownicy zachowują swój rekord, ale tracą dostęp do chronionych tras przy następnym sprawdzeniu uwierzytelnienia.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <div v-if="confirmAction" class="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/50 px-4">
      <Card class="w-full max-w-md space-y-4">
        <div class="space-y-2">
          <h2>{{ confirmAction.type === 'delete' ? 'Usuń użytkownika' : confirmAction.nextStatus === 'inactive' ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika ponownie' }}</h2>
          <p class="text-body text-[color:var(--color-text-secondary)]">
            <template v-if="confirmAction.type === 'delete'">
              Trwale usuń {{ confirmAction.user.email }} z Supabase Auth i tabeli profili aplikacji. Tej operacji nie można cofnąć.
            </template>
            <template v-else-if="confirmAction.nextStatus === 'inactive'">
              Dezaktywuj {{ confirmAction.user.email }}, aby nie mógł już korzystać z chronionych obszarów aplikacji.
            </template>
            <template v-else>
              Aktywuj ponownie {{ confirmAction.user.email }}, aby mógł znów się zalogować.
            </template>
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" @click="confirmAction = null">
            Anuluj
          </Button>
          <Button
            :variant="confirmAction.type === 'delete' ? 'destructive' : 'default'"
            :disabled="actionUserId === confirmAction.user.id"
            @click="confirmCurrentAction"
          >
            <Trash2 v-if="confirmAction.type === 'delete'" class="mr-2 h-4 w-4" />
            {{ actionUserId === confirmAction.user.id ? 'Wykonywanie...' : confirmAction.type === 'delete' ? 'Usuń trwale' : confirmAction.nextStatus === 'inactive' ? 'Dezaktywuj użytkownika' : 'Aktywuj użytkownika ponownie' }}
          </Button>
        </div>
      </Card>
    </div>
  </div>
</template>
