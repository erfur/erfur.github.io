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
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 font-heading text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
  const [showScrollTop, setShowScrollTop] = useState(false)
  const activeId = useActiveHeading(toc)

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 50)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <aside className="fixed left-[calc(50%+25rem)] top-24 z-10 hidden xl:block">
      {isCollapsed ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Show table of contents"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Scroll to top"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="max-h-[calc(100vh-15rem)] w-56 overflow-y-auto rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
          <button
            onClick={() => setIsCollapsed(true)}
            className="mb-3 flex w-full items-center justify-between font-heading text-sm font-normal text-slate-900 transition-all hover:text-slate-600 dark:text-slate-100 dark:hover:text-slate-400"
          >
            <span>On this page</span>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <nav className="space-y-2">
            <button
              onClick={scrollToTop}
              className="block text-left text-sm text-slate-600 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Top
            </button>
            {toc.map((item) => {
              const isActive = activeId === item.url.slice(1)
              return (
                <a
                  key={item.url}
                  href={item.url}
                  className={`block text-sm transition-all hover:text-slate-900 dark:hover:text-slate-200 ${
                    item.depth !== 2 ? 'pl-3' : ''
                  } ${
                    isActive
                      ? 'font-medium text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.value}
                </a>
              )
            })}
          </nav>
        </div>
      )}
    </aside>
  )
}
