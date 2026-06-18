import type { AppRole } from '@@/types/auth'

declare module '#app' {
  interface PageMeta {
    public?: boolean
    allowedRoles?: AppRole[]
  }
}

export {}
