# Blog Entry Padding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give entries on `/blog`, paginated blog pages, and tag result pages the same 8px horizontal content inset as home-page Latest entries.

**Architecture:** Preserve the shared `ListLayoutWithTags` list structure and remove the negative horizontal margin that cancels each link's existing `px-2`. Protect the spacing contract with the existing post-list semantics test.

**Tech Stack:** React 18, Next.js 14, Tailwind CSS 3, Jest 29, Testing Library

## Global Constraints

- Apply the change only to `layouts/ListLayoutWithTags.tsx`; do not change the unused `layouts/ListLayout.tsx`.
- Preserve the full-width list, row markup, click targets, vertical spacing, borders, alternating backgrounds, hover styling, and responsive behavior.
- Do not commit changes unless the user explicitly requests a commit.

---

### Task 1: Inset Shared Blog And Tag Entries

**Files:**
- Modify: `__tests__/clinicalPrecisionIndexSemantics.test.tsx:103-112`
- Modify: `layouts/ListLayoutWithTags.tsx:134-137`

**Interfaces:**
- Consumes: `ListLayoutWithTags({ posts, title, initialDisplayPosts?, pagination? })` and the existing `layoutPosts` test fixture.
- Produces: Blog and tag post links with Tailwind `px-2` and without `-mx-2`.

- [ ] **Step 1: Write the failing regression test**

Add this test after the existing `insets links in the home Latest list` test in `__tests__/clinicalPrecisionIndexSemantics.test.tsx`:

```tsx
it('insets links in the shared blog and tag list', () => {
  render(<ListLayoutWithTags posts={layoutPosts as never} title="Posts" />)

  const rows = within(screen.getByRole('list')).getAllByRole('listitem')
  rows.forEach((row) => {
    const link = within(row).getByRole('link')
    expect(link).toHaveClass('px-2')
    expect(link).not.toHaveClass('-mx-2')
  })
})
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
yarn test:run __tests__/clinicalPrecisionIndexSemantics.test.tsx --runInBand
```

Expected: FAIL in `insets links in the shared blog and tag list` because each rendered post link still has the `-mx-2` class.

- [ ] **Step 3: Apply the minimal layout change**

In `layouts/ListLayoutWithTags.tsx`, replace the post link's class string:

```tsx
className="group -mx-2 flex items-baseline gap-4 px-2 py-3 transition-colors hover:bg-surface-container dark:hover:bg-[#41474a]"
```

with:

```tsx
className="group flex items-baseline gap-4 px-2 py-3 transition-colors hover:bg-surface-container dark:hover:bg-[#41474a]"
```

- [ ] **Step 4: Run focused verification**

Run:

```bash
yarn test:run __tests__/clinicalPrecisionIndexSemantics.test.tsx --runInBand
```

Expected: PASS, including the home Latest and shared blog/tag inset tests.

- [ ] **Step 5: Run full verification**

Run:

```bash
yarn test:run --runInBand
yarn build
```

Expected: All Jest suites pass and the Next.js production build completes successfully.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git diff --check
git diff -- __tests__/clinicalPrecisionIndexSemantics.test.tsx layouts/ListLayoutWithTags.tsx
```

Expected: No whitespace errors. The code diff contains only the focused regression test and removal of `-mx-2`; no commit is created.
