# Football Club Manager - Copilot Instructions

## Project Overview

Football Club Manager is a Progressive Web Application (PWA) for managing a youth football club.

Primary users:

* Admin
* Coach
* Parent

The application is designed for mobile-first usage and should work efficiently on phones, tablets, and desktops.

Typical usage scenarios:

* Coach creates games and manages attendance.
* Parents confirm player availability.
* Admin manages club structure.
* Users view upcoming matches and schedules.

The application must remain simple, fast, secure, and maintainable.

---

# Technology Stack

## Frontend

* Nuxt 4
* Vue 3
* TypeScript
* Tailwind CSS
* shadcn-vue
* Pinia
* VueUse

## Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage

## Infrastructure

* Vercel
* Vite PWA

---

# Development Principles

Always prefer:

* Simplicity
* Readability
* Maintainability
* Strong typing
* Reusability

Avoid:

* Premature optimization
* Unnecessary abstractions
* Overengineering
* Deep inheritance chains
* Large monolithic components

---

# Project Goals

The project should:

* Be mobile-first
* Be installable as a PWA
* Support multiple age groups
* Support multiple teams
* Support multiple coaches
* Support parent communication
* Scale to additional teams without redesign

---

# Domain Model

## Age Group

Examples:

* Orlik (2015-2016)
* Żak (2017-2018)
* Skrzat (2019-2020)

Each age group can contain multiple teams.

---

## Team

Examples:

* Sporting Wroclaw A
* Sporting Wroclaw B

Each team belongs to one age group.

---

## Player

A player:

* belongs to one team
* has one or more parents
* participates in games

---

## Parent

A parent:

* owns one user account
* may manage multiple children
* can confirm attendance
* can add attendance notes

---

## Coach

A coach:

* manages assigned teams
* creates games
* manages attendance
* views player information

---

## Admin

An admin:

* manages all data
* manages users
* manages teams
* manages coaches
* manages age groups

---

# Roles

Supported roles:

```text
admin
coach
parent
```

Never hardcode role checks in UI only.

All authorization must be enforced through:

* Supabase RLS
* Server-side validation

---

# Database Tables

Core tables:

```text
profiles
age_groups
teams
players
player_parents
games
game_attendance
```

Future tables:

```text
training_sessions
notifications
player_evaluations
payments
documents
```

---

# Expected Directory Structure

src/

```text
app/
components/
layouts/
pages/
composables/
stores/
services/
types/
validators/
utils/
server/
```

---

# Page Structure

## Public

```text
/
login
forgot-password
```

---

## Parent Area

```text
/dashboard
/my-children
/games
/calendar
/profile
```

---

## Coach Area

```text
/coach
/coach/teams
/coach/players
/coach/games
/coach/calendar
```

---

## Admin Area

```text
/admin
/admin/users
/admin/teams
/admin/players
/admin/coaches
/admin/settings
```

---

# Component Rules

Components should:

* have a single responsibility
* remain small
* be reusable
* be typed

If a component exceeds approximately 250 lines, consider splitting it.

Avoid business logic inside UI components.

Move business logic into:

* composables
* services
* server functions

---

# Naming Conventions

## Components

Use PascalCase:

```text
PlayerCard.vue
TeamSelector.vue
AttendanceTable.vue
```

## Composables

Use:

```text
useAuth.ts
useAttendance.ts
useGames.ts
```

## Stores

Use:

```text
authStore.ts
teamsStore.ts
gamesStore.ts
```

## Types

Use:

```text
Player.ts
Game.ts
Attendance.ts
```

---

# TypeScript Rules

Always:

* use strict mode
* use explicit interfaces
* use typed return values

Avoid:

```ts
any
```

Prefer:

```ts
unknown
```

with proper narrowing.

---

# Forms

Use:

* VeeValidate
* Zod

Requirements:

* client validation
* server validation
* user-friendly messages

Never trust client validation alone.

---

# State Management

Use Pinia.

Global state should only contain:

* authenticated user
* permissions
* cached application state

Avoid storing form state globally.

---

# Data Fetching

Prefer:

* server-side loading
* composables
* Supabase queries

Avoid:

* duplicate requests
* fetching inside deeply nested components

---

# Styling Rules

Use:

* Tailwind utilities
* shadcn-vue components

Avoid:

* inline styles
* custom CSS when utility classes are sufficient

---

# Mobile-First Requirements

Every feature must be usable on:

* Android phones
* iPhones
* tablets

Important:

* large buttons
* large touch targets
* responsive tables
* readable outdoors

Never design desktop-first.

---

# Accessibility

Always:

* use semantic HTML
* provide labels
* provide keyboard navigation
* provide ARIA attributes where needed

The application should be usable by non-technical users.

---

# Security Rules

Never:

* expose service role keys
* expose secrets
* bypass RLS
* trust client-side authorization

Always:

* validate input
* sanitize user content
* enforce permissions server-side

Security is more important than convenience.

---

# Performance Rules

Prefer:

* lazy loading
* code splitting
* pagination
* optimized queries

Avoid:

* loading entire tables
* unnecessary watchers
* unnecessary reactive state

---

# Logging

Use structured logs.

Avoid:

```ts
console.log()
```

in production code.

Use:

```ts
console.error()
```

only when required.

---

# Error Handling

Every async operation must handle:

* loading state
* success state
* error state
* empty state

Never ignore exceptions.

---

# Testing Expectations

Critical features should be testable.

Priority areas:

* authentication
* authorization
* attendance
* game creation
* role restrictions

---

# PWA Requirements

The application must:

* be installable
* support offline caching where possible
* have a valid manifest
* support Android home screen installation

The PWA experience is a first-class feature.

---

# Future Features

Planned future functionality:

* push notifications
* multilingual support
* training attendance
* player statistics
* player evaluations
* match reports
* AI-generated summaries
* tournament management
* payments
* document uploads

Design code with future expansion in mind, but do not overengineer current solutions.

---

# Copilot Behavior Instructions

When generating code:

1. Follow existing project patterns.
2. Prefer composition over abstraction.
3. Generate fully typed TypeScript.
4. Keep components focused.
5. Reuse existing utilities.
6. Respect role-based permissions.
7. Consider mobile-first layouts.
8. Consider accessibility.
9. Consider security implications.
10. Produce production-ready code.

Before suggesting implementation:

* verify type safety
* verify permissions
* verify responsive behavior
* verify error handling
* verify maintainability

If multiple solutions exist, prefer the simplest solution that satisfies requirements.
