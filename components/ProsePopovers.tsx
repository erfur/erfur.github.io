'use client'

import {
  forwardRef,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

type PopoverState =
  | { kind: 'text'; html: string; anchor: HTMLElement }
  | { kind: 'link'; url: string; anchor: HTMLElement }

interface Props {
  className?: string
  children: ReactNode
}

export const isFootnoteRef = (a: HTMLAnchorElement) =>
  a.hasAttribute('data-footnote-ref') ||
  (a.getAttribute('href') || '').startsWith('#user-content-fn')

export const isExternal = (a: HTMLAnchorElement) => {
  const href = a.getAttribute('href') || ''
  return href.length > 0 && !href.startsWith('/') && !href.startsWith('#')
}

// Read the GFM footnotes section into a map of footnote id -> note HTML (backref stripped).
export function extractFootnotes(container: HTMLElement): Map<string, string> {
  const map = new Map<string, string>()
  container.querySelectorAll('[data-footnotes] li[id]').forEach((li) => {
    const clone = li.cloneNode(true) as HTMLElement
    clone.querySelectorAll('[data-footnote-backref]').forEach((b) => b.remove())
    map.set(li.id, clone.innerHTML.trim())
  })
  return map
}

// Copy text to the clipboard, with a legacy fallback for insecure contexts
// (e.g. viewing the dev server over a LAN IP) where navigator.clipboard is unavailable.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function ProsePopovers({ className, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const footnotes = useRef<Map<string, string>>(new Map())
  const [popover, setPopover] = useState<PopoverState | null>(null)

  // Build footnote id -> note HTML from the (hidden) GFM footnotes section.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    footnotes.current = extractFootnotes(container)
  }, [children])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (popoverRef.current?.contains(e.target as Node)) return // ignore clicks inside the popover
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
    if (!a) return

    if (isFootnoteRef(a)) {
      e.preventDefault()
      const id = (a.getAttribute('href') || '').replace(/^#/, '')
      const html = footnotes.current.get(id)
      if (!html) return
      setPopover((cur) => (cur && cur.anchor === a ? null : { kind: 'text', html, anchor: a }))
      return
    }

    if (isExternal(a)) {
      e.preventDefault()
      const url = a.href
      setPopover((cur) => (cur && cur.anchor === a ? null : { kind: 'link', url, anchor: a }))
    }
    // internal / in-page anchor links: do nothing, let them navigate
  }, [])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!popover) return
    const onDown = (e: MouseEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return
      if (popover.anchor.contains(e.target as Node)) return
      setPopover(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPopover(null)
    const onResize = () => setPopover(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [popover])

  return (
    // Event delegation for the footnote/link anchors inside, which are themselves
    // keyboard-accessible (Enter fires a click that bubbles here); the container
    // itself is not an interactive element.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div ref={containerRef} className={`relative ${className ?? ''}`} onClick={onClick}>
      {children}
      {popover && <Popover ref={popoverRef} state={popover} containerRef={containerRef} />}
    </div>
  )
}

const Popover = forwardRef<
  HTMLDivElement,
  { state: PopoverState; containerRef: RefObject<HTMLDivElement> }
>(function Popover({ state, containerRef }, ref) {
  const [pos, setPos] = useState<{ top: number; mode: 'gutter' | 'inline' } | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const c = container.getBoundingClientRect()
    const a = state.anchor.getBoundingClientRect()
    const desktop = window.matchMedia('(min-width: 1280px)').matches
    setPos(
      desktop
        ? { mode: 'gutter', top: a.top - c.top }
        : { mode: 'inline', top: a.bottom - c.top + 8 }
    )
  }, [state, containerRef])

  const onCopy = async () => {
    if (state.kind !== 'link') return
    const ok = await copyText(state.url)
    if (!ok) return
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }

  if (!pos) return null

  // Both modes size to their content (w-fit). The max width is what changes:
  // desktop grows with the viewport (clamp) and is anchored to the gutter;
  // narrow is capped at the column width.
  const style =
    pos.mode === 'gutter'
      ? {
          top: pos.top,
          right: 'calc(100% + 1rem)' as const,
          maxWidth: 'clamp(13rem, calc(50vw - 27rem), 30rem)',
        }
      : { top: pos.top }

  const iconBtnBase = 'flex h-9 w-9 items-center justify-center border p-2 transition-colors'
  const iconBtn = `${iconBtnBase} border-outline-variant bg-surface-container-low text-tertiary hover:border-primary-container hover:bg-surface-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#b7c8e1] dark:hover:border-inverse-primary dark:hover:bg-[#41474a] dark:hover:text-inverse-primary`

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={state.kind === 'text' ? 'Footnote' : 'Link actions'}
      style={style}
      className={`not-prose absolute z-20 w-max border border-outline-variant bg-surface-container-low p-4 text-body-md text-on-surface dark:border-outline dark:bg-[#383d40] dark:text-inverse-on-surface ${
        pos.mode === 'gutter' ? '' : 'left-0 right-0 mx-auto max-w-full'
      }`}
    >
      {state.kind === 'text' ? (
        <div
          className="text-on-surface dark:text-inverse-on-surface [&_a]:text-primary [&_a]:underline dark:[&_a]:text-inverse-primary [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: state.html }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <span className="break-all text-tertiary dark:text-[#b7c8e1]">{state.url}</span>
          <div className={`flex gap-1 ${pos.mode === 'gutter' ? 'justify-end' : 'justify-center'}`}>
            <a
              href={state.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open link in new tab"
              className={iconBtn}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? 'Copied' : 'Copy link'}
              className={
                copied
                  ? `${iconBtnBase} border-outline-variant bg-emerald-100 text-emerald-700 dark:border-outline dark:bg-emerald-950 dark:text-emerald-300`
                  : iconBtn
              }
            >
              {copied ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
