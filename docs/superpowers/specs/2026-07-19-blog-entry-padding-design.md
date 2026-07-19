# Blog Entry Padding Design

## Goal

Give entries on `/blog`, paginated blog pages, and tag result pages the same 8px horizontal content inset as entries in the home page's Latest list.

## Design

Remove the `-mx-2` utility from each post link in `layouts/ListLayoutWithTags.tsx`. The link's existing `px-2` utility will then provide 8px of padding on both sides. Because `/blog`, paginated blog pages, and tag result pages intentionally share this layout, all three views will receive the same spacing.

Do not change the unused `layouts/ListLayout.tsx`. Preserve the existing row markup, full-width list, click targets, vertical spacing, borders, alternating backgrounds, hover styling, and responsive behavior.

## Verification

Extend the existing post-list semantics test to assert that links rendered by `ListLayoutWithTags` include `px-2` and exclude `-mx-2`. Run the focused test, the full test suite, and the production build.
