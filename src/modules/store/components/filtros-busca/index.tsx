"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"

/**
 * Filtros rápidos de refino (nº5) — chips que afinam a busca por tipo, absorção,
 * gênero e tamanho. Funciona REFINANDO o termo da busca (?q), que o Medusa
 * resolve por texto no título. Toggle: clicar adiciona o termo; clicar de novo
 * remove.
 *
 * ⚠️ Tamanho: os títulos do catálogo misturam "G"/"Grande"/"EG", então o filtro
 * de tamanho usa o termo por extenso e tem cobertura PARCIAL — a cobertura total
 * exige normalizar um campo `tamanho` nos produtos (proposta no relatório).
 */
const GRUPOS: { grupo: string; itens: string[] }[] = [
  { grupo: "Tipo", itens: ["Fralda", "Pants", "Absorvente", "Protetor"] },
  { grupo: "Absorção", itens: ["Noturna", "Dermacare"] },
  { grupo: "Para", itens: ["Masculino", "Feminino"] },
  { grupo: "Tamanho", itens: ["Pequeno", "Média", "Grande", "Extra Grande"] },
]

const FiltrosBusca = () => {
  const router = useRouter()
  const params = useParams()
  const sp = useSearchParams()
  const cc = (params?.countryCode as string) || "br"
  const q = (sp?.get("q") || "").trim()
  const termos = q.split(/\s+/).filter(Boolean)

  const temTermo = (t: string) =>
    termos.some((x) => x.toLowerCase() === t.toLowerCase())

  const toggle = (t: string) => {
    let novos: string[]
    if (temTermo(t)) {
      novos = termos.filter((x) => x.toLowerCase() !== t.toLowerCase())
    } else {
      novos = [...termos, t]
    }
    const novoQ = novos.join(" ").trim()
    if (!novoQ) {
      router.push(`/${cc}/store`)
      return
    }
    router.push(`/${cc}/search?q=${encodeURIComponent(novoQ)}`)
  }

  return (
    <div className="mb-6 space-y-2">
      {GRUPOS.map((g) => (
        <div key={g.grupo} className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-ui-fg-subtle">
            {g.grupo}
          </span>
          {g.itens.map((t) => {
            const ativo = temTermo(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                aria-pressed={ativo}
                className={
                  "rounded-full border px-3 py-1 text-sm transition " +
                  (ativo
                    ? "border-copamar-primary bg-copamar-primary text-white"
                    : "border-ui-border-base bg-ui-bg-subtle text-ui-fg-base hover:border-copamar-primary/60")
                }
              >
                {t}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default FiltrosBusca
