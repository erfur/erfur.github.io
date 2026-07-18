import {
  Mail,
  Github,
  Facebook,
  Youtube,
  Linkedin,
  Twitter,
  Mastodon,
  Threads,
  Instagram,
} from './icons'

const components = {
  mail: Mail,
  github: Github,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  mastodon: Mastodon,
  threads: Threads,
  instagram: Instagram,
}

const iconSizeClasses = {
  5: 'h-5 w-5 fill-current',
  8: 'h-8 w-8 fill-current',
} as const

type SocialIconProps = {
  kind: keyof typeof components
  href: string | undefined
  size?: keyof typeof iconSizeClasses
}

const SocialIcon = ({ kind, href, size = 8 }: SocialIconProps) => {
  if (!href || (kind === 'mail' && !/^mailto:\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{2,3})+$/.test(href)))
    return null

  const SocialSvg = components[kind]

  return (
    <a
      className="flex h-8 w-8 items-center justify-center border border-transparent text-tertiary transition-colors hover:border-primary-container hover:bg-surface-container-low hover:text-primary dark:text-[#b7c8e1] dark:hover:border-inverse-primary dark:hover:bg-[#383d40] dark:hover:text-inverse-primary"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
    >
      <span className="sr-only">{kind}</span>
      <SocialSvg className={iconSizeClasses[size]} />
    </a>
  )
}

export default SocialIcon
