import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
        <div className="flex items-center gap-4">
          <SocialIcon kind="github" href={siteMetadata.github} size={5} />
          <SocialIcon kind="twitter" href={siteMetadata.twitter} size={5} />
          {siteMetadata.email && (
            <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={5} />
          )}
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} {siteMetadata.author}
        </p>
      </div>
    </footer>
  )
}
