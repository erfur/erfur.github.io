# Post Body Merriweather Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render regular blog post paragraphs and list text in Merriweather at `1.1rem` without changing typography elsewhere.

**Architecture:** Load Merriweather with the existing `next/font/google` setup and expose it through a dedicated CSS variable. Add a `prose-post` Tailwind Typography modifier for paragraphs and lists, then opt the three blog post layouts into that modifier so other `.prose` content remains unchanged.

**Tech Stack:** Next.js 14, TypeScript, `next/font`, Tailwind CSS 3, Tailwind Typography, Jest.

## Global Constraints

- Apply Merriweather only to paragraphs and ordered and unordered list text rendered inside blog post prose.
- Use `1.1rem` for the affected text and preserve the existing line height.
- Load Merriweather weights `400` and `700` in normal and italic styles.
- Keep Roboto Slab for headings, Roboto for site UI and post metadata, and JetBrains Mono for code.
- Leave non-post pages unchanged.

---

## File Structure

- Modify `app/layout.tsx`: load Merriweather and attach its CSS variable to the root element.
- Modify `tailwind.config.js`: expose the Merriweather variable and define the `prose-post` paragraph/list modifier at `1.1rem`.
- Modify `layouts/PostLayout.tsx`: opt the standard post layout into `prose-post`.
- Modify `layouts/PostSimple.tsx`: opt the simple post layout into `prose-post`.
- Modify `layouts/PostBanner.tsx`: opt the legacy banner post layout into `prose-post`.
- Modify `layouts/__tests__/PostLayout.test.tsx`: verify standard posts apply the typography modifier.
- Modify `layouts/__tests__/PostSimple.test.tsx`: verify simple posts apply the typography modifier.
- Create `__tests__/typographyConfig.test.js`: verify the Tailwind typography contract without coupling tests to browser font rendering.

---

### Task 1: Scoped Post Body Typography

**Files:**
- Create: `__tests__/typographyConfig.test.js`
- Modify: `app/layout.tsx:4-31,75-78`
- Modify: `tailwind.config.js:17-30,99-122`
- Modify: `layouts/PostLayout.tsx:78`
- Modify: `layouts/PostSimple.tsx:41`
- Modify: `layouts/PostBanner.tsx:42`
- Modify: `layouts/__tests__/PostLayout.test.tsx`
- Modify: `layouts/__tests__/PostSimple.test.tsx`

**Interfaces:**
- Consumes: Merriweather from `next/font/google` and the existing `.prose` classes in the post layouts.
- Produces: CSS variable `--font-merriweather` and Tailwind family `fontFamily.proseBody`.
- Produces: Tailwind modifier class `prose-post` whose paragraph and list rules use Merriweather at `1.1rem`.

- [ ] **Step 1: Write the failing typography configuration test**

Create `__tests__/typographyConfig.test.js`:

```js
const config = require('../tailwind.config')

const extendedTheme = config.theme.extend

function theme(path) {
  return path.split('.').reduce((value, key) => value[key], extendedTheme)
}

describe('post body typography', () => {
  const typography = extendedTheme.typography({ theme })

  it('defines the scoped Merriweather family', () => {
    expect(extendedTheme.fontFamily.proseBody).toEqual([
      'var(--font-merriweather)',
      'Georgia',
      'serif',
    ])
  })

  it('uses Merriweather at 1.1rem for paragraphs and lists only', () => {
    const css = typography.post.css

    expect(css.p).toMatchObject({
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: '1.6',
    })
    expect(css['ul, ol']).toMatchObject({
      fontFamily: 'var(--font-merriweather), Georgia, serif',
      fontSize: '1.1rem',
    })
    expect(typography.DEFAULT.css.fontFamily).toBe('var(--font-roboto), system-ui, sans-serif')
    expect(typography.DEFAULT.css['h1,h2,h3,h4,h5,h6'].fontFamily).toBe(
      'var(--font-roboto-slab), Georgia, serif'
    )
    expect(typography.DEFAULT.css.code.fontFamily).toBe(
      'var(--font-jetbrains-mono), Menlo, monospace'
    )
  })
})
```

Add this test to `layouts/__tests__/PostLayout.test.tsx`:

```tsx
it('opts post prose into the post body typography modifier', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.getByText('body').parentElement).toHaveClass('prose-post')
})
```

Add this test to `layouts/__tests__/PostSimple.test.tsx`:

```tsx
it('opts post prose into the post body typography modifier', () => {
  render(
    <PostSimple content={baseContent as never}>
      <p>body</p>
    </PostSimple>
  )

  expect(screen.getByText('body').parentElement).toHaveClass('prose-post')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn test:run __tests__/typographyConfig.test.js layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx --runInBand
```

Expected: FAIL because `extendedTheme.fontFamily.proseBody` and `typography.post` are undefined, and the post layout wrappers do not have `prose-post`.

- [ ] **Step 3: Load Merriweather through Next.js**

Update the font import in `app/layout.tsx`:

```tsx
import { Roboto, Roboto_Slab, JetBrains_Mono, Merriweather } from 'next/font/google'
```

Add this definition after `jetbrainsMono`:

```tsx
const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['400', '700'],
  style: ['normal', 'italic'],
})
```

Include its variable on the root `<html>` element while retaining all existing variables and classes:

```tsx
className={`${roboto.variable} ${robotoSlab.variable} ${jetbrainsMono.variable} ${merriweather.variable} scroll-smooth`}
```

- [ ] **Step 4: Define the opt-in post typography modifier**

Add the family under `theme.extend.fontFamily` in `tailwind.config.js`:

```js
proseBody: ['var(--font-merriweather)', 'Georgia', 'serif'],
```

Add a `post` modifier alongside `DEFAULT` and `invert` in the object returned by `typography`:

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
    },
  },
},
```

Do not change the `DEFAULT` or `invert` rules. This leaves author-page prose, headings, links, captions, and code on their existing typography.

- [ ] **Step 5: Opt all blog post layouts into the modifier**

In `layouts/PostLayout.tsx`, update the content wrapper:

```tsx
<ProsePopovers className="prose prose-post prose-gray max-w-none dark:prose-invert">
```

In `layouts/PostSimple.tsx`, make the same wrapper update:

```tsx
<ProsePopovers className="prose prose-post prose-gray max-w-none dark:prose-invert">
```

In `layouts/PostBanner.tsx`, update the content wrapper:

```tsx
<div className="prose prose-post max-w-none py-4 dark:prose-invert">{children}</div>
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
yarn test:run __tests__/typographyConfig.test.js layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx --runInBand
```

Expected: PASS, including the 2 typography configuration tests and both new layout tests.

- [ ] **Step 7: Run all automated tests**

Run:

```bash
yarn test:run --runInBand
```

Expected: all Jest test suites pass.

- [ ] **Step 8: Run the production build**

Run:

```bash
yarn build
```

Expected: Next.js and the postbuild scripts complete successfully, confirming the Merriweather import options and generated Tailwind CSS are valid.

- [ ] **Step 9: Review the generated behavior in a blog post**

Run:

```bash
yarn dev
```

Open any rendered blog post and inspect a paragraph, a list, a heading, inline code, and post metadata. Confirm paragraphs and list text resolve to Merriweather at `17.6px` with the existing `1.6` line height; headings remain Roboto Slab, code remains JetBrains Mono, and metadata remains Roboto. Also inspect the author page and confirm its prose remains Roboto. Stop the development server after verification.

- [ ] **Step 10: Commit the implementation**

```bash
git add __tests__/typographyConfig.test.js app/layout.tsx tailwind.config.js layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/PostBanner.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
git commit -m "Use Merriweather for post body text"
```
