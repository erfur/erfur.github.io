interface Project {
  title: string,
  description: string,
  href?: string,
  imgSrc?: string,
}

const projectsData: Project[] = [
  {
    title: 'linjector-rs',
    description: `Code injection on Android without ptrace`,
    href: 'https://www.github.com/erfur/linjector-rs',
  },
  {
    title: 'lasso',
    description: `PoC app for linjector-rs`,
    imgSrc: '/static/images/projects/lasso-banner.jpg',
    href: 'https://www.github.com/erfur/lasso',
  },
]

export default projectsData
