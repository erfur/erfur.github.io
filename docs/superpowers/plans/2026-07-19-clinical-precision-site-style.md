# Clinical Precision Site Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every application-owned site surface with the Clinical Precision design system while preserving routes, content, layout widths, responsive behavior, and interactions.

**Architecture:** Define the supplied palette and typography as semantic Tailwind tokens, then migrate application-owned JSX to those tokens directly. Keep layout structure intact, retain the existing theme toggle with an inverse-token dark theme, and enforce the sharp, shadowless visual language with configuration and source-audit regression tests.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, `@tailwindcss/typography`, Jest, Testing Library

## Global Constraints

- Preserve existing routes, content, component placement, `max-w-3xl` reading widths, wider supporting containers, and responsive visibility rules.
- Use JetBrains Mono across navigation, headings, body text, metadata, forms, and code.
- Desktop large headlines are 32px/40px at weight 700 with `-0.02em` tracking; mobile large headlines are 24px/32px with the same weight and tracking.
- Section headlines are 20px/28px at weight 600; body text is 16px/24px or 14px/20px; labels are uppercase 12px/16px at weight 500 with `0.05em` tracking; inline code is 13px/18px.
- Use 0px corner radius and only 1px or 2px borders; remove routine shadows.
- Light mode uses the supplied Clinical Precision values exactly. Dark mode uses `#2d3133` inverse surface, `#eff1f3` inverse text, derived dark containers, muted outlines, and `#ffb3b0` inverse primary.
- Reserve red for active states, links, focus, code keywords, and critical emphasis.
- Do not add dependencies or change data flow, state transitions, content models, search behavior, navigation behavior, or error handling.

---

### Task 1: Semantic Palette And Typography Foundation

**Files:**
- Modify: `tailwind.config.js:1-140`
- Modify: `app/layout.tsx:1-113`
- Modify: `app/__tests__/layout.test.tsx:1-35`
- Modify: `__tests__/typographyConfig.test.js:1-40`

**Interfaces:**
- Consumes: Existing Tailwind `theme.extend` and Next.js root layout.
- Produces: Semantic color utilities (`surface`, `on-surface`, `outline-variant`, `primary-container`, and the remaining supplied tokens), typography utilities (`headline-lg`, `headline-md`, `body-lg`, `body-md`, `label-sm`, `code-inline`), and the single CSS variable `--font-jetbrains-mono`.

- [ ] **Step 1: Replace the typography regression test with failing semantic-token expectations**

Use this structure in `__tests__/typographyConfig.test.js`:

```js
const config = require('../tailwind.config')

const extendedTheme = config.theme.extend

function theme(path) {
  return path.split('.').reduce((value, key) => value[key], extendedTheme)
}

describe('Clinical Precision theme', () => {
  it('defines the semantic light palette exactly', () => {
    expect(extendedTheme.colors).toMatchObject({
      surface: '#f7f9fb',
      'surface-container-lowest': '#ffffff',
      'surface-container-low': '#f2f4f6',
      'surface-container': '#eceef0',
      'surface-container-high': '#e6e8ea',
      'surface-container-highest': '#e0e3e5',
      'on-surface': '#191c1e',
      'on-surface-variant': '#574140',
      'inverse-surface': '#2d3133',
      'inverse-on-surface': '#eff1f3',
      outline: '#8b7170',
      'outline-variant': '#debfbe',
      primary: '#a83639',
      'on-primary': '#ffffff',
      'primary-container': '#f87171',
      'on-primary-container': '#6c0513',
      'inverse-primary': '#ffb3b0',
      secondary: '#545f73',
      tertiary: '#505f76',
      error: '#ba1a1a',
    })
  })

  it('uses JetBrains Mono for every text role', () => {
    expect(extendedTheme.fontFamily).toEqual({
      mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      sans: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      heading: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
    })
  })

  it('defines the approved type scale', () => {
    expect(extendedTheme.fontSize).toMatchObject({
      'headline-lg': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
      'headline-lg-mobile': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '700' }],
      'headline-md': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em', fontWeight: '500' }],
      'code-inline': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '400' }],
    })
  })

  it('uses the body and inline-code roles in prose', () => {
    const css = extendedTheme.typography({ theme }).DEFAULT.css
    expect(css.fontFamily).toBe('var(--font-jetbrains-mono), Menlo, monospace')
    expect(css.p).toMatchObject({ fontSize: '1rem', lineHeight: '1.5rem' })
    expect(css.code).toMatchObject({ fontSize: '0.8125rem', lineHeight: '1.125rem', borderRadius: '0' })
    expect(css.img).toMatchObject({ borderRadius: '0', boxShadow: 'none' })
  })
})
```

