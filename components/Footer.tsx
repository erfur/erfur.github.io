import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-outline-variant dark:border-outline">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 py-6 sm:flex-row">
        <div className="flex items-center gap-4">
          {siteMetadata.email && (
            <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={5} />
          )}
        </div>
        <p className="text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]">
          © {new Date().getFullYear()} {siteMetadata.author}
        </p>
      </div>
    </footer>
  )
}
