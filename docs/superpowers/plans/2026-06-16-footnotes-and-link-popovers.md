# Footnotes & Link Popovers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn markdown footnotes and external links in post bodies into click-to-open popovers (footnote text; or Visit/Copy for links), shown in the left gutter on desktop and below the line on mobile.

**Architecture:** A single client component `ProsePopovers` wraps the rendered MDX prose. It reads footnote text from the (CSS-hidden) GFM footnotes section, intercepts clicks on footnote markers and external links via one delegated handler, and renders one absolutely-positioned popover at a time inside the `relative` prose container.

**Tech Stack:** Next.js 14 (app router), React client component, Tailwind + `@tailwindcss/typography`, contentlayer + `remark-gfm` (already configured).

**Testing note:** No JS unit-test runner exists in this repo. Each task is verified against the **running dev server** (`http://localhost:3000`, started with `yarn dev`) using the Playwright install at `/tmp/shot` (`PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers`, `require('/tmp/shot/node_modules/playwright')`). If the dev server is not running, start it: `node .yarn/releases/yarn-3.6.1.cjs dev > /tmp/nextdev.log 2>&1 &` and wait for "Ready" in `/tmp/nextdev.log`.

---

### Task 1: Verification fixture post

A post containing footnotes and each link type, used only for verification. Removed in Task 6.

**Files:**
- Create: `data/blog/_popover_fixture.mdx`

- [ ] **Step 1: Create the fixture post**

Create `data/blog/_popover_fixture.mdx`:

```mdx
---
title: 'Popover Fixture'
date: '2026-06-16'
tags: ['test']
draft: false
summary: 'Fixture for footnote & link popovers.'
---

## Section One

This sentence has a text footnote[^1] and a second one[^2] later on.

Here is an external link to [example.com](https://example.com/some/very/long/path) in a paragraph.
Here is an [internal link](/blog) and an [anchor link](#section-two) that must still navigate.

## Section Two

More text so the page scrolls and Section Two has an id.

[^1]: The first note, with some **bold** text.
[^2]: The second note text.
```

- [ ] **Step 2: Verify the fixture renders**

Ensure the dev server is running, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog/_popover_fixture
```

Expected: `200`

- [ ] **Step 3: Commit**

```bash
git add data/blog/_popover_fixture.mdx
git commit -m "Add popover verification fixture post"
```

---

### Task 2: Hide footnotes section + style markers (CSS)

**Files:**
- Modify: `css/tailwind.css` (append rules at end of file)

- [ ] **Step 1: Inspect the end of the CSS file**

Run: `tail -20 css/tailwind.css`
Note whether it ends inside an `@layer`. Append the new rules at the top level (after any closing brace), not inside an existing rule.

- [ ] **Step 2: Append the rules**

Append to `css/tailwind.css`:

```css
/* Footnotes are shown via popovers (components/ProsePopovers.tsx); hide the generated list. */
.prose [data-footnotes] {
  display: none;
}

