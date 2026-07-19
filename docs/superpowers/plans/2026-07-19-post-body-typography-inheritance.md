# Post Body Typography Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use Merriweather throughout post body prose except headings and code, and make inline code match the `1.1rem` post reading size without changing fenced code sizing.

**Architecture:** Keep typography ownership in `tailwind.config.js`. Establish only Merriweather on the `prose-post` root so ordinary descendants inherit it, keep the reading size and line height on paragraphs and lists, remove redundant element-level JetBrains declarations, and retain explicit JetBrains declarations for headings and code. Apply the post inline-code size with a selector that excludes code beneath `pre`, preserving the existing fenced-code sizing chain.

**Tech Stack:** Next.js 14, Tailwind CSS 3, `@tailwindcss/typography`, PostCSS, Jest

## Global Constraints

- Scope the change to existing post wrappers using `prose-post`.
- Keep headings, inline code, and block code in JetBrains Mono.
- Use Merriweather for links, blockquotes, lists, tables, captions, and other post prose.
- Keep paragraphs and lists at the post reading size of `1.1rem` with `1.6` line height without sizing the post root.
- Make inline post code `1.1rem` while preserving its existing color, background, padding, weight, and square geometry.
- Keep existing fenced-code sizing and presentation unchanged.
- Do not change font loading, layouts, content, routing, responsive behavior, dark mode, non-post prose, or interface typography.
- Do not add dependencies.

---

### Task 1: Make Post Typography Inherit Merriweather

**Files:**
- Modify: `tailwind.config.js:103-190`
- Modify: `__tests__/typographyConfig.test.js:93-139`
- Modify: `__tests__/postTypographyCascade.test.js:8-83`

**Interfaces:**
- Consumes: Existing `fontFamily.proseBody`, `typography.DEFAULT`, `typography.post`, `prose-post` wrappers, and `css/prism.css` rule `pre code { font-size: 0.8rem; }`.
- Produces: A `typography.post.css` root family, paragraph/list reading scale, inherited Merriweather for ordinary post prose, and a `code:not(pre code)` inline-size rule.

- [ ] **Step 1: Write failing configuration tests**

In `__tests__/typographyConfig.test.js`, replace the test named `scopes the Merriweather reading scale to post paragraphs and lists` with:

```js
it('uses inherited Merriweather throughout post prose except protected elements', () => {
  const typography = extendedTheme.typography({ theme })

  expect(typography.post.css).toEqual({
    fontFamily: 'var(--font-merriweather), Georgia, serif',
    p: { fontSize: '1.1rem', lineHeight: '1.6' },
    'ul, ol': { fontSize: '1.1rem', lineHeight: '1.6' },
    'code:not(pre code)': { fontSize: '1.1rem', lineHeight: 'inherit' },
  })

  expect(typography.DEFAULT.css.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css['h1,h2,h3,h4,h5,h6'].fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css.code.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css.pre.fontFamily).toBe(
    'var(--font-jetbrains-mono), Menlo, monospace'
  )
  expect(typography.DEFAULT.css.a.fontFamily).toBeUndefined()
  expect(typography.DEFAULT.css.table.fontFamily).toBeUndefined()
  expect(typography.DEFAULT.css.figcaption.fontFamily).toBeUndefined()
})
```

In the test named `preserves the default prose body, inline code, and image geometry`, leave the default inline-code `0.8125rem` assertion unchanged. It protects non-post prose while the post modifier supplies the new size.

- [ ] **Step 2: Extend generated-CSS tests for inheritance and code sizing**

In `__tests__/postTypographyCascade.test.js`, add a blockquote to the raw test content and replace the declaration helper with a property-generic helper:

```js
              <p>Post paragraph</p>
              <blockquote>Quoted prose</blockquote>
```

```js
function generatedDeclaration(selectorFragment, property) {
  let value

  generatedCss.walkRules((rule) => {
    if (rule.selector.includes(selectorFragment)) {
      rule.walkDecls(property, (declaration) => {
        value = declaration.value
      })
    }
  })

  return value
}

function generatedFontFamily(selectorFragment) {
  return generatedDeclaration(selectorFragment, 'font-family')
}

function generatedFontSize(selectorFragment) {
  return generatedDeclaration(selectorFragment, 'font-size')
}

function generatedPostRootDeclaration(property) {
  let value

  generatedCss.walkRules('.prose-post', (rule) => {
    rule.walkDecls(property, (declaration) => {
      value = declaration.value
    })
  })

  return value
}
```

