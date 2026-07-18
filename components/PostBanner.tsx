'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const FADE_DISTANCE = 288

interface PostBannerProps {
  src?: string
  alt: string
}

export default function PostBanner({ src, alt }: PostBannerProps) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setOpacity(1)
      return
    }

    let frame: number | null = null

    const updateOpacity = () => {
      const progress = Math.min(window.scrollY / FADE_DISTANCE, 1)
      setOpacity(Number((1 - progress).toFixed(3)))
    }

    const onScroll = () => {
      if (frame !== null) return
      frame = -1
      const nextFrame = window.requestAnimationFrame(() => {
        frame = null
        updateOpacity()
      })
      if (frame !== null) {
        frame = nextFrame
      }
    }

    updateOpacity()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  if (!src) {
    return null
  }

  return (
    <div
      data-testid="post-banner"
      className="relative mb-8 h-48 overflow-hidden border border-outline-variant bg-surface-container-low dark:border-outline dark:bg-[#383d40] sm:h-64"
      style={{ opacity }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover"
        unoptimized
      />
    </div>
  )
}
