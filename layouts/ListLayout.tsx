'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { formatDate } from 'pliny/utils/formatDate'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Blog } from 'contentlayer/generated'
import Link from '@/components/Link'
import siteMetadata from '@/data/siteMetadata'

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

export default function ListLayout({
  posts,
  title,
  initialDisplayPosts = [],
  pagination,
}: ListLayoutProps) {
  const [searchValue, setSearchValue] = useState('')
  const filteredBlogPosts = posts.filter((post) => {
    const searchContent = post.title + post.summary + post.tags?.join(' ')
    return searchContent.toLowerCase().includes(searchValue.toLowerCase())
  })

  const displayPosts =
    initialDisplayPosts.length > 0 && !searchValue ? initialDisplayPosts : filteredBlogPosts

  return (
    <div className="mx-auto max-w-3xl">
      <header className="pb-6 pt-4">
        <h1 className="font-heading text-2xl font-normal tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <div className="relative mt-4">
          <input
            aria-label="Search articles"
            type="text"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search articles..."
            className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </header>

      <ul className="space-y-1">
        {!filteredBlogPosts.length && (
          <p className="text-gray-500 dark:text-gray-400">No posts found.</p>
        )}
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

      {pagination && pagination.totalPages > 1 && !searchValue && (
        <div className="mt-8">
          <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
        </div>
      )}
    </div>
  )
}
