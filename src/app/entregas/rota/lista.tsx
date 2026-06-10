"use client"

import { useMemo, useState } from "react"
import { brl, rotuloPagamento, type Parada, type StatusParada } from "../_lib/dados"
import { sair } from "../_lib/sessao"
import { registrarStatus, avisarRotaSaiHoje } from "../_lib/acoes"

/**
 * Lista da rota do dia (Marco 10/06). Cada parada: nome, endereço (abrir no
 * mapa), pagamento (🟢 já pago / 💰 cobrar), telefone e os botões Entregue /
 * Ausente. MVP visual: o status muda LOCAL — a persistência (banco que o Marco
 * escolher + WhatsApp + regra 3x/+3 dias úteis) é a Fase 1B.
 */
export default function ListaRota({ paradas }: { paradas: Parada[] }) {
  const [status, setStatus] = useState<Record<string, StatusParada>>(
    Object.fromEntries(paradas.map((p) => [p.numero_pedido, p.status]))
  )
  // TRAVA DE SEGURANÇA (Marco 10/06): tocar num botão SELECIONA; só "Confirmar"
  // aplica — cada ação dispara um WhatsApp real, então um toque errado mandaria
  // a mensagem errada pro cliente. A confirmação de 2 passos previne isso.
  const [selecao, setSelecao] = useState<Record<string, StatusParada | undefined>>({})

  const feitas = useMemo(
    () => Object.values(status).filter((s) => s !== "pendente").length,
    [status]
  )
  const aCobrar = useMemo(
    () => paradas.filter((p) => !p.ja_pago).reduce((s, p) => s + p.valor_total, 0),
    [paradas]
  )

  const selecionar = (pedido: string, novo: StatusParada) =>
    setSelecao((s) => ({ ...s, [pedido]: s[pedido] === novo ? undefined : novo }))
  const cancelar = (pedido: string) =>
    setSelecao((s) => ({ ...s, [pedido]: undefined }))
  const confirmar = (pedido: string) => {
    const novo = selecao[pedido]
    if (!novo || novo === "pendente") return
    // otimista: atualiza a tela na hora e grava no Supabase em seguida. Gravar
    // o status é o que faz a MAPA saber o progresso real ("estamos na nº X") e
    // (com a flag ligada) dispara o WhatsApp ao cliente.
    setStatus((s) => ({ ...s, [pedido]: novo }))
    setSelecao((s) => ({ ...s, [pedido]: undefined }))
    const p = paradas.find((x) => x.numero_pedido === pedido)
    registrarStatus({
      numero_pedido: pedido,
      status: novo,
      nome_cliente: p?.nome_cliente,
      celular: p?.celular,
    }).catch(() => {})
  }

  const [aviso, setAviso] = useState("")
  const avisarRota = async () => {
    if (aviso === "enviando…") return
    setAviso("enviando…")
    try {
      const r = await avisarRotaSaiHoje()
      setAviso(`✓ ${r.total} clientes avisados`)
    } catch {
      setAviso("erro ao avisar")
    }
  }

  const LABEL: Record<StatusParada, string> = {
    pendente: "",
    entregue: "Entregue ✅",
    ausente: "Ninguém em casa 🚪",
    adiado: "Deixar pra outro dia 📅",
  }

  return (
    <div className="pb-10">
      {/* topo */}
      <header className="sticky top-0 z-10 bg-[#1251b8] px-5 pb-4 pt-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs/4 opacity-80">Rota de hoje · Dedé</p>
            <h1 className="text-xl font-bold">{paradas.length} entregas</h1>
          </div>
          <form action={sair}>
            <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium active:scale-95">
              Sair
            </button>
          </form>
        </div>
        {/* progresso */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-[#22c55e] transition-all"
              style={{ width: `${(feitas / paradas.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums">
            {feitas}/{paradas.length}
          </span>
        </div>
        <p className="mt-2 text-xs opacity-80">
          A receber na rua: <strong>{brl(aCobrar)}</strong>
        </p>
        <button
          onClick={avisarRota}
          className="mt-3 w-full rounded-lg bg-white/15 py-2 text-xs font-semibold active:scale-[0.99]"
        >
          {aviso || '📣 Avisar a rota: "sai hoje"'}
        </button>
      </header>

      <ul className="flex flex-col gap-3 px-4 pt-4">
        {paradas.map((p) => {
          const st = status[p.numero_pedido]
          const sel = selecao[p.numero_pedido]
          const concluida = st !== "pendente"
          return (
            <li
              key={p.numero_pedido}
              className={`rounded-2xl bg-white p-4 shadow-sm transition ${
                concluida ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    st === "entregue"
                      ? "bg-[#22c55e] text-white"
                      : st === "ausente"
                        ? "bg-amber-400 text-white"
                        : st === "adiado"
                          ? "bg-indigo-400 text-white"
                          : "bg-[#1251b8]/10 text-[#1251b8]"
                  }`}
                >
                  {st === "entregue" ? "✓" : st === "ausente" ? "!" : st === "adiado" ? "↦" : p.ordem}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {p.nome_cliente || `Pedido #${p.numero_pedido}`}
                  </p>
                  <p className="text-xs text-slate-500">Pedido #{p.numero_pedido}</p>
                </div>
                {/* selo de pagamento */}
                {p.ja_pago ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    🟢 {rotuloPagamento(p)}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-right text-xs font-bold text-orange-700">
                    💰 {brl(p.valor_total)}
                    <span className="block text-[10px] font-medium opacity-80">
                      {p.forma_pagamento}
                    </span>
                  </span>
                )}
              </div>

              {/* endereço + mapa */}
              {p.endereco && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    p.maps_query || p.endereco
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 active:bg-slate-100"
                >
                  <span className="text-lg">📍</span>
                  <span className="min-w-0 flex-1 leading-snug">{p.endereco}</span>
                  <span className="shrink-0 text-xs font-semibold text-[#1251b8]">
                    abrir →
                  </span>
                </a>
              )}

              {/* telefone */}
              {p.celular && (
                <a
                  href={`tel:${p.celular.replace(/\D/g, "")}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#1251b8]"
                >
                  📞 {p.celular}
                </a>
              )}

              {/* ações com TRAVA DE SEGURANÇA: seleciona → Confirmar (evita
                  toque errado disparar a mensagem errada pro cliente) */}
              {sel ? (
                <div className="mt-3 rounded-xl border border-[#1251b8]/20 bg-[#1251b8]/5 p-3">
                  <p className="text-center text-sm text-slate-700">
                    Marcar como <strong>{LABEL[sel]}</strong>?
                  </p>
                  <p className="mb-2 text-center text-xs text-slate-500">
                    Vou avisar o cliente no WhatsApp.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => cancelar(p.numero_pedido)}
                      className="rounded-xl bg-white py-3 text-sm font-semibold text-slate-500 active:scale-[0.98]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => confirmar(p.numero_pedido)}
                      className="rounded-xl bg-[#1251b8] py-3 text-sm font-bold text-white active:scale-[0.98]"
                    >
                      Confirmar ✓
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => selecionar(p.numero_pedido, "entregue")}
                      className={`rounded-xl py-3 text-sm font-bold active:scale-[0.98] ${
                        st === "entregue" ? "bg-[#22c55e] text-white" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      ✅ Entregue
                    </button>
                    <button
                      onClick={() => selecionar(p.numero_pedido, "ausente")}
                      className={`rounded-xl py-3 text-sm font-bold active:scale-[0.98] ${
                        st === "ausente" ? "bg-amber-400 text-white" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      🚪 Ninguém em casa
                    </button>
                  </div>
                  <button
                    onClick={() => selecionar(p.numero_pedido, "adiado")}
                    className={`mt-2 w-full rounded-xl py-2.5 text-sm font-semibold active:scale-[0.98] ${
                      st === "adiado" ? "bg-indigo-400 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    📅 Deixar pra outro dia
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
