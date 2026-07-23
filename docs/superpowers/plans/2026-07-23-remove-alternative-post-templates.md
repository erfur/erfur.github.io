# Remove Alternative Post Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `PostLayout` the only blog post template and remove the unused template-selection code, files, tests, and active documentation.

**Architecture:** The blog route will import and render `PostLayout` directly instead of selecting a component from a registry. Contentlayer will no longer expose a blog `layout` field, while the unrelated author layout field and the `components/PostBanner.tsx` image component remain intact.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Contentlayer2, Jest, Testing Library

## Global Constraints

- Preserve `components/PostBanner.tsx` and its tests because `PostLayout` uses it for `images[0]`.
- Preserve historical files under `docs/superpowers/specs` and `docs/superpowers/plans`.
- Do not add compatibility aliases for `PostSimple` or the removed `PostBanner` layout.
- Keep the author document's separate `layout` field unchanged.
- Do not modify unrelated untracked or worktree changes.

---

### Task 1: Collapse Blog Rendering To PostLayout

**Files:**
- Create: `__tests__/singlePostLayoutSource.test.js`
- Modify: `app/blog/[...slug]/page.tsx:10-22,109-125`
- Modify: `contentlayer.config.ts:84-95`
- Test: `layouts/__tests__/PostLayout.test.tsx`
- Test: `components/__tests__/PostBanner.test.tsx`

**Interfaces:**
- Consumes: `PostLayout({ content, authorDetails, next, prev, toc, children })` from `layouts/PostLayout.tsx`.
- Produces: A blog route with one direct `PostLayout` render, a `Blog` document schema with no `layout` field, and a source-level regression test for that architecture.

- [ ] **Step 1: Write the failing single-layout source test**

Create `__tests__/singlePostLayoutSource.test.js`:

```js
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const routeSource = fs.readFileSync(path.join(root, 'app/blog/[...slug]/page.tsx'), 'utf8')
const contentlayerSource = fs.readFileSync(path.join(root, 'contentlayer.config.ts'), 'utf8')
const blogSchema = contentlayerSource.slice(
  contentlayerSource.indexOf('export const Blog'),
  contentlayerSource.indexOf('export const Authors')
)
const authorSchema = contentlayerSource.slice(contentlayerSource.indexOf('export const Authors'))

it('renders blog posts through one direct layout', () => {
  expect(routeSource.match(/from '@\/layouts\//g)).toHaveLength(1)
  expect(routeSource).toContain('<PostLayout')
  expect(routeSource).not.toMatch(/const layouts\s*=/)
  expect(routeSource).not.toContain('post.layout')
})

it('removes layout selection only from blog frontmatter', () => {
  expect(blogSchema).not.toMatch(/\n\s+layout:/)
  expect(authorSchema).toMatch(/\n\s+layout:/)
})
```

- [ ] **Step 2: Run the source test to verify it fails**

Run:

```bash
NODE_ENV=test npm run test:run -- __tests__/singlePostLayoutSource.test.js --runInBand
```

Expected: FAIL because the route still declares `const layouts`, reads `post.layout`, imports three layouts, and the Blog schema still contains `layout`.

- [ ] **Step 3: Run retained-layout characterization tests before changing the route**

Run:

```bash
NODE_ENV=test npm run test:run -- layouts/__tests__/PostLayout.test.tsx components/__tests__/PostBanner.test.tsx --runInBand
```

Expected: PASS. These tests establish that the retained layout still handles prose typography and optional banners.

- [ ] **Step 4: Remove the alternative imports and registry**

In `app/blog/[...slug]/page.tsx`, reduce the layout imports to:

```tsx
import PostLayout from '@/layouts/PostLayout'
```

Delete these declarations entirely:

```tsx
const defaultLayout = 'PostLayout'
const layouts = {
  PostSimple,
  PostLayout,
  PostBanner,
}
```

- [ ] **Step 5: Render PostLayout directly**

Delete this line from `Page`:

```tsx
const Layout = layouts[post.layout || defaultLayout]
```

Replace the dynamic wrapper:

```tsx
<Layout
  content={mainContent}
  authorDetails={authorDetails}
  next={next}
  prev={prev}
  toc={post.toc}
>
  <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
</Layout>
```

with:

```tsx
<PostLayout
  content={mainContent}
  authorDetails={authorDetails}
  next={next}
  prev={prev}
  toc={post.toc}
>
  <MDXLayoutRenderer code={post.body.code} components={components} toc={post.toc} />
</PostLayout>
```

- [ ] **Step 6: Remove layout selection from the Blog schema**

In the `Blog` fields inside `contentlayer.config.ts`, remove:

```ts
layout: { type: 'string' },
```

Do not remove the same-named field from `Authors`.

- [ ] **Step 7: Run the source and focused tests**

Run:

```bash
NODE_ENV=test npm run test:run -- __tests__/singlePostLayoutSource.test.js layouts/__tests__/PostLayout.test.tsx components/__tests__/PostBanner.test.tsx --runInBand
```

