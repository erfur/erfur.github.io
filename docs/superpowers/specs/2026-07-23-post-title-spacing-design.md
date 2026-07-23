# Post Title Spacing Design

## Goal

Give post titles more visual room and move the post body slightly lower by modestly increasing the title size and header spacing.

## Scope

The change applies only to `PostLayout`, the supported post template. The former alternative `PostSimple` and `PostBanner` layouts have been removed, and other page titles remain unchanged.

## Design

The template will use a `1.75rem` title with a `2.25rem` line height on mobile and a `2.25rem` title with a `2.75rem` line height from the `sm` breakpoint onward. These local responsive classes avoid changing the shared headline tokens used elsewhere.

The post header bottom padding will increase from `2rem` to `2.5rem`. Existing top padding, metadata layout, title weight, letter spacing, colors, banners, and post body typography remain unchanged.

## Testing

Focused layout tests will verify that `PostLayout` uses the new responsive title sizes and header bottom padding. The relevant test suite, lint command, production build, and `git diff --check` must pass.

## Acceptance Criteria

- Titles in `PostLayout` are slightly larger at mobile and desktop widths.
- The post body starts slightly lower beneath the title area.
- Other layouts and shared typography tokens are unchanged.
