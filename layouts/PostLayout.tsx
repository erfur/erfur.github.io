import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog, Authors } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import { TableOfContentsMobile, TableOfContentsDesktop } from '@/components/TableOfContents'
import ProsePopovers from '@/components/ProsePopovers'
import PostBanner from '@/components/PostBanner'

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
  const { slug, date, title, tags, images } = content
  const bannerSrc = Array.isArray(images) && typeof images[0] === 'string' ? images[0] : undefined

  const postHeader = (
    <header className={bannerSrc ? undefined : 'pb-10 pt-4'}>
      <div className="flex items-center gap-2 text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]">
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
                  className="transition-colors hover:text-primary dark:hover:text-inverse-primary"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      <h1 className="text-[1.75rem] font-bold leading-[2.25rem] tracking-[-0.02em] text-on-surface dark:text-inverse-on-surface sm:text-[2.25rem] sm:leading-[2.75rem]">
        {title}
      </h1>
    </header>
  )

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <div>
        <article className="mx-auto max-w-3xl">
          {bannerSrc ? (
            <PostBanner src={bannerSrc} alt={title}>
              {postHeader}
            </PostBanner>
          ) : (
            postHeader
          )}

          {/* Mobile Table of Contents */}
          {toc && toc.length > 0 && <TableOfContentsMobile toc={toc} title={title} />}

          {/* Content */}
          <ProsePopovers className="prose prose-post max-w-none dark:prose-invert">
            {children}
          </ProsePopovers>

          {/* Comments */}
          {siteMetadata.comments?.provider && (
            <div
              className="mt-12 border-t border-outline-variant pt-8 dark:border-outline"
              id="comment"
            >
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
