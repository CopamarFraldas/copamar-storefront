/**
 * Bloco de confiança/benefícios no box de compra da PDP (Marco 09/06): o lado
 * direito do desktop estava "faltando coisa". Resume o que dá segurança pra
 * fechar — parcelamento, frete grátis, embalagem discreta, NF e pagamento
 * seguro. Dados reais (llms.txt / políticas da loja).
 */
const ITENS: { icone: React.ReactNode; titulo: string; detalhe: string }[] = [
  {
    icone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
    titulo: "Em até 3x sem juros",
    detalhe: "ou 5% de desconto no PIX/boleto",
  },
  {
    icone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M1 3h15v13H1z" />
        <path d="M16 8h4l3 3v5h-7z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    titulo: "Frete grátis acima de R$ 50",
    detalhe: "nas regiões atendidas pela nossa entrega",
  },
  {
    icone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12l8.73-5.04" />
      </svg>
    ),
    titulo: "Embalagem 100% discreta",
    detalhe: "caixa neutra — ninguém vê o conteúdo",
  },
  {
    icone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </svg>
    ),
    titulo: "Nota fiscal em toda compra",
    detalhe: "CPF ou CNPJ",
  },
  {
    icone: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    titulo: "Pagamento seguro",
    detalhe: "cartão, PIX e boleto via PagBank",
  },
]

export default function BeneficiosCompra() {
  return (
    <div className="rounded-large border border-copamar-primary/10 bg-copamar-primary/[0.03] p-4">
      <ul className="flex flex-col gap-3.5">
        {ITENS.map((it) => (
          <li key={it.titulo} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-copamar-primary">{it.icone}</span>
            <span className="leading-snug">
              <span className="block text-sm font-medium text-ui-fg-base">
                {it.titulo}
              </span>
              <span className="block text-xs text-ui-fg-subtle">{it.detalhe}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
