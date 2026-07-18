import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SocialIcon from '@/components/social-icons'

const Header = () => {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between py-6 text-on-surface dark:text-inverse-on-surface">
      <Link
        href="/"
        aria-label={siteMetadata.headerTitle}
        className="flex items-center gap-2 transition-colors hover:text-primary dark:hover:text-inverse-primary"
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
              className="hidden px-3 py-1.5 text-body-md text-secondary transition-colors hover:bg-surface-container-low hover:text-on-surface dark:text-[#bcc7de] dark:hover:bg-[#383d40] dark:hover:text-inverse-on-surface sm:block"
            >
              {link.title}
            </Link>
          ))}
        <div className="ml-2 flex h-8 items-center border-l border-outline-variant pl-2 dark:border-outline">
          <SocialIcon kind="github" href={siteMetadata.github} size={5} />
        </div>
        <div className="ml-2 flex h-8 items-center border-l border-outline-variant pl-2 dark:border-outline">
          <ThemeSwitch />
          <MobileNav />
        </div>
      </nav>
    </header>
  )
}

export default Header
