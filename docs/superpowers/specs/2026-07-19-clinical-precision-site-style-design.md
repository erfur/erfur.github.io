# Clinical Precision Site Style Design

## Goal

Restyle the entire site with the Clinical Precision design system while preserving the existing content hierarchy, route structure, narrow reading layout, responsive behavior, and interactions. The result should feel clinical, analytical, and technically precise without adding decorative complexity.

## Scope

The visual refactor covers the global shell, header, footer, home page, blog lists, tag pages and filters, project cards, all post layouts, prose, code blocks, tables, table of contents, mobile navigation, popovers, comments, search inputs, and floating utility controls.

Content, navigation destinations, component placement, data flow, and application behavior remain unchanged. Existing `max-w-3xl` reading widths and wider supporting containers remain in place rather than expanding to the design system's 1280px maximum.

## Styling Architecture

`tailwind.config.js` will be the source of truth for the supplied semantic palette and typography. Components will use semantic names such as `surface`, `surface-container-low`, `on-surface`, `on-surface-variant`, `outline-variant`, `primary`, and `tertiary` instead of generic slate, gray, or sky scales.

The implementation will migrate component utilities directly to the semantic tokens. This keeps styling colocated with each component and avoids a brittle global override layer or a second component-class abstraction.

Global CSS will define the base page surface, inherited typeface, focus visibility, form defaults, and any shared geometry rules that are genuinely global. Component-specific states remain explicit in JSX.

## Color System

The light theme uses the supplied Clinical Precision tokens without modification:

- `surface` and `background` (`#f7f9fb`) provide the page base.
- `surface-container-lowest` (`#ffffff`) provides the cleanest content and control surfaces.
- The remaining surface-container levels provide subtle grouping and alternating list rows.
- `on-surface` (`#191c1e`) provides primary text.
- `on-surface-variant` (`#574140`), `secondary`, and `tertiary` provide metadata and auxiliary text.
- `outline-variant` (`#debfbe`) provides low-contrast boundaries; `outline` is reserved for stronger boundaries.
- `primary` (`#a83639`) provides accessible text, focus, and outline accents.
- `primary-container` (`#f87171`) provides filled active controls and other prominent interactive surfaces.

Primary red is reserved for active states, links, focus treatment, code keywords, and critical interactions. Neutral surface shifts handle ordinary hover feedback.

### Dark Theme

The existing theme toggle remains. Dark mode is an adapted counterpart because the source document does not define a full dark palette:

- `inverse-surface` (`#2d3133`) is the page base.
- `inverse-on-surface` (`#eff1f3`) is primary text.
- Darker derived tonal containers distinguish cards, inputs, overlays, and alternating rows.
- Muted outline colors retain visible 1px boundaries without high glare.
- `inverse-primary` (`#ffb3b0`) is the principal interactive accent, with darker primary-fixed variants used where a filled state needs contrast.

The dark theme preserves the same hierarchy and behavior as the light theme.

## Typography

JetBrains Mono is the sole site typeface. The existing Roboto, Roboto Slab, and Merriweather roles will be removed, including the recently introduced post-only Merriweather treatment.

The type scale follows the supplied specification:

- Large desktop headlines: 32px size, 40px line height, weight 700, and `-0.02em` tracking.
- Large mobile headlines: 24px size, 32px line height, weight 700, and `-0.02em` tracking.
- Section headlines: 20px size, 28px line height, weight 600.
- Large body: 16px size, 24px line height, weight 400.
- Medium body: 14px size, 20px line height, weight 400.
- Small labels and metadata: 12px size, 16px line height, weight 500, uppercase, and `0.05em` tracking.
- Inline code: 13px size, 18px line height, weight 400.

Page titles and post titles use the large headline roles. Section headings use the medium headline role. Prose paragraphs and lists use the large body role. Dates, tag metadata, and compact labels use the small label role. Values that benefit from alignment retain tabular numerals.

## Shape, Depth, And Interaction

All interface elements use 0px corner radius. This includes cards, tags, filters, inputs, navigation buttons, post banners, images, code blocks, table-of-contents panels, popovers, and floating controls. Circular utility controls and pill-shaped tags become square or rectangular.

Structure is communicated with 1px borders and tonal layers. Existing decorative shadows are removed. Borders use `outline-variant` by default and may use `primary-container` or `primary` on hover and focus. No border changes thickness during interaction, preventing layout movement.

