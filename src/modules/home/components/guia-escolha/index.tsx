import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * "Não sabe qual escolher?" (nº3) — atalho cedo pro cuidador NOVO, que trava na
 * dúvida (slip vs pants, tamanho) e abandona. Mini-guia curto + atalho pro time
 * humano no WhatsApp ("especialista" = humano no site todo). Sem claim médico.
 */
const WHATS_ESPECIALISTA =
  "https://wa.me/5511952050000?text=" +
  encodeURIComponent(
    "Olá! Não sei qual fralda escolher — pode me ajudar?"
  )

const DICAS = [
  {
    t: "Tamanho vai pela cintura/quadril",
    d: "Não pelo peso. Cada produto traz a tabela de medidas na descrição.",
  },
  {
    t: "Slip (fralda) x Pants (roupa íntima)",
    d: "Slip absorve mais e é melhor pra quem fica na cama; Pants veste como calcinha, pra quem ainda anda.",
  },
  {
    t: "Absorção: dia x noite",
    d: "Modelos noturnos seguram mais líquido por mais tempo. Na dúvida, a Mapa indica.",
  },
]

const GuiaEscolha = () => (
  <section aria-labelledby="guia-h" className="h-full">
    <div className="flex h-full flex-col rounded-large border border-ui-border-base bg-copamar-bg-light dark:bg-ui-bg-subtle p-5">
      <div className="flex items-start gap-x-3">
        <span aria-hidden className="text-2xl">
          💬
        </span>
        <div>
          <h2
            id="guia-h"
            className="text-base font-bold text-copamar-primary dark:text-ui-fg-base"
          >
            Não sabe qual escolher?
          </h2>
          <p className="mt-0.5 text-sm text-ui-fg-subtle">
            Não sabe qual a melhor opção? Nós te ajudamos a achar o modelo e o
            tamanho certo - sem complicações.
          </p>
        </div>
      </div>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-copamar-primary">
          <span className="group-open:hidden">Ver guia rápido ▾</span>
          <span className="hidden group-open:inline">Esconder guia ▴</span>
        </summary>
        <ul className="mt-3 grid gap-3 small:grid-cols-3">
          {DICAS.map((x) => (
            <li
              key={x.t}
              className="rounded-lg border border-ui-border-base bg-ui-bg-base p-3"
            >
              <p className="text-sm font-semibold text-ui-fg-base">{x.t}</p>
              <p className="mt-1 text-xs text-ui-fg-subtle">{x.d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ui-fg-subtle">
          Quer ver os modelos?{" "}
          <LocalizedClientLink
            href="/categories/fraldas-geriatricas"
            className="font-semibold text-copamar-primary underline"
          >
            Fraldas geriátricas
          </LocalizedClientLink>{" "}
          ·{" "}
          <LocalizedClientLink
            href="/categories/roupa-intima"
            className="font-semibold text-copamar-primary underline"
          >
            Roupa íntima (Pants)
          </LocalizedClientLink>
        </p>
      </details>

      {/* CTA no FINAL do bloco (mt-auto pinça no rodapé do flex-col) */}
      <a
        href={WHATS_ESPECIALISTA}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex w-full items-center justify-center rounded-large bg-copamar-cta px-5 py-2.5 text-sm font-semibold text-[#0a2e6b] transition hover:bg-copamar-cta-dark"
      >
        Falar com especialista
      </a>
    </div>
  </section>
)

export default GuiaEscolha
