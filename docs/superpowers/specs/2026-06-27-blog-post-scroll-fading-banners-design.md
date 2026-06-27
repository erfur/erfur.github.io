# Blog Post Scroll-Fading Banners — Design

Date: 2026-06-27
Status: Approved (design)

## Goal

Add optional banner images to blog post templates. When a post declares an image
in frontmatter, the first image appears as a banner above the post header and
fades out as the reader scrolls down into the article.

## Decisions

1. **Authoring:** reuse the existing `images` frontmatter field. The banner
   source is `images[0]`.
2. **Scope:** only blog post templates render banners. Blog list pages, project
   pages, metadata generation, and structured data behavior are unchanged.
3. **Fallback:** posts without `images` render exactly as they do today.
4. **Visual behavior:** the banner starts fully visible at the top of the post,
   then fades toward transparent over the initial scroll distance.
5. **Layouts:** both `layouts/PostLayout.tsx` and `layouts/PostSimple.tsx`
   support the same banner behavior.
6. **Agent guidance:** root `AGENTS.md` documents how to add a banner to a blog
   post so future agents use the existing `images[0]` convention.

## Architecture

### New Client Component: `components/PostBanner.tsx`

`PostBanner` receives a required `src` and `alt` string. It renders nothing when
no usable source is provided by the caller.

Responsibilities:

1. Render the image as a responsive article-width banner above the post header.
2. Track scroll position with a passive `scroll` listener and `requestAnimationFrame`
   to avoid doing React state work for every browser scroll event.
3. Convert scroll progress into opacity. The default fade range should be short
   enough to complete near the top of the article, not after the full page scroll.
4. Respect `prefers-reduced-motion` by keeping the banner static and fully
   visible instead of animating opacity.

The component is client-side because scroll position is browser state. The
existing post layouts remain server components that only decide whether to render
`PostBanner`.

### Layout Integration

In each post layout:

1. Read `images` from `content`.
2. Normalize the banner source to the first image when `images` is an array with
   at least one string entry.
3. Render `<PostBanner src={bannerSrc} alt={title} />` immediately before the
   existing `<header>`.

This keeps the banner outside the `ProsePopovers` wrapper and avoids affecting
footnote/link popover behavior, TOC behavior, comments, or article body styling.

### Agent Documentation

Root `AGENTS.md` includes the authoring convention for blog banners:

1. Add an image path as the first entry in the post's `images` frontmatter list.
2. Store local assets under `public/static/images/` and reference them as
   `/static/images/...`.
3. Do not introduce a separate `banner` frontmatter field unless the content
   model intentionally changes.

## Visual Treatment

The banner should fit the current minimal article style:

- `mx-auto max-w-3xl` via the surrounding article layout.
- Rounded corners matching existing soft UI treatments.
- A fixed responsive height such as `h-48 sm:h-64` with `object-cover`.
- Bottom spacing that visually separates it from date/title metadata.
- No overlay text; title/date/tags stay in the existing header.

## Testing

Automated tests should cover the behavior that can regress in code:

1. A post with `images` renders the first image as the banner.
2. A post without `images` does not render a banner.
3. Scroll changes the banner opacity.
4. Reduced-motion preference prevents opacity changes.
5. `AGENTS.md` explains how to add a banner to a blog post.

Existing layout tests, if present, should be extended. If no suitable layout test
exists, add focused tests for `PostBanner` plus minimal layout render tests.

## Verification

Run the project test command and lint/build checks appropriate for this repo.
Manual verification should confirm:

1. A post with `images` shows a banner above the date/title header.
2. The banner fades while scrolling down from the top of the post.
3. Posts without images are visually unchanged.
4. Mobile and desktop widths keep the banner within the article column.
