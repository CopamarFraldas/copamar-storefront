/**
 * Estrelas de avaliação (1-5, com fração) — compartilhadas entre cards da
 * vitrine, topo da PDP e seção de avaliações. Componente PURO (sem "use
 * client"): funciona em Server e Client Components.
 *
 * A fração é o truque clássico Amazon/ML: fileira cinza embaixo + fileira
 * âmbar por cima cortada por width% (media 4.3 → 86%).
 */

const TAMANHOS = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  lg: "h-7 w-7",
} as const

function Star({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.4 4.3a1 1 0 0 0 .95.7h4.52c.97 0 1.37 1.24.59 1.81l-3.66 2.65a1 1 0 0 0-.36 1.12l1.4 4.3c.3.92-.76 1.69-1.54 1.12l-3.66-2.65a1 1 0 0 0-1.18 0l-3.66 2.65c-.78.57-1.83-.2-1.54-1.12l1.4-4.3a1 1 0 0 0-.36-1.12L1.6 9.74c-.78-.57-.38-1.81.59-1.81h4.52a1 1 0 0 0 .95-.7l1.4-4.3Z" />
    </svg>
  )
}

export default function Estrelas({
  media,
  tamanho = "sm",
  className,
}: {
  /** média 0-5 (aceita fração, ex. 4.3) */
  media: number
  tamanho?: keyof typeof TAMANHOS
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (media / 5) * 100))
  const star = TAMANHOS[tamanho]
  return (
    <span
      className={`relative inline-flex shrink-0 ${className || ""}`}
      role="img"
      aria-label={`Nota ${media.toFixed(1).replace(".", ",")} de 5`}
    >
      <span className="flex text-gray-300 dark:text-gray-600">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={star} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex overflow-hidden text-amber-400"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={`${star} shrink-0`} />
        ))}
      </span>
    </span>
  )
}