- [ ] **Step 2: Replace the root-layout font test with a failing JetBrains-only expectation**

In `app/__tests__/layout.test.tsx`, mock only `JetBrains_Mono`, import it, and assert:

```tsx
jest.mock('next/font/google', () => ({
  JetBrains_Mono: jest.fn(() => ({ variable: 'jetbrains-mono-variable' })),
}))

import { JetBrains_Mono } from 'next/font/google'
import '../layout'

it('loads JetBrains Mono as the only site typeface', () => {
  expect(JetBrains_Mono).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
    weight: ['400', '500', '600', '700'],
  })
})
```

Retain the existing component/provider mocks around this code.

- [ ] **Step 3: Run the focused tests and confirm they fail**

Run: `npm run test:run -- __tests__/typographyConfig.test.js app/__tests__/layout.test.tsx --runInBand`

Expected: FAIL because semantic colors/type roles are absent and the root layout still loads four fonts.

- [ ] **Step 4: Define the complete semantic theme and unified prose typography**

In `tailwind.config.js`, remove `tailwindcss/colors` and replace `theme.extend.fontFamily`, `colors`, `fontSize`, and `typography`. Define the complete color object exactly as follows:

```js
colors: {
  surface: '#f7f9fb',
  'surface-dim': '#d8dadc',
  'surface-bright': '#f7f9fb',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f2f4f6',
  'surface-container': '#eceef0',
  'surface-container-high': '#e6e8ea',
  'surface-container-highest': '#e0e3e5',
  'on-surface': '#191c1e',
  'on-surface-variant': '#574140',
  'inverse-surface': '#2d3133',
  'inverse-on-surface': '#eff1f3',
  outline: '#8b7170',
  'outline-variant': '#debfbe',
  'surface-tint': '#a83639',
  primary: '#a83639',
  'on-primary': '#ffffff',
  'primary-container': '#f87171',
  'on-primary-container': '#6c0513',
  'inverse-primary': '#ffb3b0',
  secondary: '#545f73',
  'on-secondary': '#ffffff',
  'secondary-container': '#d5e0f8',
  'on-secondary-container': '#586377',
  tertiary: '#505f76',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#8d9db5',
  'on-tertiary-container': '#243449',
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
  'primary-fixed': '#ffdad8',
  'primary-fixed-dim': '#ffb3b0',
  'on-primary-fixed': '#410006',
  'on-primary-fixed-variant': '#881d24',
  'secondary-fixed': '#d8e3fb',
  'secondary-fixed-dim': '#bcc7de',
  'on-secondary-fixed': '#111c2d',
  'on-secondary-fixed-variant': '#3c475a',
  'tertiary-fixed': '#d3e4fe',
  'tertiary-fixed-dim': '#b7c8e1',
  'on-tertiary-fixed': '#0b1c30',
  'on-tertiary-fixed-variant': '#38485d',
  background: '#f7f9fb',
  'on-background': '#191c1e',
  'surface-variant': '#e0e3e5',
},
```

Use the tested JetBrains-only font families and type roles, then use this prose shape:

```js
typography: ({ theme }) => ({
  DEFAULT: {
    css: {
      fontFamily: theme('fontFamily.sans').join(', '),
      color: theme('colors.on-surface'),
      p: { fontSize: '1rem', lineHeight: '1.5rem', marginTop: '0.75em', marginBottom: '0.75em' },
      'ul, ol': { fontSize: '1rem', lineHeight: '1.5rem' },
      'h1,h2,h3,h4,h5,h6': { fontFamily: theme('fontFamily.heading').join(', '), fontWeight: '600', letterSpacing: '-0.02em' },
      a: { color: theme('colors.primary'), fontWeight: '500', textDecorationColor: theme('colors.primary-container') },
      code: { fontFamily: theme('fontFamily.mono').join(', '), color: theme('colors.on-surface'), backgroundColor: theme('colors.surface-container'), fontSize: '0.8125rem', lineHeight: '1.125rem', fontWeight: '400', padding: '0.125rem 0.25rem', borderRadius: '0' },
      'code::before': { content: 'none' },
      'code::after': { content: 'none' },
      'pre code': { backgroundColor: 'transparent', padding: '0' },
      img: { marginTop: '1em', marginBottom: '0.5em', borderRadius: '0', border: `1px solid ${theme('colors.outline-variant')}`, boxShadow: 'none' },
      figcaption: { marginTop: '0.375em', fontSize: '0.75rem', lineHeight: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: theme('colors.tertiary') },
      table: { fontSize: '0.875rem', lineHeight: '1.25rem' },
      thead: { borderBottomColor: theme('colors.outline') },
      'tbody tr': { borderBottomColor: theme('colors.outline-variant') },
      'tbody tr:nth-child(even)': { backgroundColor: theme('colors.surface-container-low') },
    },
  },
  invert: {
    css: {
      '--tw-prose-body': theme('colors.inverse-on-surface'),
      '--tw-prose-headings': theme('colors.inverse-on-surface'),
      '--tw-prose-links': theme('colors.inverse-primary'),
      '--tw-prose-code': theme('colors.inverse-on-surface'),
      '--tw-prose-pre-bg': '#202426',
      '--tw-prose-hr': '#574140',
      '--tw-prose-th-borders': '#8b7170',
      '--tw-prose-td-borders': '#574140',
    },
  },
})
```

- [ ] **Step 5: Simplify the root layout to JetBrains Mono and semantic surfaces**

In `app/layout.tsx`, import only `JetBrains_Mono`, configure weights `['400', '500', '600', '700']`, use only `jetbrainsMono.variable` on `<html>`, set both theme-color metadata values (`#f7f9fb` light and `#2d3133` dark), and change the body/shell classes to:

```tsx
<body className="bg-surface font-sans text-on-surface antialiased dark:bg-inverse-surface dark:text-inverse-on-surface">
  {/* providers remain in their current order */}
  <div className="flex h-screen flex-col justify-between font-sans">
```

- [ ] **Step 6: Run focused tests and commit**

Run: `npm run test:run -- __tests__/typographyConfig.test.js app/__tests__/layout.test.tsx --runInBand`

Expected: PASS.

```bash
git add tailwind.config.js app/layout.tsx app/__tests__/layout.test.tsx __tests__/typographyConfig.test.js
git commit -m "Add Clinical Precision design tokens"
```

### Task 2: Global Focus, Prose, And Syntax Theme

**Files:**
- Modify: `css/tailwind.css:5-53`
- Modify: `css/prism.css:1-148`
- Create: `__tests__/clinicalPrecisionCss.test.js`

**Interfaces:**
- Consumes: Semantic tokens and font roles from Task 1.
- Produces: Shared focus/input behavior and the Clinical Precision Prism token theme used by all MDX code blocks.

- [ ] **Step 1: Add failing CSS contract tests**

Create `__tests__/clinicalPrecisionCss.test.js`:

