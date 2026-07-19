# Restore Post Body Merriweather Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Merriweather for post paragraphs and lists while preserving JetBrains Mono and Clinical Precision styling everywhere else.

**Architecture:** Load Merriweather through the existing Next.js font pipeline, expose it as a dedicated Tailwind `proseBody` family, and restore a scoped `typography.post` modifier. Only the three post layouts opt into `prose-post`; default and author prose remain unchanged.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, `@tailwindcss/typography`, Jest, Testing Library

## Global Constraints

- Post paragraphs and ordered/unordered lists use Merriweather with Georgia and serif fallbacks.
- Post body size is `1.1rem` with `1.6` line height.
- Merriweather loads weights 400 and 700 in normal and italic styles through `next/font/google` with `display: 'swap'`.
- JetBrains Mono remains active for headings, links, code, tables, captions, metadata, controls, author prose, and all non-post prose.
- Preserve the Clinical Precision palette, dark-mode variables, square geometry, code theme, focus states, layout widths, spacing, responsive behavior, routes, content, and interactions.
- Do not add dependencies or change runtime data flow, content models, or error handling.

---

### Task 1: Restore Scoped Post Typography

**Files:**
- Modify: `app/layout.tsx:4-19,68-72`
- Modify: `tailwind.config.js:15-20,102-189`
- Modify: `app/__tests__/layout.test.tsx:1-31`
- Modify: `__tests__/typographyConfig.test.js:66-102`
- Modify: `layouts/PostLayout.tsx:78`
- Modify: `layouts/PostSimple.tsx:44`
- Modify: `layouts/PostBanner.tsx:42`
- Modify: `layouts/__tests__/PostLayout.test.tsx:96-106`
- Modify: `layouts/__tests__/PostSimple.test.tsx:90-100`
- Modify: `layouts/__tests__/PostBanner.test.tsx:25-35`

**Interfaces:**
- Consumes: Existing `--font-jetbrains-mono`, Tailwind typography configuration, and `prose` wrappers.
- Produces: CSS variable `--font-merriweather`, Tailwind family `fontFamily.proseBody`, typography modifier `post`, and `prose-post` opt-ins on all post layouts.

- [ ] **Step 1: Write failing font and typography configuration tests**

In `app/__tests__/layout.test.tsx`, mock and import both fonts, retain existing provider/component mocks, and replace the current test with:

```tsx
jest.mock('next/font/google', () => ({
  JetBrains_Mono: jest.fn(() => ({ variable: 'jetbrains-mono-variable' })),
  Merriweather: jest.fn(() => ({ variable: 'merriweather-variable' })),
}))

import { JetBrains_Mono, Merriweather } from 'next/font/google'
import '../layout'

it('loads JetBrains Mono for the interface and Merriweather for post bodies', () => {
  expect(JetBrains_Mono).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
    weight: ['400', '500', '600', '700'],
  })
  expect(Merriweather).toHaveBeenCalledWith({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-merriweather',
    weight: ['400', '700'],
    style: ['normal', 'italic'],
  })
})
```

In `__tests__/typographyConfig.test.js`, replace the all-role family assertion and extend the prose assertion:

```js
it('uses JetBrains Mono for interface roles and Merriweather for post bodies', () => {
  expect(extendedTheme.fontFamily).toEqual({
    mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
    sans: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
    heading: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
    proseBody: ['var(--font-merriweather)', 'Georgia', 'serif'],
  })
})

it('scopes the Merriweather reading scale to post paragraphs and lists', () => {
  const typography = extendedTheme.typography({ theme })
  expect(typography.post.css).toEqual({
    p: {
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: '1.6',
    },
    'ul, ol': {
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: '1.6',
    },
  })
  expect(typography.DEFAULT.css.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css['h1,h2,h3,h4,h5,h6'].fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css.a.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css.code.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
})
```

Keep all existing palette, type-scale, prose-variable, table, caption, and image-border assertions.

- [ ] **Step 2: Update all three layout tests to require the scoped modifier**

In each of `PostLayout.test.tsx`, `PostSimple.test.tsx`, and `PostBanner.test.tsx`, rename the prose test to `uses scoped Merriweather post body typography` and use:

```tsx
expect(screen.getByText('body').parentElement).toHaveClass('prose', 'prose-post', 'max-w-none')
expect(screen.getByText('body').parentElement).not.toHaveClass('prose-gray')
```

- [ ] **Step 3: Run focused tests and confirm the expected RED failures**

Run:

```bash
NODE_ENV=test npm run test:run -- app/__tests__/layout.test.tsx __tests__/typographyConfig.test.js layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx --runInBand
```

Expected: FAIL because `Merriweather`, `fontFamily.proseBody`, `typography.post`, and `prose-post` are absent.

- [ ] **Step 4: Load Merriweather in the root layout**

Change the font import and add the scoped font instance in `app/layout.tsx`:

```tsx
import { JetBrains_Mono, Merriweather } from 'next/font/google'

const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})
```

Include both variables on `<html>` without changing any other classes:

```tsx
className={`${jetbrainsMono.variable} ${merriweather.variable} scroll-smooth`}
```

- [ ] **Step 5: Restore the scoped Tailwind family and typography modifier**

Add this family to `theme.extend.fontFamily` in `tailwind.config.js`:

```js
proseBody: ['var(--font-merriweather)', 'Georgia', 'serif'],
```

Add `fontFamily: theme('fontFamily.sans').join(', ')` to the existing `DEFAULT.css.a` declaration so links nested inside Merriweather paragraphs remain JetBrains Mono. Then add this sibling of `DEFAULT` and `invert` without modifying their other Clinical Precision declarations:

```js
post: {
  css: {
    p: {
      fontFamily: theme('fontFamily.proseBody').join(', '),
      fontSize: '1.1rem',
      lineHeight: '1.6',
    },
    'ul, ol': {
      fontFamily: theme('fontFamily.proseBody').join(', '),
      fontSize: '1.1rem',
      lineHeight: '1.6',
    },
  },
},
```

- [ ] **Step 6: Opt only post layouts into Merriweather**

Use these exact wrappers:

```tsx
// layouts/PostLayout.tsx and layouts/PostSimple.tsx
<ProsePopovers className="prose prose-post max-w-none dark:prose-invert">

// layouts/PostBanner.tsx
<div className="prose prose-post max-w-none py-4 dark:prose-invert">{children}</div>
```

Do not add `prose-post` to `layouts/AuthorLayout.tsx`.

- [ ] **Step 7: Run verification and commit**

Run the focused suite:

```bash
NODE_ENV=test npm run test:run -- app/__tests__/layout.test.tsx __tests__/typographyConfig.test.js layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx --runInBand
```

Expected: 5 suites pass.

Run full verification:

```bash
NODE_ENV=test npm run test:run -- --runInBand --testPathIgnorePatterns="<rootDir>/.worktrees/"
npm run lint
npm run build
git diff --check
```

Expected: all Jest suites pass, lint reports no warnings/errors, the production build completes, and `git diff --check` prints nothing.

Commit:

```bash
git add app/layout.tsx tailwind.config.js app/__tests__/layout.test.tsx __tests__/typographyConfig.test.js layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/PostBanner.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx
git commit -m "Restore Merriweather post body typography"
```
