# Sporting Wrocław — Football Club Manager: Design System

Mobile-first PWA design spec for Vue 3 + Tailwind CSS + shadcn-vue.

## 1. Brand colors

Derived from the club crest (navy/royal blue badge with coral accent for actions).

| Token | Hex | Usage |
|---|---|---|
| `--brand-900` | `#042C53` | Darkest navy, text on light blue fills |
| `--brand-800` | `#0C447C` | Top bar / sidebar background, headings on light |
| `--brand-700` | `#185FA5` | Primary buttons, active nav state |
| `--brand-400` | `#378ADD` | Hover/links |
| `--brand-200` | `#85B7EB` | Secondary text on navy (eyebrow labels) |
| `--brand-100` | `#B5D4F4` | Borders on navy surfaces |
| `--brand-50`  | `#E6F1FB` | Avatar fills, light badges |

### Status colors (availability / attendance)

| State | Fill | Border/Text |
|---|---|---|
| Confirmed | `#97C459` (bg) | `#27500A` text / `#639922` ring |
| Declined | `#F0997B` (bg) | `#4A1B0C` text / `#D85A30` ring |
| Pending | `#FAC775` (bg) | `#412402` text / `#BA7517` ring |
| Neutral / no response | `#D3D1C7` (bg) | `#2C2C2A` text / `#B4B2A9` ring |

### Tailwind config snippet

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F1FB',
          100: '#B5D4F4',
          200: '#85B7EB',
          400: '#378ADD',
          700: '#185FA5',
          800: '#0C447C',
          900: '#042C53',
        },
        status: {
          confirmed: { bg: '#97C459', text: '#27500A', ring: '#639922' },
          declined:  { bg: '#F0997B', text: '#4A1B0C', ring: '#D85A30' },
          pending:   { bg: '#FAC775', text: '#412402', ring: '#BA7517' },
          neutral:   { bg: '#D3D1C7', text: '#2C2C2A', ring: '#B4B2A9' },
        },
      },
    },
  },
}
```

## 2. Typography

- Font family: system sans (Tailwind default `font-sans`), e.g. Inter or system-ui stack.
- Weights: **400 (regular)** and **500 (medium)** only — avoid 600/700 for a calmer UI.
- Scale:
  - `h1`: 22px / 500 — page titles ("Club overview", "Dashboard")
  - `h2`: 18px / 500 — section headers
  - `h3`: 16px / 500 — card titles
  - Body: 16px / 400, line-height 1.7
  - Small / meta: 13px, `text-secondary` color
  - Micro / labels: 11–12px, uppercase, letter-spacing 1–1.5px

### Brand eyebrow label

Used **only** in the top bar / sidebar header, echoing the crest's circular wordmark (`KLUB SPORTOWY` / `SPORTING WROCŁAW`):

```html
<div class="text-[10px] tracking-[1.5px] font-medium text-brand-200 uppercase">
  Klub Sportowy
</div>
<div class="text-sm font-medium tracking-wide text-white">
  Sporting Wrocław