```js
const fs = require('fs')
const path = require('path')

const globalCss = fs.readFileSync(path.join(__dirname, '../css/tailwind.css'), 'utf8')
const prismCss = fs.readFileSync(path.join(__dirname, '../css/prism.css'), 'utf8')

it('defines square semantic controls and visible focus', () => {
  expect(globalCss).toContain('border-radius: 0;')
  expect(globalCss).toContain('outline: 2px solid #a83639;')
  expect(globalCss).toContain('border-color: #f87171;')
})

it('uses Clinical Precision syntax colors without rounded corners or shadows', () => {
  expect(prismCss).toContain('color: #ffb3b0;')
  expect(prismCss).toContain('color: #8d9db5;')
  expect(prismCss).toContain('background: #202426;')
  expect(prismCss).not.toMatch(/rounded|shadow/)
})
```

- [ ] **Step 2: Run the CSS test and confirm it fails**

Run: `npm run test:run -- __tests__/clinicalPrecisionCss.test.js --runInBand`

Expected: FAIL because global focus rules and the new syntax palette do not exist.

- [ ] **Step 3: Add global square-control and focus rules**

Append this base layer to `css/tailwind.css` while retaining scrollbar, footnote, autofill, KaTeX, and popover behavior:

```css
@layer base {
  ::selection {
    background: #ffdad8;
    color: #410006;
  }

  button,
  input,
  textarea,
  select {
    border-radius: 0;
    font-family: var(--font-jetbrains-mono), Menlo, monospace;
  }

  :where(a, button, input, textarea, select):focus-visible {
    outline: 2px solid #a83639;
    outline-offset: 2px;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: #f87171;
    box-shadow: none;
  }
}
```

- [ ] **Step 4: Replace Night Owl with the clinical syntax palette**

Rewrite `css/prism.css` so code titles and blocks use `#202426`, `#eff1f3`, and `#574140`; comments/prolog/cdata use `#8d9db5`; tags/operators/keywords/booleans use `#ffb3b0`; strings/inserted use `#bcc7de`; numbers/constants/functions use `#d3e4fe`; deleted lines use `#ffb3b0` on a transparent error tint; highlighted lines use a 4px `#f87171` edge. Keep `.code-highlight`, `.code-line`, `.line-number::before`, and `.token.table` behavior, but use no `rounded*` or `shadow*` utilities.

The key declarations must be:

```css
.remark-code-title {
  @apply border border-outline bg-[#202426] px-5 py-3 font-mono text-label-sm font-bold uppercase text-inverse-on-surface;
}

pre[class*='language-'] {
  background: #202426;
}

.token.comment,
.token.prolog,
.token.cdata {
  color: #8d9db5;
  font-style: italic;
}

.token.tag,
.token.operator,
.token.keyword,
.token.boolean {
  color: #ffb3b0;
}
```

- [ ] **Step 5: Run the CSS and typography tests and commit**

Run: `npm run test:run -- __tests__/clinicalPrecisionCss.test.js __tests__/typographyConfig.test.js --runInBand`

Expected: PASS.

```bash
git add css/tailwind.css css/prism.css __tests__/clinicalPrecisionCss.test.js
git commit -m "Restyle prose and syntax highlighting"
```

### Task 3: Site Shell And Global Controls

**Files:**
- Modify: `components/Header.tsx:9-42`
- Modify: `components/Footer.tsx:5-18`
- Modify: `components/MobileNav.tsx:21-80`
- Modify: `components/ThemeSwitch.tsx:17-39`
- Modify: `components/SearchButton.tsx:13-31`
- Modify: `components/social-icons/index.tsx:31-49`
- Modify: `components/LayoutWrapper.tsx:10-18`
- Create: `components/__tests__/ClinicalShell.test.tsx`

**Interfaces:**
- Consumes: Semantic Tailwind utilities from Task 1 and global focus behavior from Task 2.
- Produces: A consistent semantic header, footer, mobile overlay, theme control, search control, and social-icon treatment.

- [ ] **Step 1: Add failing shell rendering tests**

Create `components/__tests__/ClinicalShell.test.tsx` with mocks for `siteMetadata`, `headerNavLinks`, `Logo`, `MobileNav`, `ThemeSwitch`, and social icons. Assert the rendered header and footer contracts:

