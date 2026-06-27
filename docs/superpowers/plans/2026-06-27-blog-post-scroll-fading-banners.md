# Blog Post Scroll-Fading Banners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional blog post banners from `images[0]` that fade as the reader scrolls down.

**Architecture:** Create one focused client component, `PostBanner`, responsible for rendering and scroll-driven opacity. Keep existing post layouts as server components that only normalize `content.images` and render the banner above the existing header. Keep banner authoring guidance in root `AGENTS.md`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Contentlayer, Jest, React Testing Library.

## Global Constraints

- Reuse the existing `images` frontmatter field; the banner source is `images[0]`.
- Do not add a separate `banner` frontmatter field.
- Posts without `images` must render without a banner and otherwise stay visually unchanged.
- Support both `layouts/PostLayout.tsx` and `layouts/PostSimple.tsx`.
- Keep banner rendering outside `ProsePopovers` so footnote/link popovers are unaffected.
- Respect `prefers-reduced-motion` by keeping the banner fully visible.
- Root `AGENTS.md` must explain how to add a blog banner.

---

## File Structure

- Create `components/PostBanner.tsx`: client component that renders the responsive banner and owns scroll/reduced-motion behavior.
- Create `components/__tests__/PostBanner.test.tsx`: focused tests for banner rendering, scroll fading, missing source fallback, and reduced motion.
- Modify `layouts/PostLayout.tsx`: import `PostBanner`, derive `bannerSrc` from `content.images`, render banner above the header.
- Modify `layouts/PostSimple.tsx`: same banner integration as `PostLayout`.
- Create `layouts/__tests__/PostLayout.test.tsx`: verifies `PostLayout` renders `images[0]` and omits the banner without images.
- Create `layouts/__tests__/PostSimple.test.tsx`: verifies `PostSimple` renders `images[0]` and omits the banner without images.
- Keep `AGENTS.md`: already documents banner authoring. The final task verifies the text remains present.

---

### Task 1: `PostBanner` Component

**Files:**
- Create: `components/PostBanner.tsx`
- Create: `components/__tests__/PostBanner.test.tsx`

**Interfaces:**
- Consumes: `src: string | undefined`, `alt: string`
- Produces: default export `PostBanner({ src, alt }: PostBannerProps): JSX.Element | null`
- Produces: a visible image with `data-testid="post-banner"`

- [ ] **Step 1: Write the failing component tests**

Create `components/__tests__/PostBanner.test.tsx` with this content:

```tsx
import { act, render, screen } from '@testing-library/react'
import PostBanner from '@/components/PostBanner'

const originalRequestAnimationFrame = window.requestAnimationFrame
const originalCancelAnimationFrame = window.cancelAnimationFrame
const originalMatchMedia = window.matchMedia

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value,
  })
}

function setReducedMotion(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

beforeEach(() => {
  setScrollY(0)
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  }
  window.cancelAnimationFrame = jest.fn()
  setReducedMotion(false)
})

afterEach(() => {
  window.requestAnimationFrame = originalRequestAnimationFrame
  window.cancelAnimationFrame = originalCancelAnimationFrame
  window.matchMedia = originalMatchMedia
})

it('renders the banner image when a source is provided', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')
  const image = screen.getByAltText('Example post')

  expect(banner).toBeInTheDocument()
  expect(image).toHaveAttribute('src', expect.stringContaining('/static/images/example/banner.jpg'))
})

it('renders nothing without a source', () => {
  render(<PostBanner src={undefined} alt="Example post" />)

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})

it('fades as the user scrolls down', () => {
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveStyle({ opacity: '1' })

  act(() => {
    setScrollY(144)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(Number(banner.style.opacity)).toBeLessThan(1)
  expect(Number(banner.style.opacity)).toBeGreaterThan(0)

  act(() => {
    setScrollY(320)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(banner).toHaveStyle({ opacity: '0' })
})

it('stays fully visible when reduced motion is preferred', () => {
  setReducedMotion(true)
  render(<PostBanner src="/static/images/example/banner.jpg" alt="Example post" />)

  const banner = screen.getByTestId('post-banner')

  act(() => {
    setScrollY(320)
    window.dispatchEvent(new Event('scroll'))
  })

  expect(banner).toHaveStyle({ opacity: '1' })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
yarn test:run components/__tests__/PostBanner.test.tsx
```

