/**
 * Faixa de confiança (item 2 da proposta) — 4 selos sóbrios reforçando os
 * gatilhos de um produto de cuidado/saúde: fábrica, alcance, pagamento, tradição.
 * Todos fatos reais (sem claim médico). Server component, zero JS.
 */
const ITENS = [
  { icone: "🏭", titulo: "Direto das fábricas", sub: "Atacado e varejo" },
  { icone: "📦", titulo: "Entrega em todo Brasil", sub: "Frete calculado no CEP" },
  { icone: "💳", titulo: "3x sem juros no crédito", sub: "ou 5% de desconto no PIX" },
  { icone: "🛡️", titulo: "Especialistas desde 2006", sub: "em fraldas geriátricas" },
]

const TrustStrip = () => (
  <section
    aria-label="Por que comprar na Copamar"
    className="border-b border-ui-border-base bg-ui-bg-base"
  >
    <div className="content-container grid grid-cols-2 gap-4 py-6 small:grid-cols-4 small:py-8">
      {ITENS.map((i) => (
        <div key={i.titulo} className="flex items-center gap-x-3">
          <span aria-hidden className="text-2xl">
            {i.icone}
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ui-fg-base">{i.titulo}</p>
            <p className="text-xs text-ui-fg-subtle">{i.sub}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default TrustStrip
