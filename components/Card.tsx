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
      <h2 className="font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </>
  )

  const className =
    'group block rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50'

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
