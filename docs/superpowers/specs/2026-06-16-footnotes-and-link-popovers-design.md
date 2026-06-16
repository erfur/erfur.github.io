# Footnotes & Link Popovers — Design

Date: 2026-06-16
Status: Approved (design)

## Goal

Replace the conventional "footnotes list at the bottom of the post" experience
with inline popovers, and give external links the same popover treatment with
quick actions:

- **Text footnotes** (`[^1]`): clicking the marker opens a popover showing the
  note text.
- **External links**: clicking opens a popover with two actions — **Visit** and
  **Copy** — instead of navigating directly.

Popovers appear in the left gutter on desktop (mirroring the right-gutter TOC /
back-to-top controls) and directly below the line on mobile.

## Decisions (confirmed)

1. **Authoring:** standard markdown footnotes `text[^1]` + `[^1]: note`.
   `remark-gfm` is already enabled, so no markdown-pipeline changes.
2. **Link scope:** external links only. Internal links (`/...`) and in-page
   anchors (`#...`) keep navigating/jumping normally.
3. **Bottom footnotes list:** removed (hidden). Popovers are the only way to
   read notes.
4. **Interaction:** click to toggle; only one popover open at a time; click
   outside or `Esc` closes; clicking another trigger moves the popover.
5. **Desktop popover position:** anchored to the clicked line and scrolls with
   the content (not pinned like the TOC).

## Architecture

### New component: `components/ProsePopovers.tsx` (client)

Wraps the rendered MDX body. In `PostLayout` (and `PostSimple` for
consistency), the existing

```tsx
<div className="prose prose-gray max-w-none dark:prose-invert">{children}</div>
```

becomes

```tsx
<ProsePopovers className="prose prose-gray max-w-none dark:prose-invert">
  {children}
</ProsePopovers>
```

`ProsePopovers` renders a positioned (`relative`) container holding `{children}`
plus a single `<Popover>` portal-ish child, and owns all popover state.

Responsibilities:

1. **Footnote extraction (on mount):** read `section[data-footnotes]` inside the
   container, build a map `fnId -> note HTML` (the `<li>` inner content minus the
   trailing back-reference `↩` anchor). The section itself is hidden via CSS
   (see below), so it never shows but remains readable in the DOM.
2. **Delegated click handling** on the container:
   - target is a footnote marker — `a[data-footnote-ref]` (fallback:
     `a[href^="#user-content-fn"]`): `preventDefault`, open a **text** popover
     anchored to the marker, content = the mapped note HTML.
   - target is an **external** link — an `<a>` whose `href` does not start with
     `/` or `#` (matches `CustomLink`'s "external" branch) and is not a footnote
     marker/back-ref: `preventDefault`, open a **link** popover anchored to the
     link, content = the URL.
   - anything else: ignore (normal behavior).
3. **Single popover state:** `{ kind: 'text' | 'link', html?, url?, anchorRect }`
   or `null`. Toggling the same trigger closes it; a different trigger replaces
   it. Outside-click and `Esc` close it.

### `Popover` (subcomponent of `ProsePopovers`)

- **Variants:**
  - `text`: renders the footnote note HTML (`dangerouslySetInnerHTML`).
  - `link`: shows the URL (truncated) and two buttons:
    - **Visit** → opens URL in a new tab (`target="_blank" rel="noopener noreferrer"`).
    - **Copy** → `navigator.clipboard.writeText(url)`, shows a transient
      "Copied" state (~1.5s).
- **Visual:** rounded card matching the TOC/back-to-top — `rounded-2xl`,
  `bg-slate-100 dark:bg-slate-800`, padding, subtle shadow, width ~`14rem`
  (`w-56`) on desktop; full prose width on mobile.
- **Position:** absolute, relative to the `ProsePopovers` container.
  - **≥ `xl`:** placed in the left gutter — right edge ~`1rem` left of the
    article column (mirror of the right controls at `left-[calc(50%+25rem)]`),
    vertically aligned to the trigger; scrolls with the content.
  - **< `xl`:** placed directly below the trigger's line, spanning the prose
    width.

### `css/tailwind.css`

- Hide the generated footnotes section: `.prose [data-footnotes] { display: none }`.
- Optional: style footnote markers (`.prose a[data-footnote-ref]`) — primary
  color, no underline, cursor pointer.

## Scope / boundaries

- Affects **post body (prose) only**, inside post layouts. Header, footer, TOC,
  and nav links are untouched.
- A footnote note may contain inline formatting/links; its HTML is rendered as-is
  in the popover. Links inside a note are **not** recursively turned into
  popovers (rare; they behave as normal links).
- No change to the markdown pipeline or contentlayer config.

## Files

- `components/ProsePopovers.tsx` — new client component (container + Popover).
- `layouts/PostLayout.tsx` — wrap prose with `ProsePopovers`.
- `layouts/PostSimple.tsx` — same wrap, for consistency.
- `css/tailwind.css` — hide footnotes section; marker styling.

## Verification

- A post with `[^1]` footnotes: marker click opens the note popover (left gutter
  on desktop, below the line on mobile); bottom list is gone.
- An external link: click opens Visit/Copy popover; Visit opens a new tab; Copy
  writes to clipboard with confirmation.
- Internal links and `#anchors` still navigate/jump normally.
- Only one popover open at a time; outside-click and `Esc` close it.
- A post with no footnotes / no external links is unaffected.
