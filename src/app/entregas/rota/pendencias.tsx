"use client"

import { useState } from "react"
import { brl, type Parada } from "../_lib/dados"
import { registrarEntrega } from "../_lib/acoes"

/**
 * Pendências de dias anteriores (Marco 23/07 — caso 20814/20822): parada adiada/
 * ausente que o motorista resolveu DEPOIS ficava órfã (a rota do dia anterior
 * não abre mais no app) e o escritório só via "adiado" fantasma dias depois.
 * Aqui elas aparecem no topo da rota do dia com um fechamento simples: nome de
 * quem recebeu (+ CPF opcional) → entregue, com a DATA DA ROTA original
 * preservada. Sem foto/GPS (é fechamento retroativo) e sem WhatsApp pro cliente
 * (ele já recebeu — o aviso atrasado só confundiria; o acoes.ts pula o aviso
 * quando data_rota ≠ hoje).
 */
export default function PendenciasAnteriores({ pendencias }: { pendencias: Parada[] }) {
  const [aberta, setAberta] = useState<string | null>(null)
  const [feitas, setFeitas] = useState<Record<string, boolean>>({})
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const restantes = pendencias.filter((p) => !feitas[`${p.data_rota}:${p.numero_pedido}`])
  if (restantes.length === 0) return null

  const ddmm = (iso?: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "")

  async function fechar(p: Parada, form: HTMLFormElement) {
    setSalvando(true)
    setErro(null)
    const fd = new FormData(form)
    fd.set("numero_pedido", p.numero_pedido)
    if (p.data_rota) fd.set("data_rota", p.data_rota)
    if (p.celular) fd.set("celular", p.celular)
    if (p.nome_cliente) fd.set("nome_cliente", p.nome_cliente)
    const r = await registrarEntrega(fd)
    setSalvando(false)
    if (r.ok) {
      setFeitas((f) => ({ ...f, [`${p.data_rota}:${p.numero_pedido}`]: true }))
      setAberta(null)
    } else {
      setErro(r.erro || "Não deu — tenta de novo.")
    }
  }

  return (
    <section className="mx-4 mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <h2 className="text-sm font-bold text-amber-800">
        ⏰ Pendências de dias anteriores ({restantes.length})
      </h2>
      <p className="mt-1 text-xs text-amber-700">
        Entregas adiadas que ainda não foram fechadas. Se você já entregou, marca aqui quem recebeu.
      </p>
      <ul className="mt-3 space-y-3">
        {restantes.map((p) => {
          const chave = `${p.data_rota}:${p.numero_pedido}`
          return (
            <li key={chave} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-800">{p.nome_cliente || "Cliente"}</div>
                  <div className="text-xs text-slate-500">
                    Pedido #{p.numero_pedido} · rota de {ddmm(p.data_rota)} · {p.ja_pago ? "🟢 já pago" : `💰 ${brl(p.valor_total)}`}
                  </div>
                  {p.endereco && <div className="mt-1 text-xs text-slate-500">{p.endereco}</div>}
                </div>
                {aberta !== chave && (
                  <button
                    onClick={() => { setAberta(chave); setErro(null) }}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white active:scale-[0.98]"
                  >
                    ✅ Entreguei
                  </button>
                )}
              </div>
              {aberta === chave && (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(e) => { e.preventDefault(); void fechar(p, e.currentTarget) }}
                >
                  <input
                    name="recebedor_nome"
                    required
                    placeholder="Quem recebeu? (ex.: Bruno — portaria)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="recebedor_cpf"
                    inputMode="numeric"
                    placeholder="CPF de quem recebeu (opcional)"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  {erro && <div className="text-xs font-bold text-red-600">{erro}</div>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50 active:scale-[0.98]"
                    >
                      {salvando ? "Salvando…" : "Confirmar entrega"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAberta(null)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
                    >
                      Voltar
                    </button>
                  </div>
                </form>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
