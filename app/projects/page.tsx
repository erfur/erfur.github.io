import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

export default function Projects() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="pb-8 pt-4">
        <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
          Projects
        </h1>
      </header>

      <div className="grid gap-4">
        {projectsData.map((d) => (
          <Card key={d.title} title={d.title} description={d.description} href={d.href} />
        ))}
      </div>
    </div>
  )
}