Keyboard focus uses a clearly visible primary-red outline with sufficient offset. Hover states use either a low neutral surface shift or a red border/text accent according to interaction priority.

## Layout And Responsive Behavior

The current layout is maintained:

- Existing container widths, post reading measure, component ordering, and responsive visibility rules do not change.
- Existing desktop and mobile breakpoints remain authoritative.
- Mobile page gutters remain 16px, matching the design system.
- Existing spacing is normalized to the 4px scale where current values are changed for styling, but sections are not rearranged.
- Post lists retain their title/tag/date alignment and responsive tag hiding.
- Mobile navigation remains a full-screen overlay with the same open and close behavior.

This interpretation treats the supplied 1280px grid as a maximum design-system capability, not a requirement to widen this content-focused site.

## Component Treatment

### Global Shell, Header, And Footer

The shell uses the semantic page surfaces and JetBrains Mono. Header navigation becomes square-edged, with tonal hover states and primary active feedback. Existing separators remain as thin outline-variant rules. The footer keeps its position and content with the same clinical divider treatment.

### Lists, Tags, And Pagination

Home and blog post rows keep their current flex layout. Rows gain subtle alternating low-container fills and thin horizontal dividers. Hover changes the row fill and introduces primary emphasis without movement.

Tags and active filters become compact rectangular technical labels. Metadata uses uppercase tracked label typography. Active filters use the primary container with a contrast-safe foreground; inactive filters use low tonal fills or outlines.

Pagination keeps the current three-part alignment and uses semantic active, inactive, and disabled colors.

### Inputs And Buttons

Inputs use a white or low-container fill, a 1px outline-variant border, JetBrains Mono, and 0px radius. Focus changes the border and focus outline to primary red. Buttons follow the same sharp geometry. Filled primary controls use the primary container; outlined controls use primary borders; low-priority controls use tertiary colors.

### Cards And Information Panels

Project cards, table-of-contents panels, popovers, and similar information islands use low tonal fills and 1px borders without shadows. Titles are bold JetBrains Mono. Hoverable cards change border color and surface tone while retaining their existing dimensions.

### Post Content And Media

All post layouts share the semantic typography and surface system. Post banners and prose images become square-edged, use a 1px low-contrast outline where appropriate, and have no shadow. Tables use thin dividers and alternating low-container row fills.

Footnote and link popovers retain their current behavior and positioning but adopt rectangular geometry, semantic surfaces, and the same button states as the rest of the site.

### Code

Inline code uses the specified 13/18 role, a low-container fill, square geometry, and a subtle outline where needed.

Code blocks replace Night Owl with a Clinical Precision syntax theme. The block surface uses a dark slate/inverse surface, neutral text remains high contrast, keywords use the red accent, and comments use muted steel blue-grey. Inserted, deleted, and highlighted lines use desaturated semantic status tints and fixed-width edge markers. Code titles and blocks have square corners, 1px outlines, and no shadows.

## Data Flow And Error Handling

This is a presentation-only refactor. No content models, state transitions, data loading, search behavior, navigation behavior, or error paths change. Existing empty states and the not-found page receive semantic colors and geometry but preserve their text and control flow.

## Testing And Verification

Configuration regression tests will verify:

- The semantic palette contains the supplied values.
- JetBrains Mono is the only configured site font role.
- Headline, body, label, and inline-code scales match the design specification.
- Prose images and inline code use square geometry without shadows.
- The code syntax theme uses Clinical Precision accent and comment colors.

Existing component and layout tests will be updated only where they assert superseded styling. The complete Jest suite, lint command, and production build must pass.

Representative home, blog list, post, tags, projects, and mobile navigation views will be checked in light and dark modes at desktop and mobile widths. Visual checks will confirm unchanged layout behavior, no horizontal overflow, readable contrast, consistent square geometry, visible keyboard focus, and coherent semantic states.

## Acceptance Criteria

- Every site surface uses the Clinical Precision semantic palette in light mode and the approved adapted palette in dark mode.
- JetBrains Mono is used across navigation, headings, body text, metadata, forms, and code.
- Interactive and container geometry is square, with no leftover pills, rounded cards, rounded media, or routine shadows.
- Existing routes, content, layout widths, element ordering, and responsive behavior are unchanged.
- Primary red is used selectively for interaction and critical emphasis rather than as a general decoration.
- Code, prose, controls, overlays, and utility components form one coherent visual system.
- Automated tests, linting, and the production build pass.
