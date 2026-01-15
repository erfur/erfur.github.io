import { ReactNode } from 'react'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Comments from '@/components/Comments'
import Link from '@/components/Link'
import SectionContainer from '@/components/SectionContainer'
import siteMetadata from '@/data/siteMetadata'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'

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
      <article className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="pb-8 pt-4">
          <time dateTime={date} className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(date, siteMetadata.locale)}
          </time>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            {title}
          </h1>
        </header>

        {/* Content */}
        <div className="prose prose-gray max-w-none dark:prose-invert">{children}</div>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          {/* Prev/Next navigation */}
          {(next || prev) && (
            <nav className="grid gap-4 sm:grid-cols-2">
              {prev && prev.path && (
                <Link
                  href={`/${prev.path}`}
                  className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">Previous</span>
                  <p className="mt-1 font-medium text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                    {prev.title}
                  </p>
                </Link>
              )}
              {next && next.path && (
                <Link
                  href={`/${next.path}`}
                  className="group rounded-lg border border-gray-200 p-4 text-right transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50 sm:col-start-2"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">Next</span>
                  <p className="mt-1 font-medium text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                    {next.title}
                  </p>
                </Link>
              )}
            </nav>
          )}

          {/* Comments */}
          {siteMetadata.comments && (
            <div className="mt-12" id="comment">
              <Comments slug={slug} />
            </div>
          )}
        </footer>
      </article>
    </SectionContainer>
  )
}
