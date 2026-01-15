'use client'

import { useState } from 'react'

interface TocItem {
  value: string
  url: string
  depth: number
}

interface TableOfContentsProps {
  toc: TocItem[]
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function TableOfContentsMobile({ toc }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-6 xl:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <span>On this page</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <nav className="space-y-1">
            <button
              onClick={() => {
                scrollToTop()
                setIsOpen(false)
              }}
              className="block text-left text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              Top
            </button>
            {toc.map((item) => (
              <a
                key={item.url}
                href={item.url}
                onClick={() => setIsOpen(false)}
                className={`block text-sm transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                  item.depth === 2
                    ? 'text-gray-600 dark:text-gray-400'
                    : 'pl-3 text-gray-500 dark:text-gray-500'
                }`}
              >
                {item.value}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

export function TableOfContentsDesktop({ toc }: TableOfContentsProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
          On this page
        </h2>
        <nav className="space-y-2">
          <button
            onClick={scrollToTop}
            className="block text-left text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
          >
            Top
          </button>
          {toc.map((item) => (
            <a
              key={item.url}
              href={item.url}
              className={`block text-sm transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                item.depth === 2
                  ? 'text-gray-600 dark:text-gray-400'
                  : 'pl-3 text-gray-500 dark:text-gray-500'
              }`}
            >
              {item.value}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}
