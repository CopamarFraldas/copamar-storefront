/**
 * Faixa B2B / atacado (item 7 da proposta) — captura revenda/profissional e
 * manda pro WhatsApp do atendente HUMANO (mesmo número do FAB), com mensagem
 * pré-preenchida. Reforça o forte da Copamar (atacadista).
 */
const WHATS =
  "https://wa.me/5511952050000?text=" +
  encodeURIComponent(
    "Olá! Vim pelo site da Copamar e gostaria de saber as condições de atacado/revenda."
  )

const B2bStrip = () => (
  <section className="bg-copamar-primary text-white">
    <div className="content-container flex flex-col items-center gap-4 py-10 text-center small:flex-row small:justify-between small:text-left">
      <div>
        <h2 className="text-xl font-bold small:text-2xl">
          É revenda ou profissional de saúde?
        </h2>
        <p className="mt-1 text-sm text-white/85">
          Condições especiais de atacado para farmácias, clínicas, casas de
          repouso e cuidadores.
        </p>
      </div>
      <a
        href={WHATS}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-x-2 rounded-large bg-white px-6 py-3 font-semibold text-copamar-primary transition hover:bg-white/90"
      >
        <span aria-hidden>💬</span>
        Falar com o atacado no WhatsApp
      </a>
    </div>
  </section>
)

export default B2bStrip
