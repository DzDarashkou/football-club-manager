/**
 * Central Nuxt configuration for the Sporting Wroclaw design system, PWA shell,
 * and shared UI infrastructure.
 */
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: '.',
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@@/assets/css/main.css'],
  modules: [
    '@nuxtjs/tailwindcss',
    ['shadcn-nuxt', {
      prefix: '',
      componentDir: '~~/components/ui',
    }],
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],
  supabase: {
    // Keep auth available, but disable the module's global redirect plugin
    // while the app is still using public mockup routes.
    redirect: false,
  },
  tailwindcss: {
    cssPath: '@@/assets/css/main.css',
    viewer: false,
  },
  typescript: {
    strict: true,
    // Nuxt's dev-time checker currently crashes on generated project-reference
    // configs like .nuxt/tsconfig.shared.json via vite-plugin-checker.
    // Keep strict TS enabled and run type checks through the package script instead.
    typeCheck: false,
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'theme-color', content: '#0C447C' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Sporting Wroclaw' },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/images/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/images/icon-512.png' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: false,
    },
    manifest: {
      name: 'Sporting Wroclaw Football Club Manager',
      short_name: 'Sporting',
      theme_color: '#0C447C',
      background_color: '#FFFFFF',
      display: 'standalone',
      icons: [
        {
          src: '/images/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/images/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/images/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    client: {
      installPrompt: true,
    },
  },
})