</div>
```

## 3. Layout structure

### Global shell

- **Top bar** (all roles, mobile): `bg-brand-800`, height 56px, contains crest badge + club name (eyebrow style) + notification bell icon. Fixed/sticky.
- **Bottom tab bar** (Parent & Coach, mobile): 5 items, icons (Tabler-style outline), 11px labels, active item in `brand-700`, inactive in `text-tertiary`. Fixed to viewport bottom, `bg-white`, top border.
- **Admin (desktop)**: fixed left sidebar, 200px, `bg-brand-800`, white/`brand-100` text. Nav items as rows with icon + label, active item gets `bg-brand-700` pill. User account block pinned to sidebar bottom.
- **Admin (mobile)**: sidebar collapses into a slide-out drawer triggered by a hamburger icon in the top bar.

### Spacing / radius

- Card radius: `rounded-xl` (12px)
- Inner element radius: `rounded-lg` (8px)
- Page padding: 16px mobile, 20px desktop
- Card padding: 14–16px
- Border: 0.5px solid neutral-200/30% opacity equivalent (use `border-gray-200`)

## 4. Core components

### 4.1 Match / game card (Parent dashboard)

Structure:
- Eyebrow: "Next match" (`text-brand-700`, 11px, uppercase, tracking)
- Title: opponent name, 16px/500
- Meta line: date · time · location, 13px secondary
- Right-aligned circular icon badge (ball icon, `bg-brand-50`)
- Divider
- RSVP question: "Will [child] play?"
- Two buttons: "Yes, he's in" (success style) / "Can't make it" (default outline)

### 4.2 Squad availability strip (signature element)

Horizontal scrollable row of circular avatar chips:
- 42px circle, initials, 13px/500
- 2px ring colored by status (confirmed/declined/pending/neutral — see status colors)
- 11px name label below, centered

This circular-chip motif is the app's signature, echoing the crest's circular badge design. Reuse it for:
- Game attendance lists (coach view)
- Player rosters
- Team member avatars throughout

### 4.3 Upcoming list item

Row layout: date block (day abbreviation + number, centered, 36px width) | title + meta (flex-1) | chevron-right icon. Divider between rows, contained in a card.

### 4.4 Coach attendance screen

- Stats row: 3 equal columns (Confirmed / Declined / Pending), each a `bg-gray-50` metric card with large number (20px/500, colored by status) + label (11px secondary)
- Squad list: each row = avatar (34px, brand-50 bg) + name (14px/500) + position/note (12px secondary) + status pill (right-aligned, colored badge: "In" / "Out" / "Pending")
- Bottom action button: "Send reminder to pending" (primary, full width)

### 4.5 Admin sidebar nav items

```
Overview        (ti-layout-dashboard)
Users           (ti-users)
Teams           (ti-shirt-sport)
Players         (ti-ball-football)
Coaches         (ti-whistle)
Settings        (ti-settings)
```

Active state: `bg-brand-700` rounded pill behind icon+label.

### 4.6 Status pill / badge

```html
<span class="text-xs font-medium px-2.5 py-1 rounded-md
  bg-status-confirmed-bg text-status-confirmed-text">
  In
</span>
```

## 5. Iconography

Use an outline icon set (e.g. Tabler Icons via `@tabler/icons-vue` or lucide-vue-next as substitute). Key icons:

| Purpose | Icon |
|---|---|
| Club/shield | `shield-star` |
| Home/dashboard | `home` / `layout-dashboard` |
| Children/roster | `users` |
| Games/match | `ball-football` |
| Calendar | `calendar` |
| Profile | `user-circle` |
| Notifications | `bell` |
| Confirm | `check` |
| Decline | `x` |
| Teams | `shirt-sport` |
| Coaches | `whistle` |
| Settings | `settings` |
| Navigate | `chevron-right` |

## 6. Page-to-component map

| Route | Key components |
|---|---|
| `/login`, `/forgot-password` | Centered card, crest logo top, form inputs, primary button |
| `/dashboard` (parent) | Top bar, match card (4.1), availability strip (4.2), upcoming list (4.3), bottom tabs |
| `/my-children` | List of child cards, each with avatar + team + quick stats |
| `/games` | List of game cards (date block + title + meta + RSVP status) |
| `/calendar` | Month/week grid, color-coded by event type (match/training) |
| `/profile` | Account card (avatar, name, email/phone rows), edit form |
| `/coach`, `/coach/games` | Game list → attendance screen (4.4) |
| `/coach/teams`, `/coach/players` | Roster table/list using avatar + status pill pattern |
| `/admin/*` | Sidebar shell (3), metric cards row, data tables (4.5/4.6 patterns) |

## 7. PWA notes

- Theme color (manifest `theme_color` / `<meta name="theme-color">`): `#0C447C`
- Background color: `#FFFFFF`
- Icons: use crest badge (circular) at 192x192 and 512x512, maskable variant with safe padding
- Install prompt styling: match primary button style (`bg-brand-700`, white text, `rounded-lg`)

## 8. Accessibility

- Maintain visible focus rings (`focus:ring-2 focus:ring-brand-400`) on all interactive elements
- Status pills must pair color with text label ("In"/"Out"/"Pending"), never color alone
- Minimum touch target 44x44px for bottom tab bar and buttons
- Respect `prefers-reduced-motion` for any transitions
