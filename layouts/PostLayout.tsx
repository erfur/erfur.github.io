import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import { TableOfContentsMobile, TableOfContentsDesktop } from '@/components/TableOfContents'

const postDateTemplate: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

interface LayoutProps {
  content: CoreContent<Blog>
  authorDetails: CoreContent<Authors>[]
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
  toc?: { value: string; url: string; depth: number }[]
  children: ReactNode
}

export default function PostLayout({
  content,
  authorDetails,
  next,
  prev,
  toc,
  children,
}: LayoutProps) {
  const { slug, date, title, tags } = content

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <div>
        <article className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="pb-8 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={date}>
                {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
              </time>
              {tags && tags.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex gap-1.5">
                    {tags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/tags/${tag}`}
                        className="transition-colors hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
            <h1 className="mt-2 font-heading text-3xl font-normal tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              {title}
            </h1>
          </header>

          {/* Mobile Table of Contents */}
          {toc && toc.length > 0 && <TableOfContentsMobile toc={toc} title={title} />}

          {/* Content */}
          <div className="prose prose-gray max-w-none dark:prose-invert">{children}</div>

          {/* Comments */}
          {siteMetadata.comments?.provider && (
            <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800" id="comment">
              <Comments slug={slug} />
            </div>
          )}
        </article>

        {/* Desktop sidebar: TOC (when present) + back-to-top button */}
        <TableOfContentsDesktop toc={toc || []} title={title} />
      </div>
    </SectionContainer>
  )
}
