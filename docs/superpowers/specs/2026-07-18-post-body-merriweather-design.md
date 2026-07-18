# Post Body Merriweather Design

## Goal

Improve blog post readability by using Merriweather at a slightly larger size for regular post body text.

## Scope

- Load Merriweather through `next/font/google`, following the site's existing font-loading pattern.
- Apply Merriweather at `1.1rem` to paragraphs and ordered and unordered list text rendered inside blog post prose.
- Load Merriweather weights `400` and `700` in normal and italic styles so bold and emphasized body text uses real font variants.
- Preserve the current line height.
- Keep Roboto Slab for headings, Roboto for site UI and post metadata, and JetBrains Mono for code.
- Leave non-post pages unchanged.

## Implementation

Define a Merriweather CSS variable in the root layout and expose it as a dedicated Tailwind font family. Update the existing Tailwind Typography rules for paragraphs and lists to use that family and `1.1rem`. The change remains within the current typography configuration rather than styling the entire `.prose` container, preventing the post font from affecting headings, code, captions, or other prose elements.

## Verification

- Confirm paragraphs and ordered and unordered list text use Merriweather at `1.1rem` in a rendered blog post.
- Confirm headings, code, post metadata, navigation, and non-post pages retain their existing typography.
- Run the repository's automated tests and production build.
