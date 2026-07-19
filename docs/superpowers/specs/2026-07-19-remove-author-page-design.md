# Remove Author Page Design

## Goal

Remove the unused author-page implementation without changing how blog posts resolve author information for metadata and structured data.

## Context

The public contact page and its navigation link were removed previously. The repository still contains `AuthorLayout`, but no application route imports or renders it. Its test suite now covers unreachable page code.

The separate Contentlayer author model remains active. Blog post rendering uses `data/authors/default.mdx` through `allAuthors` to populate Open Graph authors and JSON-LD, so that content pipeline is outside this cleanup.

## Changes

- Delete `layouts/AuthorLayout.tsx`.
- Delete `layouts/__tests__/AuthorLayout.test.tsx`.
- Keep `data/authors/default.mdx` and the Contentlayer `Authors` document type.
- Keep blog post author resolution and metadata unchanged.
- Do not rewrite historical design documents or generic starter-template documentation as part of this focused removal.

## Behavior

No public route changes because the author/contact route no longer exists. Existing blog routes continue to render and expose the same author metadata.

## Verification

- Search active application and test code for imports of `AuthorLayout` and confirm none remain after deletion.
- Run the full Jest test suite.
- Run the production build to verify Contentlayer generation and blog rendering still compile successfully.
