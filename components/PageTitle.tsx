import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTitle({ children }: Props) {
  return (
    <h1 className="text-headline-lg-mobile text-on-surface dark:text-inverse-on-surface sm:text-headline-lg">
      {children}
    </h1>
  )
}
