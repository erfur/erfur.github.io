import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="font-heading text-3xl font-normal tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
      {children}
    </h1>
  )
}
