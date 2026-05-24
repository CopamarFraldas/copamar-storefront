import { BlogPost } from "@lib/data/blog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const formatarData = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

const ArticleCard = ({ post }: { post: BlogPost }) => {
  const { frontmatter } = post
  return (
    <LocalizedClientLink
      href={`/blog/${frontmatter.slug}`}
      className="group flex flex-col gap-y-2 border border-ui-border-base rounded-lg p-6 hover:border-ui-border-interactive transition-colors"
      data-testid="blog-article-card"
    >
      <span className="text-xsmall-regular text-ui-fg-muted">
        {formatarData(frontmatter.publishedAt)}
      </span>
      <h2 className="text-large-semi text-ui-fg-base group-hover:text-ui-fg-interactive transition-colors">
        {frontmatter.title}
      </h2>
      <p className="text-base-regular text-ui-fg-subtle line-clamp-3">
        {frontmatter.description}
      </p>
      <span className="text-base-regular text-ui-fg-interactive mt-2">
        Ler artigo →
      </span>
    </LocalizedClientLink>
  )
}

export default ArticleCard
