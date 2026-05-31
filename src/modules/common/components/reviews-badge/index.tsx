/**
 * Badge de avaliações reais do Google Negócios (#C1) — sóbrio, sem redesenho.
 * Usa o MESMO snapshot do structured-data (4,6 / 143, sobrescrevível por env).
 * ⚠️ Nada fabricado: são os números reais informados pelo Marco. TODO #42:
 * Places API pra manter atualizado.
 */
const RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4.6"
const COUNT = process.env.NEXT_PUBLIC_REVIEW_COUNT || "143"

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

const ReviewsBadge = ({ className = "" }: { className?: string }) => {
  const nota = parseFloat(RATING.replace(",", ".")) || 4.6
  return (
    <span
      className={`inline-flex items-center gap-x-1.5 text-sm ${className}`}
      aria-label={`Nota ${RATING.replace(".", ",")} de 5 no Google, ${COUNT} avaliações`}
    >
      <Estrelas nota={nota} />
      <strong className="text-ui-fg-base">{RATING.replace(".", ",")}</strong>
      <span className="text-ui-fg-subtle">· {COUNT} avaliações no Google</span>
    </span>
  )
}

export default ReviewsBadge
