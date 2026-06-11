"use client"

import { useEffect, useMemo, useState } from "react"
import { brl, hojeBR, rotuloPagamento, type Parada, type StatusParada } from "../_lib/dados"
import { sair } from "../_lib/sessao"
import { registrarStatus, avisarRotaSaiHoje } from "../_lib/acoes"
import ComprovanteEntrega from "./comprovante"
import TentativaEntrega from "./tentativa"

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

  // "feitas" = paradas TRATADAS (entregue+ausente+adiado) — move a barra de
  // progresso do dia. Na tela final, o que conta é "entregues" de verdade,
  // com ausentes/adiados discriminados (auditoria 11/06).
  const feitas = useMemo(
    () => Object.values(status).filter((s) => s !== "pendente").length,
    [status]
  )
  const entregues = useMemo(
    () => Object.values(status).filter((s) => s === "entregue").length,
    [status]
  )
  const ausentes = useMemo(
    () => Object.values(status).filter((s) => s === "ausente").length,
    [status]
  )
  const adiados = useMemo(
    () => Object.values(status).filter((s) => s === "adiado").length,
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

  // GPS na marcação (Marco 11/06): prova de que o Dedé foi até o endereço —
  // principalmente no "ninguém em casa". Best-effort com timeout: GPS lento ou
  // negado NÃO trava a confirmação (registra sem coordenada).
  const [gpsLocal, setGpsLocal] = useState<Record<string, { lat: number; long: number }>>({})
  const pegaGps = (): Promise<{ lat: number; long: number } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      const to = setTimeout(() => resolve(null), 5000)
      navigator.geolocation.getCurrentPosition(
        (p) => {
          clearTimeout(to)
          resolve({ lat: p.coords.latitude, long: p.coords.longitude })
        },
        () => {
          clearTimeout(to)
          resolve(null)
        },
        { timeout: 5000, enableHighAccuracy: true }
      )
    })

  const confirmar = async (pedido: string) => {
    const novo = selecao[pedido]
    if (!novo || novo === "pendente") return
    // otimista: atualiza a tela na hora e grava no Supabase em seguida. Gravar
    // o status é o que faz a MAPA saber o progresso real ("estamos na nº X") e
    // (com a flag ligada) dispara o WhatsApp ao cliente.
    const anterior = status[pedido] || "pendente"
    setStatus((s) => ({ ...s, [pedido]: novo }))
    setSelecao((s) => ({ ...s, [pedido]: undefined }))
    const p = paradas.find((x) => x.numero_pedido === pedido)
    const gps = await pegaGps()
    if (gps) setGpsLocal((g) => ({ ...g, [pedido]: gps }))
    // se a gravação falhar, REVERTE o otimismo e avisa — marcação silenciosa
    // perdida era o pior cenário (auditoria 11/06)
    const reverte = () => {
      setStatus((s) => ({ ...s, [pedido]: anterior }))
      alert("Não consegui gravar — confere a internet e tenta de novo.")
    }
    registrarStatus({
      numero_pedido: pedido,
      status: novo,
      nome_cliente: p?.nome_cliente,
      celular: p?.celular,
      gps_lat: gps?.lat ?? null,
      gps_long: gps?.long ?? null,
    })
      .then((r) => {
        if (!r.ok) reverte()
      })
      .catch(reverte)
  }

  // "Terminei as entregas" (Marco): some a lista e mostra o "bom descanso" com
  // o resumo. Hora de início E o "terminei" ficam no localStorage (por dia) —
  // sobrevivem a recarga da página. Chaves de dias anteriores são limpas.
  // IMPORTANTE: a data da chave usa o MESMO fuso da rota (hojeBR, UTC-3) — com
  // data UTC, entre 21h e meia-noite BRT o "terminei" vazava pro dia seguinte e
  // a limpeza apagava a chave do dia corrente (auditoria 11/06)
  const [terminou, setTerminouState] = useState(false)
  const [inicio, setInicio] = useState<number | null>(null)
  useEffect(() => {
    const hoje = hojeBR()
    // limpa chaves de dias anteriores (não acumula lixo)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && /^entregas_(inicio|terminou)_/.test(k) && !k.endsWith(hoje)) {
        localStorage.removeItem(k)
      }
    }
    const k = `entregas_inicio_${hoje}`
    let v = localStorage.getItem(k)
    if (!v) {
      v = String(Date.now())
      localStorage.setItem(k, v)
    }
    setInicio(Number(v))
    if (localStorage.getItem(`entregas_terminou_${hoje}`) === "1") setTerminouState(true)
  }, [])
  const setTerminou = (v: boolean) => {
    const hoje = hojeBR()
    if (v) localStorage.setItem(`entregas_terminou_${hoje}`, "1")
    else localStorage.removeItem(`entregas_terminou_${hoje}`)
    setTerminouState(v)
  }
  const duracao = () => {
    if (!inicio) return ""
    const min = Math.max(1, Math.round((Date.now() - inicio) / 60000))
    const h = Math.floor(min / 60), m = min % 60
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`
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

  // sem rota importada hoje — NUNCA mostra rota demo em produção (auditoria 11/06)
  if (paradas.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl" aria-hidden>📋</div>
        <h1 className="mt-4 text-2xl font-bold text-[#1251b8]">Sem rota por enquanto</h1>
        <p className="mt-2 text-sm text-slate-500">
          A rota de hoje ainda não foi importada pelo escritório.
          <br />
          Assim que entrar, é só atualizar aqui.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-[#1251b8] px-8 py-3 text-sm font-bold text-white active:scale-[0.98]"
        >
          🔄 Atualizar
        </button>
        <form action={sair} className="mt-5">
          <button className="text-sm text-slate-400 underline underline-offset-2">Sair</button>
        </form>
      </div>
    )
  }

  // tela final — "Bom descanso, Dedé!" (contagem honesta: entregues de verdade,
  // com ausentes/adiados discriminados)
  if (terminou) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl" aria-hidden>🎉</div>
        <h1 className="mt-4 text-3xl font-extrabold text-[#1251b8]">Bom descanso, Dedé!</h1>
        <p className="mt-1 text-lg font-semibold text-slate-700">Missão cumprida 💪</p>
        <div className="mt-7 w-full max-w-xs rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-4xl font-bold text-[#22c55e]">
            {entregues} <span className="text-xl font-medium text-slate-400">de {paradas.length}</span>
          </p>
          <p className="text-sm text-slate-500">entregas concluídas</p>
          {(ausentes > 0 || adiados > 0) && (
            <p className="mt-2 text-xs text-slate-400">
              {[
                ausentes > 0 ? `${ausentes} ninguém em casa` : null,
                adiados > 0 ? `${adiados} pra outro dia` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {inicio && (
            <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
              feitas em <strong>{duracao()}</strong>
            </p>
          )}
        </div>
        <button
          onClick={() => setTerminou(false)}
          className="mt-7 text-sm text-slate-400 underline underline-offset-2"
        >
          voltar à lista
        </button>
      </div>
    )
  }

  return (
    <div className="pb-10">
      {/* topo */}
      <header className="sticky top-0 z-10 bg-[#1251b8] px-5 pb-4 pt-5 text-white shadow-md">
       <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs/4 opacity-80">Rota de hoje · Dedé</p>
            <h1 className="text-xl font-bold">{paradas.length} entregas</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/entregas/comprovantes"
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium active:scale-95"
            >
              📄 Comprovantes
            </a>
            <form action={sair}>
              <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium active:scale-95">
                Sair
              </button>
            </form>
          </div>
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
          disabled={aviso === "enviando…"}
          className="mt-3 w-full rounded-lg bg-white/15 py-2 text-xs font-semibold active:scale-[0.99] disabled:opacity-50"
        >
          {aviso || '📣 Avisar a rota: "sai hoje"'}
        </button>
       </div>
      </header>

      <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {sel === "entregue" ? (
                <ComprovanteEntrega
                  parada={p}
                  onFeito={() => {
                    setStatus((s) => ({ ...s, [p.numero_pedido]: "entregue" }))
                    setSelecao((s) => ({ ...s, [p.numero_pedido]: undefined }))
                  }}
                  onCancelar={() => cancelar(p.numero_pedido)}
                />
              ) : sel === "ausente" ? (
                <TentativaEntrega
                  parada={p}
                  onFeito={(gps) => {
                    setStatus((s) => ({ ...s, [p.numero_pedido]: "ausente" }))
                    setSelecao((s) => ({ ...s, [p.numero_pedido]: undefined }))
                    if (gps) setGpsLocal((g) => ({ ...g, [p.numero_pedido]: gps }))
                  }}
                  onCancelar={() => cancelar(p.numero_pedido)}
                />
              ) : sel ? (
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
              {st === "entregue" && (
                <a
                  href={`/entregas/comprovante/${p.numero_pedido}`}
                  className="mt-2 block text-center text-xs font-semibold text-[#1251b8]"
                >
                  📄 ver comprovante
                </a>
              )}
              {st === "ausente" &&
                (() => {
                  // prova da tentativa: GPS capturado na marcação (recém-feita
                  // ou vinda do banco após reload)
                  const g =
                    gpsLocal[p.numero_pedido] ||
                    (p.gps_lat && p.gps_long ? { lat: p.gps_lat, long: p.gps_long } : null)
                  return g ? (
                    <a
                      href={`https://www.google.com/maps?q=${g.lat}%2C${g.long}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-center text-xs font-semibold text-amber-700"
                    >
                      📍 tentativa registrada — ver no mapa
                    </a>
                  ) : null
                })()}
            </li>
          )
        })}
      </ul>

      {/* fim da rota — "Terminei as entregas" */}
      <div className="mx-auto max-w-md px-4 pt-6">
        <button
          onClick={() => setTerminou(true)}
          className="w-full rounded-2xl bg-[#1251b8] py-4 text-base font-bold text-white shadow-sm active:scale-[0.99]"
        >
          ✅ Terminei as entregas
        </button>
      </div>
    </div>
  )
}
