import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// estiliza os elementos do markdown sem depender de plugin de tipografia.
// react-markdown roda em RSC e é compatível com Turbopack (ao contrário do
// next-mdx-remote, que quebra com --turbopack). O conteúdo do blog é markdown puro.
// A página do artigo já renderiza o título como <h1>. Por isso o '#' do markdown
// vira <h2> (não um 2º h1), '##' vira <h3> e '###' vira <h4> — hierarquia de
// headings correta pra leitores de tela e SEO, mantendo os tamanhos visuais.
const components: Components = {
  h1: ({ children }) => (
    <h2 className="text-2xl font-semibold text-ui-fg-base mt-8 mb-4">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="text-xl font-semibold text-ui-fg-base mt-10 mb-3">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-lg font-semibold text-ui-fg-base mt-6 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-base-regular text-ui-fg-subtle leading-7 mb-4">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 flex flex-col gap-y-2 text-ui-fg-subtle">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 flex flex-col gap-y-2 text-ui-fg-subtle">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-base-regular leading-7">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ui-fg-base">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-ui-border-base" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-ui-border-interactive pl-4 italic text-ui-fg-subtle my-4">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    const target = href || "#"
    const cls =
      "text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
    if (target.startsWith("/")) {
      return (
        <LocalizedClientLink href={target} className={cls}>
          {children}
        </LocalizedClientLink>
      )
    }
    return (
      <a href={target} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  },
}

const ArticleContent = ({ content }: { content: string }) => {
  return (
    <div className="max-w-2xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default ArticleContent
