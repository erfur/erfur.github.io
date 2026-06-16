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
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [popover])

  return (
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
    try {
      await navigator.clipboard.writeText(state.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!pos) return null

  const style =
    pos.mode === 'gutter' ? { top: pos.top, right: 'calc(100% + 1rem)' as const } : { top: pos.top }

  const btn =
    'rounded-md bg-slate-200 px-3 py-1.5 font-medium text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'

  return (
    <div
      ref={ref}
      role="dialog"
      style={style}
      className={`not-prose absolute z-20 rounded-2xl bg-slate-100 p-4 text-sm shadow-lg dark:bg-slate-800 ${
        pos.mode === 'gutter' ? 'w-56' : 'left-0 right-0'
      }`}
    >
      {state.kind === 'text' ? (
        <div
          className="text-slate-700 dark:text-slate-300 [&_a]:text-primary-600 [&_a]:underline [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: state.html }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <span className="break-all text-slate-600 dark:text-slate-400">{state.url}</span>
          <div className="flex gap-2">
            <a href={state.url} target="_blank" rel="noopener noreferrer" className={btn}>
              Visit
            </a>
            <button type="button" onClick={onCopy} className={btn}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
