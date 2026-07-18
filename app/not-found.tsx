import Link from '@/components/Link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
      <div className="space-x-2 pb-8 pt-6 md:space-y-5">
        <h1 className="md:leading-14 text-6xl font-extrabold leading-9 tracking-tight text-on-surface dark:text-inverse-on-surface md:border-r-2 md:px-6 md:text-8xl">
          404
        </h1>
      </div>
      <div className="max-w-md">
        <p className="text-title-lg md:text-headline-sm mb-4 leading-normal text-on-surface dark:text-inverse-on-surface">
          Sorry we couldn't find this page.
        </p>
        <p className="mb-8">But dont worry, you can find plenty of other things on our homepage.</p>
        <Link
          href="/"
          className="inline border border-primary-container bg-primary-container px-4 py-2 text-body-md font-medium text-on-primary transition-colors hover:border-primary hover:bg-primary focus:outline-none dark:border-inverse-primary dark:bg-[#881d24] dark:text-inverse-on-surface dark:hover:bg-primary"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  )
}
