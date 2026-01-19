'use client'

import { useState, useEffect } from 'react'

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

function useActiveHeading(toc: TocItem[]) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headingIds = toc.map((item) => item.url.slice(1)) // Remove '#'
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' } // Trigger when heading is near top
    )

    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [toc])

  return activeId
}

export function TableOfContentsMobile({ toc }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeId = useActiveHeading(toc)

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
            {toc.map((item) => {
              const isActive = activeId === item.url.slice(1)
              return (
                <a
                  key={item.url}
                  href={item.url}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                    item.depth !== 2 ? 'pl-3' : ''
                  } ${
                    isActive
                      ? 'font-medium text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.value}
                </a>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}

export function TableOfContentsDesktop({ toc }: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const activeId = useActiveHeading(toc)

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-24">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4 flex w-full items-center justify-between text-sm font-semibold text-gray-900 transition-colors hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
        >
          <span>On this page</span>
          <svg
            className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!isCollapsed && (
          <nav className="space-y-2">
            <button
              onClick={scrollToTop}
              className="block text-left text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
            >
              Top
            </button>
            {toc.map((item) => {
              const isActive = activeId === item.url.slice(1)
              return (
                <a
                  key={item.url}
                  href={item.url}
                  className={`block text-sm transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                    item.depth !== 2 ? 'pl-3' : ''
                  } ${
                    isActive
                      ? 'font-medium text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {item.value}
                </a>
              )
            })}
          </nav>
        )}
      </div>
    </aside>
  )
}