```tsx
import { render, screen } from '@testing-library/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

it('uses semantic square navigation styling', () => {
  render(<Header />)
  expect(screen.getByRole('banner')).toHaveClass('text-on-surface')
  expect(screen.getByRole('link', { name: 'Blog' })).toHaveClass(
    'text-body-md',
    'hover:bg-surface-container-low',
    'dark:hover:bg-[#383d40]'
  )
})

it('uses the semantic footer divider and label typography', () => {
  render(<Footer />)
  expect(screen.getByRole('contentinfo')).toHaveClass('border-outline-variant')
  expect(screen.getByText(/©/)).toHaveClass('text-label-sm', 'uppercase', 'text-tertiary')
})
```

- [ ] **Step 2: Run the shell test and confirm it fails**

Run: `npm run test:run -- components/__tests__/ClinicalShell.test.tsx --runInBand`

Expected: FAIL because shell components still use gray/slate utilities and rounded controls.

- [ ] **Step 3: Migrate the header, footer, and retained layout wrapper**

Use these exact semantic class patterns while preserving markup and spacing:

```tsx
// Header root and navigation link
<header className="mx-auto flex w-full max-w-3xl items-center justify-between py-6 text-on-surface dark:text-inverse-on-surface">
className="hidden px-3 py-1.5 text-body-md text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface dark:text-[#bcc7de] dark:hover:bg-[#383d40] dark:hover:text-inverse-on-surface sm:block"

// Header separators
className="ml-2 flex h-8 items-center border-l border-outline-variant pl-2 dark:border-outline"

// Footer
<footer className="mt-auto border-t border-outline-variant dark:border-outline">
<p className="text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]">
```

Keep `LayoutWrapper` behavior and change only its shell font class to `font-sans` if needed after Task 1.

- [ ] **Step 4: Migrate mobile navigation and all icon controls**

For `MobileNav`, `ThemeSwitch`, `SearchButton`, and social icon links, replace rounded gray/slate controls with this shared literal class pattern in each file:

```tsx
className="flex h-8 w-8 items-center justify-center border border-transparent text-tertiary transition-colors hover:border-primary-container hover:bg-surface-container-low hover:text-primary dark:text-[#b7c8e1] dark:hover:border-inverse-primary dark:hover:bg-[#383d40] dark:hover:text-inverse-primary"
```

Use `bg-surface/95 dark:bg-inverse-surface/95` for the mobile overlay, `border-outline-variant dark:border-outline` for link dividers, and `text-headline-md` for mobile links. Preserve body-scroll locking and transition behavior.

- [ ] **Step 5: Run shell tests and commit**

Run: `npm run test:run -- components/__tests__/ClinicalShell.test.tsx components/__tests__/Link.test.tsx --runInBand`

Expected: PASS.

```bash
git add components/Header.tsx components/Footer.tsx components/MobileNav.tsx components/ThemeSwitch.tsx components/SearchButton.tsx components/social-icons/index.tsx components/LayoutWrapper.tsx components/__tests__/ClinicalShell.test.tsx
git commit -m "Restyle the site shell and navigation"
```

### Task 4: Indexes, Cards, Filters, Inputs, And Empty States

**Files:**
- Modify: `app/Main.tsx:9-72`
- Modify: `app/projects/page.tsx:7-23`
- Modify: `app/tags/page.tsx:8-40`
- Modify: `app/not-found.tsx:3-25`
- Modify: `components/Card.tsx:3-35`
- Modify: `components/Tag.tsx:8-17`
- Modify: `layouts/ListLayout.tsx:22-150`
- Modify: `layouts/ListLayoutWithTags.tsx:24-158`
- Create: `__tests__/clinicalPrecisionSourceAudit.test.js`

**Interfaces:**
- Consumes: Semantic utilities and type roles from Task 1.
- Produces: Clinical post rows, rectangular technical tags, project cards, search inputs, pagination, and 404 action styling.

- [ ] **Step 1: Add a failing source audit for migrated index surfaces**

Create `__tests__/clinicalPrecisionSourceAudit.test.js`:

```js
const fs = require('fs')
const path = require('path')

const files = [
  'app/Main.tsx',
  'app/projects/page.tsx',
  'app/tags/page.tsx',
  'app/not-found.tsx',
  'components/Card.tsx',
  'components/Tag.tsx',
  'layouts/ListLayout.tsx',
  'layouts/ListLayoutWithTags.tsx',
]

it.each(files)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  expect(source).not.toMatch(/\b(?:rounded(?:-[\w/]+)?|shadow(?:-[\w/]+)?)\b/)
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-(?:proseBody)/)
})
```

- [ ] **Step 2: Run the source audit and confirm it fails**

Run: `npm run test:run -- __tests__/clinicalPrecisionSourceAudit.test.js --runInBand`

Expected: FAIL for every listed file that still contains legacy color or rounded/shadow utilities.

- [ ] **Step 3: Restyle page headings, post rows, and pagination without changing layout**

Apply these exact patterns to `Main`, both list layouts, Projects, and Tags:

```tsx
// Page heading
className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg"

// List container and row
<ul className="divide-y divide-outline-variant border-y border-outline-variant dark:divide-outline dark:border-outline">
className="group -mx-2 flex items-baseline gap-4 px-2 py-3 transition-colors odd:bg-surface-container-lowest even:bg-surface-container-low hover:bg-surface-container dark:odd:bg-[#323638] dark:even:bg-[#383d40] dark:hover:bg-[#41474a]"

// Row title, tag, and date
className="font-semibold text-on-surface transition-colors group-hover:text-primary dark:text-inverse-on-surface dark:group-hover:text-inverse-primary"
className="text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]"
className="ml-auto shrink-0 text-body-md tabular-nums text-tertiary dark:text-[#b7c8e1]"

// Pagination divider and enabled/disabled text
className="flex items-center justify-between border-t border-outline-variant pt-6 dark:border-outline"
className="text-body-md font-medium text-secondary hover:text-primary dark:text-[#bcc7de] dark:hover:text-inverse-primary"
className="text-body-md text-tertiary opacity-50 dark:text-[#b7c8e1]"
```

Keep title/tag/date order, current gaps, `sm` visibility, filtering, and pagination calculations unchanged.

- [ ] **Step 4: Restyle tags, project cards, search, and the not-found action**

Use these contracts:

```tsx
// Card
'group block border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary-container hover:bg-surface-container-low dark:border-outline dark:bg-[#323638] dark:hover:border-inverse-primary dark:hover:bg-[#383d40]'

// Inactive technical tag
'border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm uppercase text-secondary transition-colors hover:border-primary-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#bcc7de] dark:hover:border-inverse-primary dark:hover:text-inverse-primary'

// Active filter
'border border-primary-container bg-primary-container px-3 py-1 text-label-sm uppercase text-on-primary dark:border-inverse-primary dark:bg-[#881d24] dark:text-inverse-on-surface'

// Search input
'block w-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-tertiary focus:border-primary-container focus:outline-none focus:ring-0 dark:border-outline dark:bg-[#383d40] dark:text-inverse-on-surface dark:placeholder:text-[#b7c8e1]'

// 404 button
'inline border border-primary-container bg-primary-container px-4 py-2 text-body-md font-medium text-on-primary transition-colors hover:border-primary hover:bg-primary focus:outline-none dark:border-inverse-primary dark:bg-[#881d24] dark:text-inverse-on-surface dark:hover:bg-primary'
```

Preserve all existing content and control behavior.

- [ ] **Step 5: Run the audit and route-level tests, then commit**

Run: `npm run test:run -- __tests__/clinicalPrecisionSourceAudit.test.js --runInBand`

Expected: PASS for the initial index file list.

```bash
git add app/Main.tsx app/projects/page.tsx app/tags/page.tsx app/not-found.tsx components/Card.tsx components/Tag.tsx layouts/ListLayout.tsx layouts/ListLayoutWithTags.tsx __tests__/clinicalPrecisionSourceAudit.test.js
git commit -m "Restyle indexes cards and filters"
```

### Task 5: Article Layouts, Media, Panels, And Comments