Expected: FAIL because `@/components/PostBanner` does not exist.

- [ ] **Step 3: Implement `PostBanner`**

Create `components/PostBanner.tsx` with this content:

```tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const FADE_DISTANCE = 288

interface PostBannerProps {
  src?: string
  alt: string
}

export default function PostBanner({ src, alt }: PostBannerProps) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setOpacity(1)
      return
    }

    let frame: number | null = null

    const updateOpacity = () => {
      frame = null
      const progress = Math.min(window.scrollY / FADE_DISTANCE, 1)
      setOpacity(Number((1 - progress).toFixed(3)))
    }

    const onScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(updateOpacity)
    }

    updateOpacity()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  if (!src) {
    return null
  }

  return (
    <div
      data-testid="post-banner"
      className="relative mb-8 h-48 overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-gray-800 sm:h-64"
      style={{ opacity }}
    >
      <Image src={src} alt={alt} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
    </div>
  )
}
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run:

```bash
yarn test:run components/__tests__/PostBanner.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add components/PostBanner.tsx components/__tests__/PostBanner.test.tsx
git commit -m "Add fading post banner component"
```

Expected: commit succeeds with only the component and its tests staged.

---

### Task 2: Post Layout Integration

**Files:**
- Modify: `layouts/PostLayout.tsx`
- Modify: `layouts/PostSimple.tsx`
- Create: `layouts/__tests__/PostLayout.test.tsx`
- Create: `layouts/__tests__/PostSimple.test.tsx`
- Read/verify: `AGENTS.md`

**Interfaces:**
- Consumes: default export `PostBanner({ src, alt })` from `@/components/PostBanner`
- Produces: `PostLayout` and `PostSimple` render a banner from the first string in `content.images`
- Produces: layouts omit `PostBanner` when `content.images` is missing, empty, or not an array

- [ ] **Step 1: Write failing layout tests for `PostLayout`**

Create `layouts/__tests__/PostLayout.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react'
import PostLayout from '@/layouts/PostLayout'

jest.mock('@/components/PostBanner', () => ({
  __esModule: true,
  default: ({ src, alt }: { src?: string; alt: string }) =>
    src ? <div data-testid="post-banner" data-src={src} data-alt={alt} /> : null,
}))

jest.mock('@/components/ScrollTopAndComment', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/TableOfContents', () => ({
  TableOfContentsMobile: () => null,
  TableOfContentsDesktop: () => null,
}))

const baseContent = {
  slug: 'example-post',
  date: '2026-06-27',
  title: 'Example Post',
  tags: [],
}

it('renders the first image as the post banner', () => {
  render(
    <PostLayout
      content={{
        ...baseContent,
        images: ['/static/images/example/banner.jpg', '/static/images/example/other.jpg'],
      } as never}
      authorDetails={[]}
    >
      <p>body</p>
    </PostLayout>
  )

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveAttribute('data-src', '/static/images/example/banner.jpg')
  expect(banner).toHaveAttribute('data-alt', 'Example Post')
})

