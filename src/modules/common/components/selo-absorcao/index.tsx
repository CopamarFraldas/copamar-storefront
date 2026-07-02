import { lerAbsorcao } from "@lib/util/absorcao"

/**
 * Selo de NÍVEL DE ABSORÇÃO (#87) — gotas preenchidas + "Nível X/5" + 🌙 noturno.
 * Reusado no card (variante="card", compacto) e na PDP (variante="pdp", bloco rico).
 *
 * SEGURANÇA: produto de saúde — renderiza `null` quando não há nível validado no
 * metadata (lerAbsorcao retorna null). Nunca mostra número chutado.
 * ACESSIBILIDADE: aria-label textual no container; as gotas/emoji são aria-hidden.
 * CORES: tokens do tema (text-ui-fg-*) + amber-500 semântico (gota cheia) — sem
 * cinza hardcoded (mantém AA no dark).
 */
function Gota({ on, tamanho = 11 }: { on: boolean; tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={on ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className={on ? "text-amber-500" : "text-ui-fg-muted"}
    >
      <path d="M12 2.7c3.6 4.6 6.8 8.4 6.8 12.3a6.8 6.8 0 1 1-13.6 0c0-3.9 3.2-7.7 6.8-12.3z" />
    </svg>
  )
}

export default function SeloAbsorcao({
  product,
  variante = "card",
}: {
  product?: { metadata?: Record<string, unknown> | null } | null
  variante?: "card" | "pdp"
}) {
  const a = lerAbsorcao(product)
  if (!a) return null

  const gotas = [1, 2, 3, 4, 5].map((i) => i <= a.nivel)
  const label = `Nível de absorção ${a.nivel} de 5 (${a.rotulo})${
    a.noturno ? ", modelo noturno" : ""
  }`

  if (variante === "card") {
    return (
      <div
        className="mt-1.5 flex items-center gap-x-1.5 text-ui-fg-subtle"
        aria-label={label}
      >
        <span className="flex items-center gap-[1px]" aria-hidden="true">
          {gotas.map((on, i) => (
            <Gota key={i} on={on} />
          ))}
        </span>
        <span className="txt-compact-xsmall small:text-sm medium:text-base" aria-hidden="true">
          Nível {a.nivel}/5
        </span>
        {a.noturno && (
          <span aria-hidden="true" title="Noturno">
            🌙
          </span>
        )}
      </div>
    )
  }

  // PDP — bloco rico
  return (
    <div
      className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle px-3 py-3"
      aria-label={label}
    >
      <div className="flex items-baseline justify-between">
        <span className="txt-compact-small-plus text-ui-fg-base">
          Nível de absorção
        </span>
        <span className="txt-compact-small text-ui-fg-subtle" aria-hidden="true">
          {a.rotulo} · {a.nivel}/5
        </span>
      </div>
      <div className="flex items-center gap-x-1.5">
        <span className="flex items-center gap-x-1" aria-hidden="true">
          {gotas.map((on, i) => (
            <Gota key={i} on={on} tamanho={18} />
          ))}
        </span>
        {a.noturno && (
          <span className="ml-1 txt-compact-small text-ui-fg-subtle" aria-hidden="true">
            🌙 Noturno
          </span>
        )}
      </div>
      {a.formato && (
        <span className="txt-compact-xsmall text-ui-fg-muted" aria-hidden="true">
          Formato: {a.formato}
        </span>
      )}
    </div>
  )
}