Replace `generates Merriweather declarations for post paragraphs and lists` with:

```js
it('establishes inherited Merriweather on the post prose root', () => {
  expect(generatedFontFamily('.prose-post')).toBe(merriweather)
  expect(generatedPostRootDeclaration('font-size')).toBeUndefined()
  expect(generatedPostRootDeclaration('line-height')).toBeUndefined()
  expect(generatedFontFamily('.prose-post :where(p)')).toBeUndefined()
  expect(generatedFontFamily('.prose-post :where(ul, ol)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(a)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(table)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(figcaption)')).toBeUndefined()
  expect(generatedFontFamily('.prose :where(blockquote)')).toBeUndefined()
})
```

Rename `generates JetBrains declarations for protected elements nested in post lists` to `generates JetBrains declarations only for protected post elements` and keep only these assertions:

```js
expect(generatedFontFamily('.prose :where(h1,h2,h3,h4,h5,h6)')).toBe(jetbrainsMono)
expect(generatedFontFamily('.prose :where(code)')).toBe(jetbrainsMono)
expect(generatedFontFamily('.prose :where(pre)')).toBe(jetbrainsMono)
```

Add this test after it:

```js
it('matches inline code to the post reading size without changing fenced code', () => {
  expect(generatedFontSize('.prose-post :where(code:not(pre code))')).toBe('1.1rem')
  expect(generatedFontSize('.prose :where(pre)')).toBe('0.875em')
  expect(generatedFontSize('.prose :where(pre code)')).toBe('inherit')
})
```

Update the fenced-code inheritance chain in the final test so its last selector is the post root:

```js
expect(
  resolvedFontFamily(
    '.prose :where(pre code)',
    '.prose :where(pre)',
    '.prose-post'
  )
).toBe(jetbrainsMono)
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
NODE_ENV=test npm run test:run -- __tests__/typographyConfig.test.js __tests__/postTypographyCascade.test.js --runInBand
```

Expected: FAIL because `typography.post.css` still assigns Merriweather directly only to paragraphs and lists, links/tables/captions still declare JetBrains Mono, and no post-only `1.1rem` inline-code rule exists.

- [ ] **Step 4: Implement inherited post typography**

In `tailwind.config.js`, remove only the `fontFamily` declarations from `DEFAULT.css.a`, `DEFAULT.css.figcaption`, and `DEFAULT.css.table`. Keep every other property on those objects unchanged.

Replace `typography.post` with:

```js
post: {
  css: {
    fontFamily: theme('fontFamily.proseBody').join(', '),
    p: { fontSize: '1.1rem', lineHeight: '1.6' },
    'ul, ol': { fontSize: '1.1rem', lineHeight: '1.6' },
    'code:not(pre code)': { fontSize: '1.1rem', lineHeight: 'inherit' },
  },
},
```

Do not alter the explicit heading, `code`, `pre`, or `pre code` font-family declarations. The `code:not(pre code)` selector is required so the inline size does not leak into the existing typography/Prism fenced-code sizing chain. The post root must not set size or line height: `pre` retains the typography plugin's `0.875em` size and `pre code` remains `inherit`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
NODE_ENV=test npm run test:run -- __tests__/typographyConfig.test.js __tests__/postTypographyCascade.test.js --runInBand
```

Expected: 2 suites pass.

- [ ] **Step 6: Run full verification**

Run:

```bash
NODE_ENV=test npm run test:run -- --runInBand --testPathIgnorePatterns="<rootDir>/.worktrees/"
npm run lint
npm run build
git diff --check
```

Expected: all Jest suites pass, lint reports no warnings or errors, the production build completes, and `git diff --check` prints nothing.

- [ ] **Step 7: Commit the implementation**

Review `git status` and `git diff`, then stage only the implementation files:

```bash
git add tailwind.config.js __tests__/typographyConfig.test.js __tests__/postTypographyCascade.test.js
git commit -m "Update post body typography"
```
