# Restore Post Body Merriweather Design

## Goal

Restore Merriweather for long-form post paragraphs and lists while retaining the Clinical Precision visual system and JetBrains Mono across the rest of the interface.

## Root Cause

The Clinical Precision refactor intentionally removed Merriweather because its source design required JetBrains Mono across all typography levels. That decision replaced the earlier scoped `prose-post` modifier and made default prose inherit JetBrains Mono. The resulting post body matches that requirement but no longer provides the desired long-form reading typeface.

This design supersedes the all-JetBrains rule only for post paragraphs and list content.

## Typography Architecture

The root layout will load Merriweather alongside JetBrains Mono. Tailwind will expose Merriweather through a dedicated `proseBody` family and restore a `typography.post` modifier.

The modifier will apply only to `p` and `ul, ol` descendants. Post headings, links, inline code, code blocks, tables, captions, metadata, tags, table-of-contents controls, and other interface elements continue to use JetBrains Mono through the default Clinical Precision prose and component styles.

`PostLayout`, `PostSimple`, and the legacy full-bleed `PostBanner` layout will opt into the modifier with `prose-post`. Author prose and non-post prose surfaces will not use it.

## Font Configuration

Merriweather will load from `next/font/google` with:

- Latin subset
- Swap display behavior
- CSS variable `--font-merriweather`
- Weights 400 and 700
- Normal and italic styles

This supports regular, emphasized, strong, and strong-emphasized post content without adding a package dependency.

## Reading Scale

Post paragraphs and ordered/unordered lists will use the previously established reading scale:

- Font family: Merriweather, with Georgia and serif fallbacks
- Font size: `1.1rem`
- Line height: `1.6`

Existing margins, content width, responsive behavior, colors, links, and spacing remain unchanged.

## Clinical Precision Compatibility

The typography exception does not alter the semantic palette, dark-mode variables, square geometry, borders, code theme, focus states, or component styling. Text color continues to come from the existing prose variables in both themes; the modifier changes only font family and the paragraph/list reading scale.

JetBrains Mono remains the required typeface for:

- Site navigation and controls
- Page and post titles
- Post headings
- Dates, tags, and labels
- Links
- Inline and block code
- Tables and captions
- Table of contents
- Author and non-post prose

## Data Flow And Error Handling

No runtime behavior, content model, data flow, routing, or error handling changes. Font loading uses the same Next.js font mechanism already used by the root layout.

## Testing And Verification

Regression tests will verify:

- The root layout loads Merriweather with the approved variable, weights, and styles.
- Tailwind defines `proseBody` with the expected fallbacks.
- `typography.post` applies Merriweather at `1.1rem` and `1.6` line height to paragraphs and lists only.
- Default prose and non-post typography remain JetBrains Mono.
- `PostLayout`, `PostSimple`, and `PostBanner` include `prose-post`.
- Existing Clinical Precision source audits permit the intentional `font-proseBody` configuration without allowing legacy utility usage in components.

The complete Jest suite, lint command, and production build must pass.

## Acceptance Criteria

- Post paragraphs and list content visibly render in Merriweather.
- All post and interface headings remain JetBrains Mono.
- Links, code, tables, captions, metadata, and controls remain JetBrains Mono.
- Author and other non-post prose remain JetBrains Mono.
- Light and dark prose colors remain unchanged.
- Existing layout widths, spacing, responsive behavior, and interactions remain unchanged.
- Tests, lint, and production build pass.