/* Footnote markers trigger popovers instead of jumping. */
.prose a[data-footnote-ref] {
  text-decoration: none;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify the footnotes section is hidden**

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers node -e "
const { chromium } = require('/tmp/shot/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:3000/blog/_popover_fixture', { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const s = document.querySelector('.prose [data-footnotes]');
    return { exists: !!s, visible: s ? getComputedStyle(s).display !== 'none' : false,
             markers: document.querySelectorAll('.prose a[data-footnote-ref]').length };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
"
```

Expected: `{"exists":true,"visible":false,"markers":2}` (section present in DOM but hidden; 2 markers).

- [ ] **Step 4: Commit**

```bash
git add css/tailwind.css
git commit -m "Hide footnotes section and style footnote markers"
```

---

### Task 3: ProsePopovers component + wire into PostLayout

**Files:**
- Create: `components/ProsePopovers.tsx`
- Modify: `layouts/PostLayout.tsx` (import + replace the prose `<div>`)

- [ ] **Step 1: Create the component**

Create `components/ProsePopovers.tsx`:

```tsx
'use client'

import {
  forwardRef,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type PopoverState =
  | { kind: 'text'; html: string; anchor: HTMLElement }
  | { kind: 'link'; url: string; anchor: HTMLElement }

interface Props {
  className?: string
  children: ReactNode
}

const isFootnoteRef = (a: HTMLAnchorElement) =>
  a.hasAttribute('data-footnote-ref') || (a.getAttribute('href') || '').startsWith('#user-content-fn')

const isExternal = (a: HTMLAnchorElement) => {
  const href = a.getAttribute('href') || ''
  return href.length > 0 && !href.startsWith('/') && !href.startsWith('#')
}

export default function ProsePopovers({ className, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const footnotes = useRef<Map<string, string>>(new Map())
  const [popover, setPopover] = useState<PopoverState | null>(null)

  // Build footnote id -> note HTML from the (hidden) GFM footnotes section.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new Map<string, string>()
    container.querySelectorAll('[data-footnotes] li[id]').forEach((li) => {
      const clone = li.cloneNode(true) as HTMLElement
      clone.querySelectorAll('[data-footnote-backref]').forEach((b) => b.remove())
      map.set(li.id, clone.innerHTML.trim())
    })
    footnotes.current = map
  }, [children])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (popoverRef.current?.contains(e.target as Node)) return // ignore clicks inside the popover
    const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
    if (!a) return

    if (isFootnoteRef(a)) {
      e.preventDefault()
      const id = (a.getAttribute('href') || '').replace(/^#/, '')
      const html = footnotes.current.get(id)
      if (!html) return
      setPopover((cur) => (cur && cur.anchor === a ? null : { kind: 'text', html, anchor: a }))
      return
    }

    if (isExternal(a)) {
      e.preventDefault()
      const url = a.href
      setPopover((cur) => (cur && cur.anchor === a ? null : { kind: 'link', url, anchor: a }))
    }
    // internal / in-page anchor links: do nothing, let them navigate
  }, [])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!popover) return
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return
      if (popover.anchor.contains(e.target as Node)) return
      setPopover(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPopover(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [popover])

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`} onClick={onClick}>
      {children}
      {popover && (
        <Popover ref={popoverRef} state={popover} containerRef={containerRef} />
      )}
    </div>
  )
}

const Popover = forwardRef<
  HTMLDivElement,
  { state: PopoverState; containerRef: RefObject<HTMLDivElement> }
>(function Popover({ state, containerRef }, ref) {
  const [pos, setPos] = useState<{ top: number; mode: 'gutter' | 'inline' } | null>(null)
  const [copied, setCopied] = useState(false)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const c = container.getBoundingClientRect()
    const a = state.anchor.getBoundingClientRect()
    const desktop = window.matchMedia('(min-width: 1280px)').matches
    setPos(
      desktop
        ? { mode: 'gutter', top: a.top - c.top }
        : { mode: 'inline', top: a.bottom - c.top + 8 }
    )
  }, [state, containerRef])

  const onCopy = async () => {
    if (state.kind !== 'link') return
    try {
      await navigator.clipboard.writeText(state.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!pos) return null

  const style =
    pos.mode === 'gutter'
      ? { top: pos.top, right: 'calc(100% + 1rem)' as const }
      : { top: pos.top }

  const btn =
    'rounded-md bg-slate-200 px-3 py-1.5 font-medium text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'

  return (
    <div
      ref={ref}
      role="dialog"
      style={style}
      className={`not-prose absolute z-20 rounded-2xl bg-slate-100 p-4 text-sm shadow-lg dark:bg-slate-800 ${
        pos.mode === 'gutter' ? 'w-56' : 'left-0 right-0'
      }`}
    >
      {state.kind === 'text' ? (
        <div
          className="text-slate-700 [&_a]:text-primary-600 [&_a]:underline [&_p]:m-0 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: state.html }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <span className="break-all text-slate-600 dark:text-slate-400">{state.url}</span>
          <div className="flex gap-2">
            <a href={state.url} target="_blank" rel="noopener noreferrer" className={btn}>
              Visit
            </a>
            <button type="button" onClick={onCopy} className={btn}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
```

- [ ] **Step 2: Wire it into PostLayout**

In `layouts/PostLayout.tsx`, add the import near the other component imports:

```tsx
import ProsePopovers from '@/components/ProsePopovers'
```

Then replace the prose container:

```tsx
<div className="prose prose-gray max-w-none dark:prose-invert">{children}</div>
```

with:

```tsx
<ProsePopovers className="prose prose-gray max-w-none dark:prose-invert">
  {children}
</ProsePopovers>
```

- [ ] **Step 3: Verify footnote text popover (desktop)**

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers node -e "
const { chromium } = require('/tmp/shot/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3000/blog/_popover_fixture', { waitUntil: 'networkidle' });
  await p.click('.prose a[data-footnote-ref]');
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const d = document.querySelector('.prose [role=dialog]');
    const c = document.querySelector('.prose');
    if (!d) return { shown: false };
    const dr = d.getBoundingClientRect(), cr = c.getBoundingClientRect();
    return { shown: true, text: d.textContent.trim(), rightOfGutter: Math.round(dr.right) <= Math.round(cr.left) };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
"
```

Expected: `shown:true`, `text` contains "The first note", `rightOfGutter:true` (popover sits left of the prose column).

- [ ] **Step 4: Verify external link popover + Visit/Copy**

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers node -e "
const { chromium } = require('/tmp/shot/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read','clipboard-write'] });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/blog/_popover_fixture', { waitUntil: 'networkidle' });
  await p.click('.prose a[href^=\"https://example.com\"]');
  await p.waitForTimeout(200);
  const shown = await p.evaluate(() => {
    const d = document.querySelector('.prose [role=dialog]');
    return d ? { url: d.textContent.includes('example.com'), visit: !!d.querySelector('a[target=_blank]'), copy: [...d.querySelectorAll('button')].some(x=>/copy/i.test(x.textContent)) } : null;
  });
  console.log('link popover:', JSON.stringify(shown));
  await p.click('.prose [role=dialog] button');
  await p.waitForTimeout(100);
  const clip = await p.evaluate(() => navigator.clipboard.readText());
  console.log('clipboard:', clip);
  await b.close();
})();
"
```

Expected: `link popover: {\"url\":true,\"visit\":true,\"copy\":true}` and `clipboard: https://example.com/some/very/long/path`.

- [ ] **Step 5: Verify internal/anchor links still navigate + open/close**

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers node -e "
const { chromium } = require('/tmp/shot/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3000/blog/_popover_fixture', { waitUntil: 'networkidle' });
  await p.click('.prose a[href=\"/blog\"]');
  await p.waitForTimeout(500);
  console.log('internal nav ->', p.url());
  await p.goBack(); await p.waitForTimeout(300);
  await p.click('.prose a[data-footnote-ref]'); await p.waitForTimeout(150);
  const open1 = await p.evaluate(() => !!document.querySelector('.prose [role=dialog]'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  const afterEsc = await p.evaluate(() => !!document.querySelector('.prose [role=dialog]'));
  console.log('open:', open1, 'closedOnEsc:', !afterEsc);
  await b.close();
})();
"
```

Expected: `internal nav -> http://localhost:3000/blog`, `open: true closedOnEsc: true`.

- [ ] **Step 6: Commit**

```bash
git add components/ProsePopovers.tsx layouts/PostLayout.tsx
git commit -m "Add footnote and external-link popovers to post body"
```

---

### Task 4: Mobile (below-the-line) positioning check

**Files:** none (verification only; refine `components/ProsePopovers.tsx` if it fails)

- [ ] **Step 1: Verify mobile inline positioning**

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/shot/browsers node -e "
const { chromium } = require('/tmp/shot/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.goto('http://localhost:3000/blog/_popover_fixture', { waitUntil: 'networkidle' });
  const marker = await p.\$('.prose a[data-footnote-ref]');
  await marker.scrollIntoViewIfNeeded();
  await marker.click();
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const d = document.querySelector('.prose [role=dialog]');
    const m = document.querySelector('.prose a[data-footnote-ref]');
    if (!d) return { shown: false };
    const dr = d.getBoundingClientRect(), mr = m.getBoundingClientRect(), c = document.querySelector('.prose').getBoundingClientRect();
    return { shown: true, belowLine: Math.round(dr.top) >= Math.round(mr.bottom), fullWidth: Math.round(dr.width) > c.width * 0.8 };
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
"
```

Expected: `{"shown":true,"belowLine":true,"fullWidth":true}` (popover is below the marker's line and spans most of the prose width).

- [ ] **Step 2: Commit (only if refinements were needed)**

```bash
git add components/ProsePopovers.tsx
git commit -m "Refine mobile popover positioning"
```

(If no changes were needed, skip this commit.)

---

### Task 5: Apply to PostSimple

**Files:**
- Modify: `layouts/PostSimple.tsx`

- [ ] **Step 1: Wire ProsePopovers into PostSimple**

In `layouts/PostSimple.tsx`, add the import:

```tsx
import ProsePopovers from '@/components/ProsePopovers'
```

Replace its prose container:

```tsx
<div className="prose prose-gray max-w-none dark:prose-invert">{children}</div>
```

with:

```tsx
<ProsePopovers className="prose prose-gray max-w-none dark:prose-invert">
  {children}
</ProsePopovers>
```

- [ ] **Step 2: Verify the app still builds (no type/render error)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog/_popover_fixture
grep -iE "Failed to compile|error" /tmp/nextdev.log | tail -3 || echo "no errors"
```

Expected: `200`, no compile errors.

- [ ] **Step 3: Commit**

```bash
git add layouts/PostSimple.tsx
git commit -m "Apply prose popovers to PostSimple layout"
```

---

### Task 6: Remove fixture + final verification

**Files:**
- Delete: `data/blog/_popover_fixture.mdx`

- [ ] **Step 1: Run prettier on the new/changed files**

```bash
node .yarn/releases/yarn-3.6.1.cjs prettier --write components/ProsePopovers.tsx layouts/PostLayout.tsx layouts/PostSimple.tsx css/tailwind.css
```

Expected: files formatted, no errors.

- [ ] **Step 2: Lint the component**

```bash
node .yarn/releases/yarn-3.6.1.cjs lint 2>&1 | tail -15
```

Expected: no errors for the new files (warnings acceptable if pre-existing).

- [ ] **Step 3: Remove the fixture post**

```bash
git rm data/blog/_popover_fixture.mdx
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove popover verification fixture"
```

---

## Notes for the implementer

- The GFM footnotes section is `<section data-footnotes>` with `<li id="user-content-fn-N">`; markers are `<a data-footnote-ref href="#user-content-fn-N">`. All `<a>` pass through `components/Link.tsx` (`CustomLink`), which preserves `data-*`/`id` attributes, so detection by attribute/href works.
- `rehypePresetMinify` runs in the pipeline; if it strips `data-footnote-ref`, fall back to the `href^="#user-content-fn"` check already included in `isFootnoteRef`.
- "External" matches `CustomLink`'s own rule: href that does not start with `/` or `#`.
- The popover lives inside the `.prose` container; `not-prose` keeps typography styles off the popover chrome. The footnote note keeps minimal prose-like styling via the `[&_p]:m-0` / `[&_a]:*` utilities.
