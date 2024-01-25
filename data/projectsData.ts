interface Project {
  title: string,
  description: string,
  href?: string,
  imgSrc?: string,
}

const projectsData: Project[] = [
  {
    title: 'lasso',
    description: `Code injection on Android without ptrace`,
    //imgSrc: '/static/images/google.png',
    href: 'https://www.github.com/erfur/lasso',
  },
]

export default projectsData
