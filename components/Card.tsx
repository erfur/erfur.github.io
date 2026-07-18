import Link from './Link'

const Card = ({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href?: string
}) => {
  const content = (
    <>
      <h2 className="font-semibold text-on-surface transition-colors group-hover:text-primary dark:text-inverse-on-surface dark:group-hover:text-inverse-primary">
        {title}
      </h2>
      <p className="mt-1 text-body-md text-tertiary dark:text-[#b7c8e1]">{description}</p>
    </>
  )

  const className =
    'group block border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:border-primary-container hover:bg-surface-container-low dark:border-outline dark:bg-[#323638] dark:hover:border-inverse-primary dark:hover:bg-[#383d40]'

  if (href) {
    return (
      <Link href={href} aria-label={`Link to ${title}`} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export default Card
