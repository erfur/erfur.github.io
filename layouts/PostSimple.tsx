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

interface LayoutProps {
  content: CoreContent<Blog>
  children: ReactNode
  next?: { path: string; title: string }
  prev?: { path: string; title: string }
}

export default function PostLayout({ content, next, prev, children }: LayoutProps) {
  const { slug, date, title } = content

  return (
    <SectionContainer>
      <ScrollTopAndComment />
      <article className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="pb-8 pt-4">
          <time dateTime={date} className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(date, siteMetadata.locale)}
          </time>
          <h1 className="mt-2 font-heading text-3xl font-normal tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            {title}
          </h1>
        </header>

        {/* Content */}
        <ProsePopovers className="prose prose-gray max-w-none dark:prose-invert">
          {children}
        </ProsePopovers>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
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
