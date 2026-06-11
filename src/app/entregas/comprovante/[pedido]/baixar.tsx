"use client"

/** Botão "Baixar PDF" — usa a impressão do navegador (Salvar como PDF). Some na
 * impressão (print:hidden). Mobile e desktop. */
export default function BotaoBaixar() {
  return (
    <div className="no-print mx-auto mt-6 flex max-w-2xl gap-3 px-4">
      <button
        onClick={() => window.print()}
        className="flex-1 rounded-xl bg-[#1251b8] py-3 text-sm font-bold text-white active:scale-[0.99]"
      >
        📄 Baixar / Imprimir comprovante
      </button>
      <a
        href="/entregas/rota"
        className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600"
      >
        Voltar
      </a>
    </div>
  )
}
