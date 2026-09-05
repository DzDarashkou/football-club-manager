<!-- Main application shell that switches between parent, coach, and admin navigation patterns. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStorage } from '@vueuse/core'
import {
  Bell,
  Calendar,
  CircleHelp,
  Dumbbell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  Shirt,
  Trophy,
  UserCircle2,
  Users,
  Volleyball,
  X,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import { getProfileDisplayName, getProfileInitials } from '@@/lib/auth'
import { useLayout } from '@@/composables/useLayout'
import type { NavItem } from '@@/types/design'
import type { AppRole } from '@@/types/auth'

const route = useRoute()
const router = useRouter()
const drawerOpen = ref(false)
type AdminNavigationMode = 'admin' | 'coach'
const adminNavigationMode = useSessionStorage<AdminNavigationMode>('sporting-admin-navigation-mode', 'admin')
const { role, hasTopbar, hasBottomNav, hasSidebar } = useLayout()
const { profile, signOut } = useAppAuth()

type NavItemWithIcon = NavItem & { iconComponent: Component, hidden?: boolean }

const memberNavItems: NavItemWithIcon[] = [
  { label: 'Panel główny', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/dashboard', role: ['parent'], hidden: true },
  { label: 'Panel główny', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/coach', role: ['coach'] },
  { label: 'Moje dzieci', icon: 'Users', iconComponent: Users, to: '/my-children', role: ['parent'], hidden: true },
  { label: 'Mecze', icon: 'Volleyball', iconComponent: Volleyball, to: '/games', role: ['parent'], hidden: true },
  { label: 'Mecze', icon: 'Volleyball', iconComponent: Volleyball, to: '/coach/games', role: ['coach'] },
  { label: 'Kalendarz', icon: 'Calendar', iconComponent: Calendar, to: '/coach/calendar', role: ['parent', 'coach'] },
  { label: 'Quiz', icon: 'CircleHelp', iconComponent: CircleHelp, to: '/parent/quiz', role: ['parent'] },
  { label: 'Profil', icon: 'UserCircle2', iconComponent: UserCircle2, to: '/profile', role: ['parent'], hidden: true },
  { label: 'Profil', icon: 'UserCircle2', iconComponent: UserCircle2, to: '/profile', role: ['coach'] },
]

const adminNavItems: NavItemWithIcon[] = [
  { label: 'Przegląd', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/admin', role: ['admin'] },
  { label: 'Użytkownicy', icon: 'Users', iconComponent: Users, to: '/admin/users', role: ['admin'] },
  { label: 'Drużyny', icon: 'Shirt', iconComponent: Shirt, to: '/admin/teams', role: ['admin'] },
  { label: 'Zawodnicy', icon: 'Volleyball', iconComponent: Volleyball, to: '/admin/players', role: ['admin'] },
  { label: 'Mecze', icon: 'Calendar', iconComponent: Calendar, to: '/admin/games', role: ['admin'] },
  { label: 'Treningi', icon: 'Dumbbell', iconComponent: Dumbbell, to: '/admin/trainings', role: ['admin'] },
  { label: 'Trenerzy', icon: 'Trophy', iconComponent: Trophy, to: '/admin/coaches', role: ['admin'], hidden: true },
  { label: 'Ustawienia', icon: 'Settings', iconComponent: Settings, to: '/admin/settings', role: ['admin'], hidden: true },
]

const coachNavItems: NavItemWithIcon[] = [
  { label: 'Panel główny', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/coach', role: ['coach'], hidden: true },
  { label: 'Drużyny', icon: 'Shirt', iconComponent: Shirt, to: '/coach/teams', role: ['coach'], hidden: true },
  { label: 'Zawodnicy', icon: 'Users', iconComponent: Users, to: '/coach/players', role: ['coach'] },
  { label: 'Mecze', icon: 'Volleyball', iconComponent: Volleyball, to: '/coach/games', role: ['coach'] },
  { label: 'Kalendarz', icon: 'Calendar', iconComponent: Calendar, to: '/coach/calendar', role: ['coach'] },
  { label: 'Profil', icon: 'UserCircle2', iconComponent: UserCircle2, to: '/profile', role: ['coach'], hidden: true },
]

const filteredBottomNavItems = computed(() =>
  memberNavItems.filter((item) => item.role.includes(role.value as AppRole) && !item.hidden),
)
const activeSidebarNavItems = computed(() => (adminNavigationMode.value === 'coach' ? coachNavItems : adminNavItems).filter((item) => !item.hidden))

const mainClass = computed(() => [
  'min-h-screen bg-[var(--color-surface-sunken)] px-4 py-4 sm:px-5',
  hasTopbar.value ? 'pt-[calc(var(--topbar-height)+1rem)]' : '',
  hasBottomNav.value ? 'pb-[calc(var(--bottomnav-height)+env(safe-area-inset-bottom)+1rem)]' : '',
  hasSidebar.value ? 'lg:page-with-sidebar lg:px-6 lg:pb-6 lg:pt-6' : '',
])

const isCurrent = (to: string) => route.path === to || route.path.startsWith(`${to}/`)
const displayName = computed(() => getProfileDisplayName(profile.value))
const initials = computed(() => getProfileInitials(profile.value))
const email = computed(() => profile.value?.email ?? '')

async function handleSignOut() {
  await signOut()
  drawerOpen.value = false
  await router.push('/login')
}

async function setAdminNavigationMode(mode: AdminNavigationMode) {
  if (adminNavigationMode.value === mode) return
  adminNavigationMode.value = mode
  drawerOpen.value = false
  await router.push(mode === 'coach' ? '/coach/players' : '/admin')
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-surface-sunken)]">
    <header v-if="hasTopbar" class="app-topbar" :class="{ 'lg:hidden': hasSidebar }">
      <div class="flex items-center gap-3">
        <button
          v-if="role === 'admin'"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white lg:hidden"
          aria-label="Otwórz lub zamknij nawigację administratora"
          @click="drawerOpen = !drawerOpen"
        >
          <Menu v-if="!drawerOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </button>
        <ClubLogo variant="full" />
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink
          v-if="role === 'parent'"
          to="/coach/calendar"
          class="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Otwórz kalendarz"
        >
          <Calendar class="h-5 w-5" />
          <span class="hidden sm:inline">Kalendarz</span>
        </NuxtLink>
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-label="Otwórz powiadomienia"
        >
          <Bell class="h-5 w-5" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          class="text-white hover:bg-white/10 hover:text-white"
          aria-label="Wyloguj się"
          @click="handleSignOut"
        >
          <LogOut class="h-5 w-5" />
        </Button>
      </div>
    </header>

    <aside v-if="hasSidebar" class="app-sidebar hidden lg:flex">
      <div class="border-b border-white/15 px-4 py-8">
        <ClubLogo variant="full" />
        <div class="mt-5 grid grid-cols-2 rounded-lg bg-white/10 p-1 text-xs" aria-label="Tryb nawigacji">
          <button type="button" class="min-h-9 rounded-md px-2 text-brand-100 transition" :class="adminNavigationMode === 'admin' ? 'bg-white text-brand-800' : 'hover:text-white'" @click="setAdminNavigationMode('admin')">Admin</button>
          <button type="button" class="min-h-9 rounded-md px-2 text-brand-100 transition" :class="adminNavigationMode === 'coach' ? 'bg-white text-brand-800' : 'hover:text-white'" @click="setAdminNavigationMode('coach')">Trener</button>
        </div>
      </div>
      <nav class="flex-1 space-y-2 px-4 py-6">
        <NuxtLink
          v-for="item in activeSidebarNavItems"
          :key="item.to"
          :to="item.to"
          class="app-sidebar-item"
          :class="{ active: isCurrent(item.to) }"
        >
          <component :is="item.iconComponent" class="h-5 w-5" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
      <div class="border-t border-white/15 px-4 py-5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-medium text-white">
              {{ initials }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-white">{{ displayName }}</p>
              <p class="truncate text-label text-brand-100">{{ email }}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="flex-shrink-0 text-white hover:bg-white/10 hover:text-white"
            aria-label="Wyloguj się"
            @click="handleSignOut"
          >
            <LogOut class="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="-translate-x-full opacity-0"
    >
      <div v-if="hasSidebar && drawerOpen" class="fixed inset-0 z-40 lg:hidden">
        <button
          type="button"
          class="absolute inset-0 bg-brand-900/40"
          aria-label="Zamknij nawigację administratora"
          @click="drawerOpen = false"
        />
        <aside class="app-sidebar w-[min(85vw,var(--sidebar-width))]">
          <div class="border-b border-white/15 px-4 py-5">
            <div class="flex items-center justify-between">
              <ClubLogo variant="full" />
              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
                aria-label="Zamknij nawigację administratora"
                @click="drawerOpen = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
            <div class="mt-4 grid grid-cols-2 rounded-lg bg-white/10 p-1 text-xs" aria-label="Tryb nawigacji">
              <button type="button" class="min-h-9 rounded-md px-2 text-brand-100 transition" :class="adminNavigationMode === 'admin' ? 'bg-white text-brand-800' : 'hover:text-white'" @click="setAdminNavigationMode('admin')">Admin</button>
              <button type="button" class="min-h-9 rounded-md px-2 text-brand-100 transition" :class="adminNavigationMode === 'coach' ? 'bg-white text-brand-800' : 'hover:text-white'" @click="setAdminNavigationMode('coach')">Trener</button>
            </div>
          </div>
          <nav class="flex-1 space-y-2 px-4 py-6">
            <NuxtLink
              v-for="item in activeSidebarNavItems"
              :key="item.to"
              :to="item.to"
              class="app-sidebar-item"
              :class="{ active: isCurrent(item.to) }"
              @click="drawerOpen = false"
            >
              <component :is="item.iconComponent" class="h-5 w-5" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
          <div class="border-t border-white/15 px-4 py-5">
            <Button
              variant="ghost"
              class="w-full justify-start text-white hover:bg-white/10 hover:text-white"
              @click="handleSignOut"
            >
              <LogOut class="mr-2 h-5 w-5" />
              Wyloguj się
            </Button>
          </div>
        </aside>
      </div>
    </Transition>

    <main :class="mainClass">
      <slot />
    </main>

    <nav v-if="hasBottomNav" class="app-bottomnav">
      <NuxtLink
        v-for="item in filteredBottomNavItems"
        :key="item.to"
        :to="item.to"
        class="app-bottomnav-item"
        :class="{ active: isCurrent(item.to) }"
      >
        <component :is="item.iconComponent" class="h-5 w-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
