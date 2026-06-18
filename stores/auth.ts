import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { isAppRole } from '@@/lib/auth'
import type { Database } from '@@/types/database'
import type { AppProfile, AppRole, LoginCredentials } from '@@/types/auth'

type InitializeOptions = {
  force?: boolean
}

async function resolveSupabaseUser(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getUser()

  if (error) {
    throw error
  }

  return data.user
}

function extractUserId(candidate: unknown) {
  if (!candidate || typeof candidate !== 'object') {
    return null
  }

  const value = candidate as { id?: unknown, sub?: unknown }

  if (typeof value.id === 'string' && value.id.length > 0) {
    return value.id
  }

  if (typeof value.sub === 'string' && value.sub.length > 0) {
    return value.sub
  }

  return null
}

export const useAuthStore = defineStore('auth', () => {
  const client = useSupabaseClient<Database>()
  const supabaseSession = useSupabaseSession()
  const supabaseUser = useSupabaseUser()

  const profile = ref<AppProfile | null>(null)
  const isInitializing = ref(false)
  const authError = ref<string | null>(null)
  const loadedUserId = ref<string | null>(null)
  const initializationPromise = ref<Promise<void> | null>(null)

  const session = computed(() => supabaseSession.value as Session | null)
  const user = computed(() => (session.value?.user ?? null) as User | null)
  const role = computed<AppRole | null>(() => profile.value?.role ?? null)
  const isAuthenticated = computed(() => Boolean(session.value?.access_token))

  function reset() {
    profile.value = null
    authError.value = null
    loadedUserId.value = null
  }

  async function loadProfileForUser(userId: string) {
    const { data, error } = await client
      .from('profiles')
      .select('id, email, role, full_name, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data || !isAppRole(data.role)) {
      profile.value = null
      loadedUserId.value = null
      authError.value = 'Your account is missing an application role. Please contact the club administrator.'
      await client.auth.signOut()
      return
    }

    profile.value = {
      id: data.id,
      email: data.email,
      role: data.role,
      full_name: data.full_name,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    loadedUserId.value = userId
    authError.value = null
  }

  async function initialize(options: InitializeOptions = {}) {
    if (initializationPromise.value && !options.force) {
      return initializationPromise.value
    }

    initializationPromise.value = (async () => {
      isInitializing.value = true

      try {
        const sessionUserId = extractUserId(session.value?.user)
        const moduleUserId = extractUserId(supabaseUser.value)
        const resolvedUser = await resolveSupabaseUser(client)
        const resolvedUserId = extractUserId(resolvedUser)
        const activeUserId = resolvedUserId ?? sessionUserId ?? moduleUserId

        if (!activeUserId) {
          reset()
          return
        }

        if (!options.force && loadedUserId.value === activeUserId && profile.value) {
          return
        }

        await loadProfileForUser(activeUserId)
      }
      finally {
        isInitializing.value = false
        initializationPromise.value = null
      }
    })()

    return initializationPromise.value
  }

  async function signInWithPassword(credentials: LoginCredentials) {
    authError.value = null

    const { data, error } = await client.auth.signInWithPassword(credentials)

    if (error) {
      authError.value = 'Unable to sign in with that email and password.'
      throw error
    }

    const signedInUserId = extractUserId(data.user) ?? extractUserId(data.session?.user)

    if (!signedInUserId) {
      authError.value = 'Sign-in succeeded, but the authenticated user could not be resolved.'
      throw new Error('Authenticated user ID missing after sign-in.')
    }

    loadedUserId.value = null
    await initialize({ force: true })

    if (!role.value) {
      throw new Error('Authenticated user is missing an application role.')
    }
  }

  async function signOut() {
    const { error } = await client.auth.signOut()

    reset()

    if (error) {
      throw error
    }
  }

  return {
    authError,
    initialize,
    isAuthenticated,
    isInitializing,
    profile,
    reset,
    role,
    session,
    signInWithPassword,
    signOut,
    user,
  }
})
