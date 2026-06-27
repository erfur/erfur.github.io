# Repository Instructions

## Blog Post Banners

Blog post banners are authored with the existing `images` frontmatter field. The
first image in the list is used as the banner image for that post.

Example:

```mdx
---
title: Example Post
date: 2026-06-27
images:
  - /static/images/example-post/banner.jpg
---
```

Place local banner assets under `public/static/images/`, then reference them from
the site root as `/static/images/...`. Posts without an `images` entry do not show
a banner.

Do not add a separate `banner` frontmatter field unless the content model is
intentionally changed. The scroll-fade behavior is template-driven and should not
require per-post code.
