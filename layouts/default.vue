<!-- Main application shell that switches between parent, coach, and admin navigation patterns. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  Calendar,
  ChevronRight,
  LayoutDashboard,
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
import { useLayout } from '@@/composables/useLayout'
import type { NavItem } from '@@/types/design'

const route = useRoute()
const drawerOpen = ref(false)
const { role, hasTopbar, hasBottomNav, hasSidebar } = useLayout()

type NavItemWithIcon = NavItem & { iconComponent: Component }

const bottomNavItems: NavItemWithIcon[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/dashboard', role: ['parent'] },
  { label: 'My children', icon: 'Users', iconComponent: Users, to: '/my-children', role: ['parent'] },
  { label: 'Games', icon: 'Volleyball', iconComponent: Volleyball, to: '/games', role: ['parent', 'coach'] },
  { label: 'Calendar', icon: 'Calendar', iconComponent: Calendar, to: '/calendar', role: ['parent', 'coach'] },
  { label: 'Profile', icon: 'UserCircle2', iconComponent: UserCircle2, to: '/profile', role: ['parent', 'coach'] },
]

const adminNavItems: NavItemWithIcon[] = [
  { label: 'Overview', icon: 'LayoutDashboard', iconComponent: LayoutDashboard, to: '/admin', role: ['admin'] },
  { label: 'Users', icon: 'Users', iconComponent: Users, to: '/admin/users', role: ['admin'] },
  { label: 'Teams', icon: 'Shirt', iconComponent: Shirt, to: '/admin/teams', role: ['admin'] },
  { label: 'Players', icon: 'Volleyball', iconComponent: Volleyball, to: '/admin/players', role: ['admin'] },
  { label: 'Coaches', icon: 'Trophy', iconComponent: Trophy, to: '/admin/coaches', role: ['admin'] },
  { label: 'Settings', icon: 'Settings', iconComponent: Settings, to: '/admin/settings', role: ['admin'] },
]

const filteredBottomNavItems = computed(() =>
  bottomNavItems.filter((item) => item.role.includes(role.value)),
)

const mainClass = computed(() => [
  'min-h-screen bg-[var(--color-surface-sunken)] px-4 py-4 sm:px-5',
  hasTopbar.value ? 'page-with-topbar' : '',
  hasBottomNav.value ? 'page-with-bottomnav' : '',
  hasSidebar.value ? 'lg:page-with-sidebar lg:px-6 lg:py-6' : '',
])

const isCurrent = (to: string) => route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <div class="min-h-screen bg-[var(--color-surface-sunken)]">
    <header v-if="hasTopbar" class="app-topbar" :class="{ 'lg:hidden': hasSidebar }">
      <div class="flex items-center gap-3">
        <button
          v-if="role === 'admin'"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white lg:hidden"
          aria-label="Toggle admin navigation"
          @click="drawerOpen = !drawerOpen"
        >
          <Menu v-if="!drawerOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </button>
        <ClubLogo variant="full" />
      </div>
      <button
        type="button"
        class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        aria-label="Open notifications"
      >
        <Bell class="h-5 w-5" />
      </button>
    </header>

    <aside v-if="hasSidebar" class="app-sidebar hidden lg:flex">
      <div class="border-b border-white/15 px-4 py-8">
        <ClubLogo variant="full" />
      </div>
      <nav class="flex-1 space-y-2 px-4 py-6">
        <NuxtLink
          v-for="item in adminNavItems"
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
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-medium text-white">
            AK
          </div>
          <div>
            <p class="text-sm font-medium text-white">Admin</p>
            <p class="text-label text-brand-100">admin@sporting.pl</p>
          </div>
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
          aria-label="Close admin navigation"
          @click="drawerOpen = false"
        />
        <aside class="app-sidebar w-[min(85vw,var(--sidebar-width))]">
          <div class="border-b border-white/15 px-4 py-5">
            <div class="flex items-center justify-between">
              <ClubLogo variant="full" />
              <button
                type="button"
                class="inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
                aria-label="Close admin navigation"
                @click="drawerOpen = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <nav class="flex-1 space-y-2 px-4 py-6">
            <NuxtLink
              v-for="item in adminNavItems"
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