it('does not render a post banner without images', () => {
  render(
    <PostLayout content={baseContent as never} authorDetails={[]}>
      <p>body</p>
    </PostLayout>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Write failing layout tests for `PostSimple`**

Create `layouts/__tests__/PostSimple.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react'
import PostSimple from '@/layouts/PostSimple'

jest.mock('@/components/PostBanner', () => ({
  __esModule: true,
  default: ({ src, alt }: { src?: string; alt: string }) =>
    src ? <div data-testid="post-banner" data-src={src} data-alt={alt} /> : null,
}))

jest.mock('@/components/ScrollTopAndComment', () => ({
  __esModule: true,
  default: () => null,
}))

const baseContent = {
  slug: 'example-post',
  date: '2026-06-27',
  title: 'Example Post',
}

it('renders the first image as the post banner', () => {
  render(
    <PostSimple
      content={{
        ...baseContent,
        images: ['/static/images/example/banner.jpg', '/static/images/example/other.jpg'],
      } as never}
    >
      <p>body</p>
    </PostSimple>
  )

  const banner = screen.getByTestId('post-banner')
  expect(banner).toHaveAttribute('data-src', '/static/images/example/banner.jpg')
  expect(banner).toHaveAttribute('data-alt', 'Example Post')
})

it('does not render a post banner without images', () => {
  render(
    <PostSimple content={baseContent as never}>
      <p>body</p>
    </PostSimple>
  )

  expect(screen.queryByTestId('post-banner')).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run the layout tests to verify they fail**

Run:

```bash
yarn test:run layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
```

Expected: FAIL because neither layout imports or renders `PostBanner`.

- [ ] **Step 4: Integrate `PostBanner` into `PostLayout`**

Modify `layouts/PostLayout.tsx` so the import block includes `PostBanner`:

```tsx
import PostBanner from '@/components/PostBanner'
```

Modify the content destructuring in `PostLayout`:

```tsx
  const { slug, date, title, tags, images } = content
  const bannerSrc = Array.isArray(images) && typeof images[0] === 'string' ? images[0] : undefined
```

Render the banner immediately inside `<article>` and before the existing header comment:

```tsx
          <PostBanner src={bannerSrc} alt={title} />

          {/* Header */}
```

- [ ] **Step 5: Integrate `PostBanner` into `PostSimple`**

Modify `layouts/PostSimple.tsx` so the import block includes `PostBanner`:

```tsx
import PostBanner from '@/components/PostBanner'
```

Modify the content destructuring in `PostSimple`:

```tsx
  const { slug, date, title, images } = content
  const bannerSrc = Array.isArray(images) && typeof images[0] === 'string' ? images[0] : undefined
```

Render the banner immediately inside `<article>` and before the existing header comment:

```tsx
        <PostBanner src={bannerSrc} alt={title} />

        {/* Header */}
```

- [ ] **Step 6: Run layout tests to verify they pass**

Run:

```bash
yarn test:run layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Verify agent documentation remains present**

Run:

```bash
rg "Blog Post Banners|images\[0\]|/static/images" AGENTS.md
```

Expected: output includes the banner section heading, the `images[0]` convention, and `/static/images` guidance.

- [ ] **Step 8: Run the focused banner and layout tests together**

Run:

```bash
yarn test:run components/__tests__/PostBanner.test.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
git commit -m "Add post banner layout support"
```

Expected: commit succeeds with only layout integration and layout tests staged.

---

### Task 3: Final Verification

**Files:**
- Verify: `components/PostBanner.tsx`
- Verify: `layouts/PostLayout.tsx`
- Verify: `layouts/PostSimple.tsx`
- Verify: `AGENTS.md`

**Interfaces:**
- Consumes: all code from Tasks 1 and 2
- Produces: verified working tree ready for review or integration

- [ ] **Step 1: Run the full test suite once**

Run:

```bash
yarn test:run
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
yarn lint
```

Expected: PASS or only auto-fixed formatting/lint changes. If lint modifies files, inspect `git diff`, rerun the focused tests from Task 2, then stage only intended files in the final commit.

- [ ] **Step 3: Run production build**

Run:

```bash
yarn build
```

Expected: PASS.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff -- components/PostBanner.tsx components/__tests__/PostBanner.test.tsx layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx AGENTS.md
```

Expected: no unstaged changes unless lint produced intentional formatting changes.

- [ ] **Step 5: Commit any verification-only formatting changes**

If Step 2 produced formatting changes, run:

```bash
git add components/PostBanner.tsx components/__tests__/PostBanner.test.tsx layouts/PostLayout.tsx layouts/PostSimple.tsx layouts/__tests__/PostLayout.test.tsx layouts/__tests__/PostSimple.test.tsx
git commit -m "Polish post banner implementation"
```

Expected: commit succeeds only if there were verification-only formatting changes. If there are no changes, do not create a commit.

---

## Self-Review

- Spec coverage: Task 1 covers client banner rendering, scroll fading, reduced motion, and responsive visual treatment. Task 2 covers `images[0]`, both post layouts, no-image fallback, and agent documentation verification. Task 3 covers test, lint, and build verification.
- Placeholder scan: no `TBD`, `TODO`, incomplete implementation instructions, or unspecified tests remain.
- Type consistency: `PostBanner` accepts `src?: string` and `alt: string`; both layouts pass `bannerSrc` and `title` with matching names.
