import { ReactNode } from 'react'
import type { Authors } from 'contentlayer/generated'
import SocialIcon from '@/components/social-icons'
import Image from '@/components/Image'

interface Props {
  children: ReactNode
  content: Omit<Authors, '_id' | '_raw' | 'body'>
}

export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, linkedin, github } = content

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-8 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Contact
        </h1>
      </header>

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {/* Profile card */}
        <div className="flex flex-col items-center sm:items-start">
          {avatar && (
            <Image
              src={avatar}
              alt="avatar"
              width={120}
              height={120}
              className="h-24 w-24 rounded-full"
            />
          )}
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{name}</h2>
          {occupation && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{occupation}</p>
          )}
          {company && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{company}</p>
          )}
          <div className="mt-4 flex gap-3">
            <SocialIcon kind="github" href={github} size={5} />
            <SocialIcon kind="twitter" href={twitter} size={5} />
            {email && <SocialIcon kind="mail" href={`mailto:${email}`} size={5} />}
            {linkedin && <SocialIcon kind="linkedin" href={linkedin} size={5} />}
          </div>
        </div>

        {/* Bio */}
        <div className="prose prose-gray max-w-none flex-1 dark:prose-invert">
          {children}
        </div>
      </div>
    </div>
  )
}
