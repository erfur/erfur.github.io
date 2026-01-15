import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'

const MAX_DISPLAY = 15

export default function Home({ posts }) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <header className="pb-8 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Latest
        </h1>
      </header>

      {/* Posts list */}
      <ul className="space-y-1">
        {!posts.length && <p className="text-gray-500 dark:text-gray-400">No posts found.</p>}
        {posts.slice(0, MAX_DISPLAY).map((post) => {
          const { slug, date, title, tags } = post
          return (
            <li key={slug}>
              <Link
                href={`/blog/${slug}`}
                className="group -mx-2 flex items-baseline gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                <span className="font-medium text-gray-900 transition-colors group-hover:text-primary-600 dark:text-gray-100 dark:group-hover:text-primary-400">
                  {title}
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs text-gray-400 dark:text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </span>
                <time
                  dateTime={date}
                  className="ml-auto shrink-0 text-sm tabular-nums text-gray-400 dark:text-gray-500"
                >
                  {formatDate(date, siteMetadata.locale)}
                </time>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* All posts link */}
      {posts.length > MAX_DISPLAY && (
        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Link
            href="/blog"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View all posts &rarr;
          </Link>
        </div>
      )}

      {/* Newsletter */}
      {siteMetadata.newsletter?.provider && (
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <NewsletterForm />
        </div>
      )}
    </div>
  )
}