Expected: PASS with all three suites passing.

- [ ] **Step 8: Check the runtime and schema diff**

Run:

```bash
git diff --check -- "app/blog/[...slug]/page.tsx" contentlayer.config.ts __tests__/singlePostLayoutSource.test.js
git diff -- "app/blog/[...slug]/page.tsx" contentlayer.config.ts __tests__/singlePostLayoutSource.test.js
```

Expected: no whitespace errors; the diff contains only the direct-layout and Blog schema changes described above.

- [ ] **Step 9: Commit the runtime simplification**

```bash
git add "app/blog/[...slug]/page.tsx" contentlayer.config.ts __tests__/singlePostLayoutSource.test.js
git commit -m "Simplify blog post rendering"
```

Expected: one commit containing only the route, schema, and architectural regression test changes.

---

### Task 2: Delete Alternative Layout Artifacts

**Files:**
- Delete: `layouts/PostSimple.tsx`
- Delete: `layouts/PostBanner.tsx`
- Delete: `layouts/__tests__/PostSimple.test.tsx`
- Delete: `layouts/__tests__/PostBanner.test.tsx`
- Modify: `README.md:203-205,220-248`
- Test: `layouts/__tests__/PostLayout.test.tsx`
- Test: `components/__tests__/PostBanner.test.tsx`

**Interfaces:**
- Consumes: The direct `PostLayout` route and Blog schema produced by Task 1.
- Produces: One active post template, documentation for only that template, and no active references to removed layout selectors.

- [ ] **Step 1: Confirm no blog content needs migration**

Run:

```bash
rg '^layout:\s*' data/blog --glob '*.md' --glob '*.mdx'
```

Expected: no output and exit status 1, confirming no current post selects a removed layout.

- [ ] **Step 2: Delete the obsolete layouts and their focused tests**

Delete these files in full:

```text
layouts/PostSimple.tsx
layouts/PostBanner.tsx
layouts/__tests__/PostSimple.test.tsx
layouts/__tests__/PostBanner.test.tsx
```

Do not delete either of these retained files:

```text
components/PostBanner.tsx
components/__tests__/PostBanner.test.tsx
```

- [ ] **Step 3: Update the active layout documentation**

In `README.md`, replace the three-layout bullet:

```markdown
- There are currently 3 post layouts available: `PostLayout`, `PostSimple` and `PostBanner`. `PostLayout` is the default 2 column layout with meta and author information. `PostSimple` is a simplified version of `PostLayout`, while `PostBanner` features a banner image.
```

with:

```markdown
- `PostLayout` is the blog post template. It displays post metadata, an optional banner from `images[0]`, and the table of contents.
```

Remove this item from the supported blog frontmatter list:

```text
layout (optional list which should correspond to the file names in `data/layouts`)
```

Remove this line from the example frontmatter:

```yaml
layout: PostLayout
```

- [ ] **Step 4: Format and inspect the cleanup**

Run:

```bash
npx prettier --write README.md "app/blog/[...slug]/page.tsx" contentlayer.config.ts __tests__/singlePostLayoutSource.test.js
git diff --check
git status --short
```

Expected: formatting succeeds, `git diff --check` prints nothing, and status shows only the four deletions plus intended README changes and any pre-existing unrelated changes.

- [ ] **Step 5: Verify active template references are gone**

Run:

```bash
rg 'PostSimple|layouts/PostBanner|post\.layout|layout: PostLayout|const layouts' app components layouts data/blog contentlayer.config.ts README.md
```

Expected: no output and exit status 1. References in historical `docs/superpowers` files are intentionally outside this search. The retained `components/PostBanner.tsx` is not matched by the layout-specific `layouts/PostBanner` expression.

- [ ] **Step 6: Run focused retained-layout tests**

Run:

```bash
NODE_ENV=test npm run test:run -- layouts/__tests__/PostLayout.test.tsx components/__tests__/PostBanner.test.tsx --runInBand
```

Expected: PASS with both suites passing.

- [ ] **Step 7: Run the complete test suite**

Run:

```bash
NODE_ENV=test npm run test:run -- --runInBand
```

Expected: PASS with no test attempting to import either deleted layout.

- [ ] **Step 8: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS, including Contentlayer generation, Next.js compilation, static page generation, and the postbuild script.

- [ ] **Step 9: Review and commit the artifact cleanup**

Run:

```bash
git diff -- README.md layouts/PostSimple.tsx layouts/PostBanner.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx
git status --short
```

Expected: the diff contains only the planned active documentation update and four deletions; unrelated worktree files remain unstaged.

Commit:

```bash
git add README.md layouts/PostSimple.tsx layouts/PostBanner.tsx layouts/__tests__/PostSimple.test.tsx layouts/__tests__/PostBanner.test.tsx
git commit -m "Remove alternative post templates"
```

Expected: one commit containing the template, test, and README cleanup.
