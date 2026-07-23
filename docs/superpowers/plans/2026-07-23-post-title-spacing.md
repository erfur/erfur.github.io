# Post Title Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge titles and increase the space below the header in the supported post template.

**Architecture:** Apply responsive, template-local Tailwind utilities to `PostLayout` so shared headline tokens and unrelated layouts do not change. Lock the treatment down with focused React Testing Library assertions in the layout's existing test file.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, Jest, React Testing Library

## Global Constraints

- Apply the change only to `PostLayout`.
- Use a `1.75rem` title with a `2.25rem` line height on mobile.
- Use a `2.25rem` title with a `2.75rem` line height from the `sm` breakpoint onward.
- Increase post header bottom padding from `2rem` to `2.5rem`.
- Preserve existing top padding, metadata layout, title weight, letter spacing, colors, banners, and post body typography.
- Do not change the retained `components/PostBanner.tsx`, other layouts, or shared typography tokens.

---

### Task 1: Update Text-First Post Header Typography And Spacing

**Files:**
- Modify: `layouts/__tests__/PostLayout.test.tsx`
- Modify: `layouts/PostLayout.tsx:47-72`

**Interfaces:**
- Consumes: Existing `PostLayout` props and rendered post content.
- Produces: Responsive title sizing and `2.5rem` header bottom padding in `PostLayout`; no new exported interfaces.

- [ ] **Step 1: Write failing layout tests**

Append this test to `layouts/__tests__/PostLayout.test.tsx`:

```tsx
it('gives the post title more size and space before the body', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  const title = screen.getByRole('heading', { level: 1, name: 'Example Post' })
  expect(title).toHaveClass(
    'text-[1.75rem]',
    'leading-[2.25rem]',
    'font-bold',
    'tracking-[-0.02em]',
    'sm:text-[2.25rem]',
    'sm:leading-[2.75rem]'
  )
  expect(title).not.toHaveClass('text-headline-lg-mobile', 'sm:text-headline-lg')
  expect(title.closest('header')).toHaveClass('pb-10', 'pt-4')
})
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
yarn test:run layouts/__tests__/PostLayout.test.tsx --runInBand
```

Expected: FAIL because the headings still have `text-headline-lg-mobile sm:text-headline-lg` and the headers still have `pb-8`.

- [ ] **Step 3: Update the post header**

In `layouts/PostLayout.tsx`, change the header opening tag to:

```tsx
<header className="pb-10 pt-4">
```

Replace the title opening tag with:

```tsx
<h1 className="text-[1.75rem] leading-[2.25rem] font-bold tracking-[-0.02em] text-on-surface dark:text-inverse-on-surface sm:text-[2.25rem] sm:leading-[2.75rem]">
```

Keep the existing `{title}` child and closing `</h1>` unchanged. The explicit `font-bold` and `tracking-[-0.02em]` preserve properties previously supplied by the shared headline utilities.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
yarn test:run layouts/__tests__/PostLayout.test.tsx --runInBand
```

Expected: PASS for the focused test suite.

- [ ] **Step 5: Run full verification**

Run each command independently:

```bash
yarn test:run --runInBand
yarn lint
yarn build
git diff --check
```

Expected: all Jest suites pass, lint exits successfully, the production build completes successfully, and `git diff --check` prints no output.

- [ ] **Step 6: Commit the implementation**

Stage only the implementation and test files, then commit:

```bash
git add layouts/PostLayout.tsx layouts/__tests__/PostLayout.test.tsx
git commit -m "Give post titles more room"
```