**Files:**
- Modify: `layouts/PostLayout.tsx:28-95`
- Modify: `layouts/PostSimple.tsx:20-57`
- Modify: `layouts/PostBanner.tsx:20-52`
- Modify: `layouts/AuthorLayout.tsx:11-52`
- Modify: `components/PageTitle.tsx:7-13`
- Modify: `components/PostBanner.tsx:58-73`
- Modify: `components/TableOfContents.tsx:48-197`
- Modify: `components/ScrollTopAndComment.tsx:22-42`
- Modify: `components/ProsePopovers.tsx:184-246`
- Modify: `components/Comments.tsx:7-17`
- Modify: `components/Base64Decoder.tsx:18-25`
- Modify: `layouts/__tests__/PostLayout.test.tsx:96-104`
- Modify: `layouts/__tests__/PostSimple.test.tsx:90-98`
- Modify: `components/__tests__/PostBanner.test.tsx:45-53`
- Modify: `__tests__/clinicalPrecisionSourceAudit.test.js`

**Interfaces:**
- Consumes: Semantic prose and code styles from Tasks 1-2 and control patterns from Task 3.
- Produces: Unified article typography, square banners/media, semantic TOC/popovers, and a styled comments action.

- [ ] **Step 1: Update article tests to express the new contracts**

Replace each `prose-post` assertion in `PostLayout.test.tsx` and `PostSimple.test.tsx` with:

```tsx
expect(screen.getByText('body').parentElement).toHaveClass('prose', 'prose-gray', 'max-w-none')
expect(screen.getByText('body').parentElement).not.toHaveClass('prose-post')
```

Add this assertion to the first banner test in `components/__tests__/PostBanner.test.tsx`:

```tsx
expect(banner).toHaveClass('border', 'border-outline-variant')
expect(banner).not.toHaveClass('rounded-2xl', 'shadow-sm')
```

Extend the source-audit `files` array with every article/layout/component file listed in this task except tests.

- [ ] **Step 2: Run article tests and confirm they fail**

Run: `npm run test:run -- layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx components/__tests__/PostBanner.test.tsx __tests__/clinicalPrecisionSourceAudit.test.js --runInBand`

Expected: FAIL because `prose-post`, rounded banners/panels, shadows, and legacy colors remain.

- [ ] **Step 3: Migrate article headers, prose wrappers, author content, and media**

Use the following exact style contracts while preserving article structure and banner data behavior:

```tsx
// Post metadata
className="flex items-center gap-2 text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]"

// Post/PageTitle
className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg"

// Prose
className="prose prose-gray max-w-none dark:prose-invert"

// Current PostBanner
className="relative mb-8 h-48 overflow-hidden border border-outline-variant bg-surface-container-low dark:border-outline dark:bg-[#383d40] sm:h-64"

// Article separators
className="mt-12 border-t border-outline-variant pt-8 dark:border-outline"
```

Make the Author avatar `h-24 w-24 border border-outline-variant` with no radius. Remove `prose-post` everywhere, because Task 1 makes unified prose the default.

- [ ] **Step 4: Migrate TOC, popovers, floating controls, comments, and decoder**

Use square 1px-bordered controls and panels:

```tsx
// Compact icon control
className="border border-outline-variant bg-surface-container-low p-2 text-tertiary transition-colors hover:border-primary-container hover:bg-surface-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#b7c8e1] dark:hover:border-inverse-primary dark:hover:bg-[#41474a] dark:hover:text-inverse-primary"

// Information panel
className="border border-outline-variant bg-surface-container-low p-4 text-body-md text-on-surface dark:border-outline dark:bg-[#383d40] dark:text-inverse-on-surface"

// Load comments button
className="border border-primary bg-transparent px-4 py-2 text-body-md font-medium text-primary transition-colors hover:bg-primary-fixed dark:border-inverse-primary dark:text-inverse-primary dark:hover:bg-[#410006]"

// Base64 content
className="base64-content my-4 block border-l-2 border-tertiary pl-4 text-body-lg"
```

