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
        <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
          {title}
        </h1>
        <div className="relative mt-4">
          <input
            aria-label="Search articles"
            type="text"
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search articles..."
            className="block w-full border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md text-on-surface placeholder:text-tertiary focus:border-primary-container focus:outline-none focus:ring-0 dark:border-outline dark:bg-[#383d40] dark:text-inverse-on-surface dark:placeholder:text-[#b7c8e1]"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-tertiary dark:text-[#b7c8e1]"
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

      <ul className="divide-y divide-outline-variant border-y border-outline-variant dark:divide-outline dark:border-outline">
        {!filteredBlogPosts.length && (
          <li className="text-body-md text-tertiary dark:text-[#b7c8e1]">No posts found.</li>
        )}
        {displayPosts.map((post) => {
          const { path, date, title, tags } = post
          return (
            <li
              key={path}
              className="odd:bg-surface-container-lowest even:bg-surface-container-low dark:odd:bg-[#323638] dark:even:bg-[#383d40]"
            >
              <Link
                href={`/${path}`}
                className="group -mx-2 flex items-baseline gap-4 px-2 py-3 transition-colors hover:bg-surface-container dark:hover:bg-[#41474a]"
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

      {pagination && pagination.totalPages > 1 && !searchValue && (
        <div className="mt-8">
          <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
        </div>
      )}
    </div>
  )
}
