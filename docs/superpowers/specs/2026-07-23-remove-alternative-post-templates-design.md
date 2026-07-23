# Remove Alternative Post Templates

## Goal

Reduce blog rendering to one supported template, `PostLayout`, by removing the
unused `PostSimple` and legacy `PostBanner` layouts and the configuration used
to select between templates.

## Scope

- Delete `layouts/PostSimple.tsx` and `layouts/PostBanner.tsx`.
- Delete their layout-specific tests.
- Replace the layout registry in `app/blog/[...slug]/page.tsx` with a direct
  `PostLayout` render.
- Remove the blog post `layout` field from the Contentlayer schema.
- Update the active README to describe one post layout and remove `layout` from
  the documented blog frontmatter.
- Preserve `components/PostBanner.tsx` and its tests. This is the responsive,
  scroll-fading image component used by `PostLayout`, not an alternative layout.
- Preserve historical design and implementation documents as records of prior
  work.

No current file under `data/blog` declares a `layout`, so the removal requires
no content migration or compatibility alias.

## Rendering Flow

The blog route will continue to resolve the post, authors, adjacent posts, and
table of contents as it does today. It will then render `PostLayout` directly
with those values. Removing the dynamic registry makes unsupported layout names
impossible to configure and removes the associated indexed access path.

The visual behavior of current posts remains unchanged because all current posts
already use the default `PostLayout`. Posts with `images` continue to render the
first image through `components/PostBanner.tsx`.

## Error Handling And Compatibility

There is no fallback for the removed template names. The `layout` field is
removed from the blog schema, and the repository contains no persisted use of
it. If template selection is needed again, it should be introduced deliberately
with a new supported layout rather than retaining dormant compatibility code.

The author document's separate `layout` field is out of scope and remains
unchanged.

## Documentation

The README will state that `PostLayout` is the blog post template. Its supported
frontmatter list and example will no longer advertise a `layout` property.
Historical files under `docs/superpowers/specs` and `docs/superpowers/plans` will
not be rewritten.

## Verification

- Run the focused `PostLayout` and banner component tests.
- Run the repository test suite.
- Run type checking or the production build according to available package
  scripts.
- Search active source, tests, README, and blog content for references to the
  removed layout files or selectors.
- Confirm historical documents are the only remaining template references and
  that references to `components/PostBanner.tsx` remain valid.
