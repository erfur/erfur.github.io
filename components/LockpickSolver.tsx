'use client'

import { useEffect, useRef, useState } from 'react'

const MESSAGE_TYPE = 'lockpick-solver-height'

export default function LockpickSolver() {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(720)

  useEffect(() => {
    const updateHeight = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== MESSAGE_TYPE ||
        typeof event.data.height !== 'number'
      ) {
        return
      }

      setHeight(Math.max(480, Math.ceil(event.data.height)))
    }

    window.addEventListener('message', updateHeight)
    return () => window.removeEventListener('message', updateHeight)
  }, [])

  return (
    <iframe
      ref={frameRef}
      src="/static/lockpick-solver/index.html"
      title="Interactive Gothic lockpick solver"
      className="not-prose my-8 block w-full border border-outline-variant bg-[#0f1117] dark:border-outline"
      scrolling="no"
      style={{ height, overflow: 'hidden' }}
      onLoad={() => {
        const body = frameRef.current?.contentDocument?.body
        if (body) setHeight(Math.max(480, Math.ceil(body.getBoundingClientRect().height)))
      }}
    />
  )
}
