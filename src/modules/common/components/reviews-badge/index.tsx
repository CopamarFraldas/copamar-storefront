/**
 * Selo de avaliações REAIS da loja no Google (#42).
 *
 * Fonte featurada (decisão Marco 05/06): **Seller Rating / Google Customer
 * Reviews** — 4,9 com 600 avaliações (Merchant Center 122803740) — mais forte
 * que o 4,6/143 do Maps. Números reais, sobrescrevíveis por env quando o
 * snapshot mudar. O selo LINKA pro perfil público de avaliações no Google
 * (transparência: dá pra conferir na fonte).
 *
 * ⚠️ Nada fabricado. E o JSON-LD NÃO carrega mais essa nota (política do
 * Google: aggregateRating em markup deve vir de reviews first-party do próprio
 * site, não de nota "emprestada" do Google — ver structured-data/index.tsx).
 */
const RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4.9"
const COUNT = process.env.NEXT_PUBLIC_REVIEW_COUNT || "600"
const RATINGS_URL =
  process.env.NEXT_PUBLIC_REVIEW_URL ||
  "https://www.google.com/shopping/ratings/account/lookup?q=copamarfraldas.com.br"

function Estrelas({ nota }: { nota: number }) {
  // 5 estrelas com preenchimento proporcional à nota (acessível via aria-label)
  const pct = Math.max(0, Math.min(100, (nota / 5) * 100))
  return (
    <span
      className="relative inline-block leading-none"
      aria-hidden="true"
      style={{ fontSize: "1em" }}
    >
      <span className="text-ui-fg-subtle">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-500"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  )
}

const ReviewsBadge = ({
  className = "",
  escopo = "geral",
}: {
  className?: string
  /**
   * "loja" deixa EXPLÍCITO que a nota é da Copamar (LOJA) no Google, não do
   * produto — usar na PDP, onde o selo fica embaixo do título da fralda e
   * poderia dar a impressão de ser avaliação daquela fralda (Marco 09/06).
   */
  escopo?: "geral" | "loja"
}) => {
  const nota = parseFloat(RATING.replace(",", ".")) || 4.9
  const notaBr = RATING.replace(".", ",")
  return (
    <a
      href={RATINGS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-x-1.5 text-sm transition-opacity hover:opacity-80 ${className}`}
      aria-label={`Loja Copamar: nota ${notaBr} de 5 no Google, com ${COUNT} avaliações de clientes. Abrir o perfil de avaliações da loja.`}
      data-testid="reviews-badge"
    >
      <Estrelas nota={nota} />
      <strong className="text-ui-fg-base">{notaBr}</strong>
      {escopo === "loja" ? (
        <span className="text-ui-fg-subtle">
          · <span className="font-medium">Loja Copamar</span> no Google ·{" "}
          {COUNT} avaliações
        </span>
      ) : (
        <span className="text-ui-fg-subtle">· {COUNT} avaliações · Google</span>
      )}
    </a>
  )
}

export default ReviewsBadge