Retain TOC collapse/active-heading logic, popover positioning/copy behavior, scroll behavior, comment loading, and decoder error behavior. Replace the copied-success circle with a square muted emerald state: `bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`.

- [ ] **Step 5: Run article and popover tests and commit**

Run: `npm run test:run -- layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx components/__tests__/PostBanner.test.tsx components/__tests__/ProsePopovers.test.tsx __tests__/clinicalPrecisionSourceAudit.test.js --runInBand`

Expected: PASS.

```bash
git add layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/PostBanner.tsx layouts/AuthorLayout.tsx components/PageTitle.tsx components/PostBanner.tsx components/TableOfContents.tsx components/ScrollTopAndComment.tsx components/ProsePopovers.tsx components/Comments.tsx components/Base64Decoder.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx components/__tests__/PostBanner.test.tsx __tests__/clinicalPrecisionSourceAudit.test.js
git commit -m "Restyle article surfaces and utilities"
```

### Task 6: Whole-Site Audit And Verification

**Files:**
- Modify: `__tests__/clinicalPrecisionSourceAudit.test.js`
- Modify only if audit identifies application-owned remnants: files under `app/`, `components/`, or `layouts/`

**Interfaces:**
- Consumes: All prior task deliverables.
- Produces: A complete regression guard against legacy rounded, shadowed, gray/slate/blue, and superseded font-role styling.

- [ ] **Step 1: Generalize the source audit to all application-owned TSX files**

Replace the fixed list in `__tests__/clinicalPrecisionSourceAudit.test.js` with this recursive collector:

```js
const fs = require('fs')
const path = require('path')

function collectTsxFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectTsxFiles(fullPath)
    }
    return entry.name.endsWith('.tsx') ? [fullPath] : []
  })
}

const roots = ['app', 'components', 'layouts']
const files = roots.flatMap((root) => collectTsxFiles(path.join(__dirname, '..', root)))

it.each(files)('%s contains no legacy visual utilities', (file) => {
  const source = fs.readFileSync(file, 'utf8')
  expect(source).not.toMatch(/\b(?:rounded(?:-[\w/]+)?|shadow(?:-[\w/]+)?)\b/)
  expect(source).not.toMatch(/\b(?:text|bg|border|ring|placeholder)-(?:gray|slate|blue)-/)
  expect(source).not.toMatch(/font-proseBody/)
})
```

- [ ] **Step 2: Run the whole-site audit and remove any remaining legacy utility classes**

Run: `npm run test:run -- __tests__/clinicalPrecisionSourceAudit.test.js --runInBand`

Expected: PASS. If it fails, replace only the reported visual utility with the corresponding semantic token; do not alter markup, dimensions, responsive rules, or behavior.

- [ ] **Step 3: Format and lint the changed files**

Run: `npx prettier --write tailwind.config.js css/tailwind.css css/prism.css app components layouts __tests__ docs/superpowers/plans/2026-07-19-clinical-precision-site-style.md`

Expected: Prettier completes without errors.

Run: `npm run lint`

Expected: ESLint completes with no errors.

- [ ] **Step 4: Run the complete test suite**

Run: `npm run test:run -- --runInBand`

Expected: All Jest suites pass.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: Next.js and the postbuild script complete successfully with no type, content, or static-generation errors.

- [ ] **Step 6: Perform responsive visual checks**

Run: `npm run dev`

Inspect `/`, `/blog`, `/tags`, `/projects`, one post with a banner, and one post without a banner at widths 375px, 768px, and desktop. For each route, verify light and dark themes, no horizontal overflow, unchanged title/tag/date alignment, visible keyboard focus, square controls/media/panels, readable contrast, working mobile navigation, TOC, popovers, theme switch, comments control, and banner scroll fade.

- [ ] **Step 7: Commit the final audit and any formatting-only corrections**

```bash
git add app components layouts css tailwind.config.js __tests__ docs/superpowers/plans/2026-07-19-clinical-precision-site-style.md
git commit -m "Verify Clinical Precision site styling"
```
