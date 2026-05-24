import fs from "fs"
import path from "path"
import matter from "gray-matter"

const BLOG_DIR = path.join(process.cwd(), "content/blog")

export type Faq = { pergunta: string; resposta: string }

export type BlogFrontmatter = {
  title: string
  slug: string
  description: string
  publishedAt: string
  updatedAt?: string
  author: string
  keywords: string[]
  image?: string
  faqs?: Faq[]
  draft?: boolean
}

export type BlogPost = {
  frontmatter: BlogFrontmatter
  content: string
}

function listFiles(): string[] {
  try {
    return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"))
  } catch {
    return [] // diretório ainda não existe / sem artigos
  }
}

export function getAllSlugs(): string[] {
  return listFiles().map((f) => f.replace(/\.mdx$/, ""))
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), "utf-8")
    const { data, content } = matter(raw)
    return {
      frontmatter: { ...(data as Omit<BlogFrontmatter, "slug">), slug },
      content,
    }
  } catch {
    return null
  }
}

export function getAllPosts(includeDrafts = false): BlogPost[] {
  return getAllSlugs()
    .map((slug) => getPostBySlug(slug))
    .filter((p): p is BlogPost => p !== null)
    .filter((p) => includeDrafts || !p.frontmatter.draft)
    .sort((a, b) =>
      a.frontmatter.publishedAt < b.frontmatter.publishedAt ? 1 : -1
    )
}
