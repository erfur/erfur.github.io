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
        <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
          Tags
        </h1>
      </header>

      {tagKeys.length === 0 ? (
        <p className="text-body-md text-tertiary dark:text-[#b7c8e1]">No tags found.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((t) => (
            <Link
              key={t}
              href={`/tags/${slug(t)}`}
              className="inline-flex items-center gap-1.5 border border-outline-variant bg-surface-container-low px-3 py-1 text-label-sm uppercase text-secondary transition-colors hover:border-primary-container hover:text-primary dark:border-outline dark:bg-[#383d40] dark:text-[#bcc7de] dark:hover:border-inverse-primary dark:hover:text-inverse-primary"
              aria-label={`View posts tagged ${t}`}
            >
              <span className="font-medium">{t}</span>
              <span className="text-tertiary dark:text-[#b7c8e1]">{tagCounts[t]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
