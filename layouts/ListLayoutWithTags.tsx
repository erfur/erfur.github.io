/* eslint-disable jsx-a11y/anchor-is-valid */
'use client'

import { usePathname } from 'next/navigation'
import { slug } from 'github-slugger'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'
import tagData from 'app/tag-data.json'

interface PaginationProps {
  totalPages: number
  currentPage: number
}
interface ListLayoutProps {
  posts: CoreContent<Blog>[]
  title: string
  initialDisplayPosts?: CoreContent<Blog>[]
  pagination?: PaginationProps
}

function Pagination({ totalPages, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const basePath = pathname.split('/')[1]
  const prevPage = currentPage - 1 > 0
  const nextPage = currentPage + 1 <= totalPages

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-800">
      <div>
        {prevPage ? (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            &larr; Previous
          </Link>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-600">&larr; Previous</span>
        )}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {currentPage} / {totalPages}
      </span>
      <div>
        {nextPage ? (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Next &rarr;
          </Link>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-600">Next &rarr;</span>
        )}
      </div>
    </nav>
  )
}

export default function ListLayoutWithTags({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const pathname = usePathname()
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  const displayPosts = initialDisplayPosts.length > 0 ? initialDisplayPosts : posts

  const currentTag = pathname.split('/tags/')[1]

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-6 pt-4">
        <h1 className="font-heading text-2xl font-normal tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>

        {/* Inline tag filter */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !currentTag
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            All
          </Link>
          {sortedTags.map((t) => {
            const isActive = currentTag === slug(t)
            return (
              <Link
                key={t}
                href={`/tags/${slug(t)}`}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
                aria-label={`View posts tagged ${t}`}
              >
                {t}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Posts list */}
      <ul className="space-y-1">
        {displayPosts.map((post) => {
          const { path, date, title, tags } = post
          return (
            <li key={path}>
              <Link
                href={`/${path}`}
                className="group -mx-2 flex items-baseline gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                <span className="font-heading font-normal text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                  {title}
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs text-gray-400 dark:text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </span>
                <time
                  dateTime={date}
                  className="ml-auto shrink-0 text-sm tabular-nums text-gray-400 dark:text-gray-500"
                >
                  {formatDate(date, siteMetadata.locale)}
                </time>
              </Link>
            </li>
          )
        })}
      </ul>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
        </div>
      )}
    </div>
  )
}
