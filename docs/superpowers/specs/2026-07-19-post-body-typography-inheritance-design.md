# Post Body Typography Inheritance Design

## Goal

Use Merriweather throughout post body prose except for headings, inline code, and block code. Make inline code the same size as its surrounding post body text.

## Scope

The change applies only to existing post prose wrappers using `prose-post`. Non-post prose and interface typography remain unchanged.

Post links, blockquotes, lists, tables, captions, and other prose elements will use Merriweather through inheritance. Headings, inline code, and fenced code will continue to use JetBrains Mono.

## Typography Architecture

The existing Tailwind typography configuration remains the single owner of prose typography. The `post` typography modifier will set Merriweather and the current `1.1rem` reading size on the post prose root. Descendants will inherit that family unless they are explicitly protected.

Redundant JetBrains Mono declarations will be removed from links, tables, and captions. Those elements will still use JetBrains Mono in non-post prose because the default prose root remains JetBrains Mono, while post prose will inherit Merriweather from `prose-post`.

Headings, inline code, and `pre` elements will retain explicit JetBrains Mono declarations. The existing `pre code` reset will continue to make fenced code inherit its block typography rather than inline-code decoration or sizing.

## Inline And Block Code

Inline code inside post prose will use `1.1rem`, matching the surrounding post body reading size. Its existing font family, foreground, background, padding, weight, and square geometry remain unchanged.

Block code retains its current Prism and typography-plugin sizing, line height, colors, spacing, and overflow behavior. The inline-code size must not leak into code nested beneath `pre`.

## Compatibility

No font-loading, layout, content model, routing, responsive behavior, or dark-mode changes are required. Existing post layouts already opt into `prose-post`, and Merriweather is already loaded through the root layout.

## Testing

Configuration and generated-CSS tests will verify:

- The post modifier establishes Merriweather and the `1.1rem` reading size.
- Links, tables, captions, blockquotes, paragraphs, and lists resolve to Merriweather in posts.
- Headings, inline code, and block code resolve to JetBrains Mono.
- Inline post code resolves to `1.1rem`.
- Code nested in `pre` retains the block code size rather than the inline code size.
- Default non-post prose remains JetBrains Mono.

The focused typography tests, full Jest suite, lint command, production build, and `git diff --check` must pass.

## Acceptance Criteria

- All post body prose uses Merriweather except headings and code.
- Post headings remain JetBrains Mono.
- Inline and block code remain JetBrains Mono.
- Inline code matches the surrounding `1.1rem` post body size.
- Block code sizing and presentation remain unchanged.
- Non-post prose and interface typography remain unchanged.
