import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import path from 'path'
import GithubSlugger from 'github-slugger'
import { escape } from 'pliny/utils/htmlEscaper.js'
import siteMetadata from '../data/siteMetadata.js'
import { allBlogs } from '../.contentlayer/generated/index.mjs'
import { sortPosts } from 'pliny/utils/contentlayer.js'

const tagData = JSON.parse(readFileSync('./app/tag-data.json', 'utf-8'))

const generateRssItem = (config, post) => `
  <item>
    <guid>${config.siteUrl}/blog/${post.slug}</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}/blog/${post.slug}</link>
    ${post.summary ? `<description>${escape(post.summary)}</description>` : ''}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    ${config.email ? `<author>${config.email} (${escape(config.author)})</author>` : ''}
    ${post.tags ? post.tags.map((t) => `<category>${escape(t)}</category>`).join('') : ''}
  </item>
`

const generateRss = (config, posts, page = 'feed.xml') => `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/blog</link>
      <description>${escape(config.description || config.title)}</description>
      <language>${config.language}</language>
      ${config.email ? `<managingEditor>${config.email} (${escape(config.author)})</managingEditor>` : ''}
      ${config.email ? `<webMaster>${config.email} (${escape(config.author)})</webMaster>` : ''}
      <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      ${posts.map((post) => generateRssItem(config, post)).join('')}
    </channel>
  </rss>
`

async function generateRSS(config, allBlogs, page = 'feed.xml') {
  const publishPosts = allBlogs.filter((post) => post.draft !== true)
  const outputDirectories = ['public', 'out']

  // RSS for blog post
  if (publishPosts.length > 0) {
    const rss = generateRss(config, sortPosts(publishPosts))
    for (const outputDirectory of outputDirectories) {
      mkdirSync(outputDirectory, { recursive: true })
      writeFileSync(path.join(outputDirectory, page), rss)
    }
  }

  if (publishPosts.length > 0) {
    const slugger = new GithubSlugger()
    for (const tag of Object.keys(tagData)) {
      const filteredPosts = allBlogs.filter((post) =>
        post.tags
          .map((t) => {
            slugger.reset()
            return slugger.slug(t)
          })
          .includes(tag)
      )
      const rss = generateRss(config, filteredPosts, `tags/${tag}/${page}`)
      for (const outputDirectory of outputDirectories) {
        const rssPath = path.join(outputDirectory, 'tags', tag)
        mkdirSync(rssPath, { recursive: true })
        writeFileSync(path.join(rssPath, page), rss)
      }
    }
  }
}

const rss = () => {
  generateRSS(siteMetadata, allBlogs)
  console.log('RSS feed generated...')
}
export default rss
