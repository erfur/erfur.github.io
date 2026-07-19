# Remove Author Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the unreachable author-page layout and its dedicated tests while preserving blog post author metadata.

**Architecture:** Remove only the obsolete presentation unit and the tests coupled to it. Keep the Contentlayer `Authors` document type, `data/authors/default.mdx`, and blog route author resolution unchanged, then verify the retained content pipeline through the complete test and production build commands.

**Tech Stack:** Next.js 14, React 18, TypeScript, Contentlayer2, Jest, Yarn 3

## Global Constraints

- Delete only `layouts/AuthorLayout.tsx` and `layouts/__tests__/AuthorLayout.test.tsx`.
- Keep `data/authors/default.mdx` and the Contentlayer `Authors` document type.
- Keep blog post author resolution and metadata unchanged.
- Do not rewrite historical design documents or generic starter-template documentation.

---

## File Structure

- Delete `layouts/AuthorLayout.tsx`: unreachable author/contact page presentation.
- Delete `layouts/__tests__/AuthorLayout.test.tsx`: tests dedicated exclusively to the deleted layout.
- Preserve `contentlayer.config.ts`: author content schema still used by posts.
- Preserve `data/authors/default.mdx`: default author metadata still consumed by posts.
- Preserve `app/blog/[...slug]/page.tsx`: existing Open Graph and JSON-LD author resolution.

### Task 1: Remove the Obsolete Author Page Unit

**Files:**
- Delete: `layouts/AuthorLayout.tsx`
- Delete: `layouts/__tests__/AuthorLayout.test.tsx`

**Interfaces:**
- Consumes: No runtime interfaces; application routes do not import `AuthorLayout`.
- Produces: A codebase without the unreachable author-page presentation unit, while blog author metadata remains available through Contentlayer.

- [ ] **Step 1: Establish the dedicated test baseline**

Run:

```bash
NODE_ENV=test yarn test:run layouts/__tests__/AuthorLayout.test.tsx --runInBand
```

Expected: PASS with the existing three `AuthorLayout` tests, confirming the test file is valid before its intentional removal. The explicit environment override is required because the host shell exports `NODE_ENV=production`.

- [ ] **Step 2: Confirm no application code imports the layout**

Run:

```bash
rg --glob '!docs/**' --glob '!layouts/__tests__/AuthorLayout.test.tsx' 'AuthorLayout' .
```

Expected: the only match is the declaration in `layouts/AuthorLayout.tsx`; no route, component, or other active test imports it. Stop and investigate instead of deleting the layout if another active-code reference appears.

- [ ] **Step 3: Delete the obsolete implementation and its tests**

Delete these files in full:

```text
layouts/AuthorLayout.tsx
layouts/__tests__/AuthorLayout.test.tsx
```

Do not modify `contentlayer.config.ts`, `data/authors/default.mdx`, or `app/blog/[...slug]/page.tsx`.

- [ ] **Step 4: Verify active code has no stale layout references**

Run:

```bash
rg --glob '!docs/**' 'AuthorLayout' .
```

Expected: exit status 1 with no output, meaning no active code references remain.

- [ ] **Step 5: Run the full test suite**

Run:

```bash
NODE_ENV=test yarn test:run --runInBand
```

Expected: PASS with all remaining Jest suites and tests successful.

- [ ] **Step 6: Run the production build**

Run:

```bash
yarn build
```

Expected: exit status 0 after Next.js compilation, static page generation, and the post-build script. Blog pages compile while continuing to resolve author metadata from Contentlayer.

- [ ] **Step 7: Review the focused diff**

Run:

```bash
git diff --stat
git diff -- layouts/AuthorLayout.tsx layouts/__tests__/AuthorLayout.test.tsx
git status --short
```

Expected: the implementation diff contains exactly the two deleted files plus this implementation plan. Do not stage or modify unrelated worktree changes if any appear.

- [ ] **Step 8: Commit the removal and plan**

```bash
git add docs/superpowers/plans/2026-07-19-remove-author-page.md layouts/AuthorLayout.tsx layouts/__tests__/AuthorLayout.test.tsx
git commit -m "Remove obsolete author page layout"
```

Expected: one commit containing the implementation plan and the two file deletions.
