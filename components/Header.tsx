import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SocialIcon from '@/components/social-icons'

const Header = () => {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between py-6">
      <Link
        href="/"
        aria-label={siteMetadata.headerTitle}
        className="flex items-center gap-2 text-gray-900 transition-colors hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-400"
      >
        <Logo className="h-8 w-8" />
        <span className="font-heading text-lg font-normal tracking-tight">
          {siteMetadata.headerTitle}
        </span>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        {headerNavLinks
          .filter((link) => link.href !== '/')
          .map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="hidden rounded-md px-3 py-1.5 font-heading text-sm font-normal text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 sm:block"
            >
              {link.title}
            </Link>
          ))}
        <div className="ml-2 flex h-8 items-center border-l border-gray-200 pl-2 dark:border-gray-700">
          <SocialIcon kind="github" href={siteMetadata.github} size={5} />
        </div>
        <div className="flex h-8 items-center border-l border-gray-200 pl-2 dark:border-gray-700">
          <ThemeSwitch />
          <MobileNav />
        </div>
      </nav>
    </header>
  )
}

export default Header
