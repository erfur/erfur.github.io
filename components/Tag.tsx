import Link from 'next/link'
import { slug } from 'github-slugger'

interface Props {
  text: string
}

const Tag = ({ text }: Props) => {
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className="border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm uppercase text-secondary transition-colors hover:border-primary-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#bcc7de] dark:hover:border-inverse-primary dark:hover:text-inverse-primary"
    >
      #{text.split(' ').join('-')}
    </Link>
  )
}

export default Tag
