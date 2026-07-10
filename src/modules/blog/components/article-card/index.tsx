import Image from "next/image"
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
      className="group flex flex-col gap-y-2 overflow-hidden rounded-lg border border-ui-border-base p-6 transition-colors hover:border-ui-border-interactive"
      data-testid="blog-article-card"
    >
      {/* capa (Manus 10/07): 59/63 posts têm image no frontmatter — agora aparece */}
      {frontmatter.image && (
        <div className="relative -mx-6 -mt-6 mb-2 aspect-[16/9] overflow-hidden bg-ui-bg-subtle">
          <Image
            src={frontmatter.image}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <span className="text-xsmall-regular text-ui-fg-subtle">
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
