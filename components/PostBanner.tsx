import Image from 'next/image'
import { ReactNode } from 'react'

interface PostBannerProps {
  src?: string
  alt: string
  children?: ReactNode
}

export default function PostBanner({ src, alt, children }: PostBannerProps) {
  if (!src) {
    return null
  }

  return (
    <div
      data-testid="post-banner"
      className="relative left-1/2 h-[calc(46svh-5rem)] min-h-[16rem] w-screen -translate-x-1/2 overflow-hidden bg-surface dark:bg-inverse-surface"
    >
      <Image src={src} alt={alt} fill sizes="100vw" className="object-cover" unoptimized priority />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/70 to-surface dark:via-inverse-surface/70 dark:to-inverse-surface" />
      {children && (
        <div className="absolute inset-x-0 bottom-4 mx-auto w-full max-w-3xl px-8 sm:px-12 md:bottom-auto md:top-[calc(40svh-5rem)] md:-translate-y-1/2 xl:px-0">
          {children}
        </div>
      )}
    </div>
  )
}
