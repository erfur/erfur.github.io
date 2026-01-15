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
    title: 'gm-etab4-root',
    description: `Root exploit for the General Mobile E-Tab4 tablet`,
    href: 'https://www.github.com/erfur/gm-etab4-root',
  },
  {
    title: 'mysterypi-frida',
    description: `Frida scripts and notes for the Mystery PI reverse engineering project`,
    href: 'https://www.github.com/erfur/mysterypi-frida',
  },
  {
    title: 'lasso',
    description: `PoC app for linjector-rs`,
    imgSrc: '/static/images/projects/lasso-banner.jpg',
    href: 'https://www.github.com/erfur/lasso',
  },
]

export default projectsData
