import { Metadata } from "next"
import { getAllPosts } from "@lib/data/blog"
import ArticleCard from "@modules/blog/components/article-card"
import { breadcrumbSchema, JsonLd } from "@modules/common/components/structured-data"

const SITE_URL = "https://copamarfraldas.com.br"

export const metadata: Metadata = {
  title: "Blog — Guias sobre Fraldas Geriátricas e Cuidado de Idosos",
  description:
    "Guias e conteúdos da Copamar sobre fraldas geriátricas, incontinência e cuidado de pessoas idosas e acamadas. 20 anos de experiência a serviço de cuidadores.",
  alternates: { canonical: `${SITE_URL}/blog` },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="content-container py-12">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", url: SITE_URL },
          { name: "Blog", url: `${SITE_URL}/blog` },
        ])}
      />
      <h1 className="text-3xl font-semibold text-ui-fg-base mb-2">
        Blog Copamar
      </h1>
      <p className="text-base-regular text-ui-fg-subtle mb-8 max-w-2xl">
        Guias práticos sobre fraldas geriátricas e cuidado de idosos, escritos
        por quem é especialista no assunto há 20 anos.
      </p>

      {posts.length === 0 ? (
        <p className="text-ui-fg-muted">Em breve, novos conteúdos.</p>
      ) : (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
          {posts.map((p) => (
            <ArticleCard key={p.frontmatter.slug} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
