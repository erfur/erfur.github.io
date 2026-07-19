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
    <nav className="flex items-center justify-between border-t border-outline-variant pt-6 dark:border-outline">
      <div>
        {prevPage ? (
          <Link
            href={currentPage - 1 === 1 ? `/${basePath}/` : `/${basePath}/page/${currentPage - 1}`}
            rel="prev"
            className="text-body-md font-medium text-secondary hover:text-primary dark:text-[#bcc7de] dark:hover:text-inverse-primary"
          >
            &larr; Previous
          </Link>
        ) : (
          <span className="text-body-md text-tertiary opacity-50 dark:text-[#b7c8e1]">
            &larr; Previous
          </span>
        )}
      </div>
      <span className="text-body-md text-tertiary dark:text-[#b7c8e1]">
        {currentPage} / {totalPages}
      </span>
      <div>
        {nextPage ? (
          <Link
            href={`/${basePath}/page/${currentPage + 1}`}
            rel="next"
            className="text-body-md font-medium text-secondary hover:text-primary dark:text-[#bcc7de] dark:hover:text-inverse-primary"
          >
            Next &rarr;
          </Link>
        ) : (
          <span className="text-body-md text-tertiary opacity-50 dark:text-[#b7c8e1]">
            Next &rarr;
          </span>
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
    <div className="mx-auto max-w-3xl">
      <header className="pb-6 pt-4">
        <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
          {title}
        </h1>

        {/* Inline tag filter */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href="/blog"
            aria-current={!currentTag ? 'page' : undefined}
            className={
              !currentTag
                ? 'border border-primary-container bg-primary-container px-3 py-1 text-label-sm uppercase text-on-primary-container dark:border-inverse-primary dark:bg-[#881d24] dark:text-inverse-on-surface'
                : 'border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm uppercase text-secondary transition-colors hover:border-primary-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#bcc7de] dark:hover:border-inverse-primary dark:hover:text-inverse-primary'
            }
          >
            All
          </Link>
          {sortedTags.map((t) => {
            const isActive = currentTag === slug(t)
            return (
              <Link
                key={t}
                href={`/tags/${slug(t)}`}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'border border-primary-container bg-primary-container px-3 py-1 text-label-sm uppercase text-on-primary-container dark:border-inverse-primary dark:bg-[#881d24] dark:text-inverse-on-surface'
                    : 'border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm uppercase text-secondary transition-colors hover:border-primary-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#bcc7de] dark:hover:border-inverse-primary dark:hover:text-inverse-primary'
                }
                aria-label={`View posts tagged ${t}`}
              >
                {t}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Posts list */}
      <ul className="divide-y divide-outline-variant border-y border-outline-variant dark:divide-outline dark:border-outline">
        {displayPosts.map((post) => {
          const { path, date, title, tags } = post
          return (
            <li
              key={path}
              className="odd:bg-surface-container-lowest even:bg-surface-container-low dark:odd:bg-[#323638] dark:even:bg-[#383d40]"
            >
              <Link
                href={`/${path}`}
                className="group flex items-baseline gap-4 px-2 py-3 transition-colors hover:bg-surface-container dark:hover:bg-[#41474a]"
              >
                <span className="font-semibold text-on-surface transition-colors group-hover:text-primary dark:text-inverse-on-surface dark:group-hover:text-inverse-primary">
                  {title}
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {tags?.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]"
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
                <time
                  dateTime={date}
                  className="ml-auto shrink-0 text-body-md tabular-nums text-tertiary dark:text-[#b7c8e1]"
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
