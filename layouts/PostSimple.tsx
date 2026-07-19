import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import ProsePopovers from '@/components/ProsePopovers'
import PostBanner from '@/components/PostBanner'

interface LayoutProps {
  content: CoreContent<Blog>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export default function PostLayout({ content, next, prev, children }: LayoutProps) {
  const { slug, date, title, images } = content
  const bannerSrc = Array.isArray(images) && typeof images[0] === 'string' ? images[0] : undefined

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article className="mx-auto max-w-3xl">
        {bannerSrc && <PostBanner src={bannerSrc} alt={title} />}

        {/* Header */}
        <header className="pb-8 pt-4">
          <time
            dateTime={date}
            className="flex items-center gap-2 text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]"
          >
            {formatDate(date, siteMetadata.locale)}
          </time>
          <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
            {title}
          </h1>
        </header>

        {/* Content */}
        <ProsePopovers className="prose max-w-none dark:prose-invert">{children}</ProsePopovers>

        {/* Footer */}
        <footer className="mt-12 border-t border-outline-variant pt-8 dark:border-outline">
          {/* Comments */}
          {siteMetadata.comments?.provider && (
            <div className="mt-12" id="comment">
              <Comments slug={slug} />
            </div>
          )}
        </footer>
      </article>
    </SectionContainer>
  )
}
