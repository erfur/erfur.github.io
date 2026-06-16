import Link from '@/components/Link'
import { slug } from 'github-slugger'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Tags', description: 'Things I blog about' })

export default async function Page() {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = Object.keys(tagCounts)
  const sortedTags = tagKeys.sort((a, b) => tagCounts[b] - tagCounts[a])

  return (
    <div className="mx-auto max-w-3xl">
      <header className="pb-8 pt-4">
        <h1 className="font-heading text-2xl font-normal tracking-tight text-gray-900 dark:text-gray-100">
          Tags
        </h1>
      </header>

      {tagKeys.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No tags found.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((t) => (
            <Link
              key={t}
              href={`/tags/${slug(t)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800/50"
              aria-label={`View posts tagged ${t}`}
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">{t}</span>
              <span className="text-gray-400 dark:text-gray-500">{tagCounts[t]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
