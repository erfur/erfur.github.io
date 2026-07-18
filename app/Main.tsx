import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'
import NewsletterForm from 'pliny/ui/NewsletterForm'

const MAX_DISPLAY = 15

export default function Home({ posts }) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <header className="pb-8 pt-4">
        <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
          Latest
        </h1>
      </header>

      {/* Posts list */}
      <ul className="divide-y divide-outline-variant border-y border-outline-variant dark:divide-outline dark:border-outline">
        {!posts.length && (
          <p className="text-body-md text-tertiary dark:text-[#b7c8e1]">No posts found.</p>
        )}
        {posts.slice(0, MAX_DISPLAY).map((post) => {
          const { slug, date, title, tags } = post
          return (
            <li key={slug}>
              <Link
                href={`/blog/${slug}`}
                className="group -mx-2 flex items-baseline gap-4 px-2 py-3 transition-colors odd:bg-surface-container-lowest even:bg-surface-container-low hover:bg-surface-container dark:odd:bg-[#323638] dark:even:bg-[#383d40] dark:hover:bg-[#41474a]"
              >
                <span className="font-semibold text-on-surface transition-colors group-hover:text-primary dark:text-inverse-on-surface dark:group-hover:text-inverse-primary">
                  {title}
                </span>
                <span className="hidden shrink-0 gap-1.5 sm:flex">
                  {tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-label-sm uppercase text-tertiary dark:text-[#b7c8e1]"
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
                <time
                  dateTime={date}
                  className="ml-auto shrink-0 text-body-md tabular-nums text-tertiary dark:text-[#b7c8e1]"
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
        <div className="mt-8 border-t border-outline-variant pt-6 dark:border-outline">
          <Link
            href="/blog"
            className="text-body-md font-medium text-secondary transition-colors hover:text-primary dark:text-[#bcc7de] dark:hover:text-inverse-primary"
          >
            View all posts &rarr;
          </Link>
        </div>
      )}

      {/* Newsletter */}
      {siteMetadata.newsletter?.provider && (
        <div className="mt-12 border-t border-outline-variant pt-8 dark:border-outline">
          <NewsletterForm />
        </div>
      )}
    </div>
  )
}
