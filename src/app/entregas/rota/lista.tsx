"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { brl, hojeBR, rotuloPagamento, type Parada, type StatusParada } from "../_lib/dados"
import { sair } from "../_lib/sessao"
import { registrarStatus, avisarRotaSaiHoje } from "../_lib/acoes"
import ComprovanteEntrega from "./comprovante"
import TentativaEntrega from "./tentativa"
import MapaRota from "./mapa-rota"

/**
 * Lista da rota do dia (Marco 10/06). Cada parada: nome, endereço (abrir no
 * mapa), pagamento (🟢 já pago / 💰 cobrar), telefone e os botões Entregue /
 * Ausente. MVP visual: o status muda LOCAL — a persistência (banco que o Marco
 * escolher + WhatsApp + regra 3x/+3 dias úteis) é a Fase 1B.
 */
export default function ListaRota({
  paradas,
  motoristaNome = "Dedé",
}: {
  paradas: Parada[]
  motoristaNome?: string
}) {
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

  // botão "avisar a rota": fica CINZA e inclicável depois de usado (Marco
  // 12/06) — o estado vem do banco (aviso_sai_hoje_em) e do pós-clique
  const [aviso, setAviso] = useState("")
  const [jaTentou, setJaTentou] = useState(false)
  const [rodando, setRodando] = useState(false)
  const rotaJaAvisada =
    paradas.some((p) => p.aviso_sai_hoje_em) || aviso.startsWith("✓")
  // GATE (Marco 15/06): tudo abaixo do botão fica cinza até a rota ser avisada.
  // BUGS 16/06 corrigidos: (1) só marca "✓ avisado" quando ALGO realmente saiu
  // (enviados>0) — antes usava o total TENTADO, então um soluço do gateway
  // marcava "avisado" com 0 enviados; (2) libera as entregas na TENTATIVA, não
  // no sucesso — senão gateway fora trancaria o motorista.
  const liberado = rotaJaAvisada || jaTentou
  const avisarRota = async () => {
    if (rodando || rotaJaAvisada) return
    setRodando(true)
    setJaTentou(true) // libera as entregas JÁ — o aviso roda com retry em paralelo
    setAviso("enviando…")
    // RETRY EM ROUNDS (Marco 16/06): a partir do clique, re-chama a action até
    // TODOS saírem 1x ou bater o teto. Cada chamada só pega os SEM trava (não
    // duplica). Teto evita loop infinito em número quebrado (volta "sem WhatsApp").
    const MAX = 8
    let totalAlvos = 0
    let enviadosTotal = 0
    let jaAvisada = false
    for (let i = 1; i <= MAX; i++) {
      try {
        const r = await avisarRotaSaiHoje()
        if (i === 1) totalAlvos = r.total || 0
        enviadosTotal += r.enviados || 0
        if (r.ja_avisada) {
          jaAvisada = true
          break
        }
        if ((r.falhas ?? 0) === 0) break // round sem falha → todos enviados
        setAviso(`enviando… (${enviadosTotal} ok, tentando o resto…)`)
      } catch {
        /* erro de rede nesta rodada — retenta após o backoff */
      }
      if (i < MAX) await new Promise((res) => setTimeout(res, Math.min(i * 2000, 10000)))
    }
    if (jaAvisada && enviadosTotal === 0) {
      setAviso("✓ Rota avisada")
    } else if (enviadosTotal > 0) {
      const falhas = Math.max(0, totalAlvos - enviadosTotal)
      setAviso(
        falhas > 0
          ? `✓ Avisados ${enviadosTotal} · ${falhas} sem WhatsApp`
          : `✓ Rota avisada (${enviadosTotal} clientes)`
      )
    } else {
      setAviso("⚠️ aviso não saiu — toque pra tentar de novo")
    }
    setRodando(false)
  }

  // AUTO-FINALIZAÇÃO (Marco 12/06): quando a ÚLTIMA pendente é tratada, o
  // "Bom descanso" abre sozinho — sem botão "Terminei". Dispara só na
  // TRANSIÇÃO >0 → 0 (reload com tudo pronto não força a tela; e o "voltar
  // à lista" do Bom descanso segue funcionando pra revisar).
  const pendentes = paradas.length - feitas
  const prevPend = useRef<number | null>(null)
  useEffect(() => {
    if (prevPend.current !== null && prevPend.current > 0 && pendentes === 0 && paradas.length > 0) {
      setTerminou(true)
    }
    prevPend.current = pendentes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendentes, paradas.length])

  const LABEL: Record<StatusParada, string> = {
    pendente: "",
    entregue: "Entregue ✅",
    ausente: "Ninguém em casa 🚪",
    adiado: "Deixar pra outro dia 📅",
  }

  // LINHAS COLAPSÁVEIS (redesign Spoke, Marco 11/06): cada parada é uma linha
  // compacta; clicar expande os botões. A PRÓXIMA pendente abre sozinha (e o
  // pino dela pulsa no mapa). Entregues vão pra aba cinza no topo.
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})
  const [mostrarEntregues, setMostrarEntregues] = useState(false)
  const proxima = paradas.find((p) => (status[p.numero_pedido] || "pendente") === "pendente")
  const estaAberta = (pedido: string) =>
    expandido[pedido] ?? proxima?.numero_pedido === pedido
  const toggleLinha = (pedido: string) =>
    setExpandido((e) => ({ ...e, [pedido]: !estaAberta(pedido) }))
  const entreguesArr = paradas.filter((p) => status[p.numero_pedido] === "entregue")
  const ativas = paradas.filter((p) => status[p.numero_pedido] !== "entregue")

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
            <p className="text-xs/4 opacity-80">Rota de hoje · {motoristaNome}</p>
            <h1 className="text-xl font-bold">{paradas.length} entregas</h1>
          </div>
          <div className="flex items-center gap-2">

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
          disabled={rodando || rotaJaAvisada}
          className={`mt-3 w-full rounded-xl font-bold transition active:scale-[0.99] ${
            rotaJaAvisada
              ? "cursor-not-allowed bg-white/10 py-2 text-xs text-white/50"
              : `bg-white py-3.5 text-sm text-[#1251b8] shadow-lg ring-2 ring-white/70 ${
                  aviso ? "" : "animate-pulse"
                }`
          }`}
        >
          {rotaJaAvisada
            ? '✓ Clientes avisados — pode entregar'
            : aviso || "🚀 Iniciar entregas (avisar clientes)"}
        </button>
       </div>
      </header>

      {/* aviso do gate (Marco 15/06): some assim que a rota é avisada */}
      {!liberado && (
        <div className="mx-auto mt-3 max-w-3xl px-4">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800 ring-1 ring-amber-200">
            👆 Toque em <strong>“Iniciar entregas”</strong> aí em cima pra avisar os
            clientes que a entrega sai hoje. As paradas liberam logo em seguida. 🚚
          </p>
        </div>
      )}

      {/* GATE: tudo abaixo só fica colorido e clicável DEPOIS de avisar a rota */}
      <div
        className={liberado ? undefined : "pointer-events-none select-none opacity-40 grayscale"}
        aria-disabled={!liberado}
      >
      {/* MAPA DA ROTA estilo Spoke: pinos numerados, trajeto, próxima pulsando */}
      <div className="mx-auto max-w-6xl">
        <MapaRota paradas={paradas} status={status} />
      </div>

      <div className="mx-auto max-w-3xl px-3 pt-3">
        {/* aba ENTREGUES (cinza, recolhida) no topo */}
        {entreguesArr.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-xl bg-slate-100">
            <button
              onClick={() => setMostrarEntregues((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              <span>✅ Entregues ({entreguesArr.length})</span>
              <span className={`transition-transform ${mostrarEntregues ? "rotate-180" : ""}`} aria-hidden>▾</span>
            </button>
            {mostrarEntregues && (
              <ul className="border-t border-slate-200">
                {entreguesArr.map((p) => (
                  <li
                    key={p.numero_pedido}
                    className="flex items-center gap-2.5 border-b border-slate-200/70 px-4 py-2 last:border-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">✓</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-500 line-through">{p.endereco || p.nome_cliente}</p>
                      <p className="text-[11px] text-slate-400">#{p.numero_pedido}{p.nome_cliente ? ` · ${p.nome_cliente}` : ""}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* LINHAS das entregas (clica → expande os botões) */}
        <ul className="flex flex-col gap-1.5 pb-2">
        {ativas.map((p) => {
          const st = status[p.numero_pedido]
          const sel = selecao[p.numero_pedido]
          const aberta = estaAberta(p.numero_pedido)
          const ehProxima = proxima?.numero_pedido === p.numero_pedido
          return (
            <li
              key={p.numero_pedido}
              className={`overflow-hidden rounded-xl bg-white shadow-sm transition ${
                ehProxima ? "ring-2 ring-[#1251b8]/50" : ""
              }`}
            >
              {/* LINHA compacta: nº · endereço · pedido · cobrança · valor */}
              <button
                onClick={() => toggleLinha(p.numero_pedido)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                aria-expanded={aberta}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    p.instrucao_cliente
                      ? "bg-red-400 text-white ring-2 ring-red-200"
                      : st === "ausente"
                        ? "bg-amber-400 text-white"
                        : st === "adiado"
                          ? "bg-indigo-400 text-white"
                          : ehProxima
                            ? "bg-[#1251b8] text-white"
                            : "bg-[#1251b8]/10 text-[#1251b8]"
                  }`}
                >
                  {/* parada COM recado → bolinha vermelha clara, número dentro (Marco 16/06) */}
                  {p.instrucao_cliente
                    ? p.ordem
                    : st === "ausente"
                      ? "!"
                      : st === "adiado"
                        ? "↦"
                        : p.ordem}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {p.endereco || p.nome_cliente || `Pedido #${p.numero_pedido}`}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    #{p.numero_pedido}
                    {p.nome_cliente ? ` · ${p.nome_cliente}` : ""}
                  </p>
                </div>
                {p.ja_pago ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">🟢 pago</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-right text-[11px] font-bold text-orange-700">
                    💰 {brl(p.valor_total)}
                  </span>
                )}
                <span className={`shrink-0 text-slate-400 transition-transform ${aberta ? "rotate-180" : ""}`} aria-hidden>▾</span>
              </button>

              {/* CORPO expandido */}
              <div className={aberta ? "px-3 pb-3" : "hidden"}>

              {/* endereço + navegação (Maps OU Waze — Marco 11/06) */}
              {p.endereco && (
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-lg">📍</span>
                    <span className="min-w-0 flex-1 leading-snug">{p.endereco}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        p.maps_query || p.endereco
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white py-2 text-center text-xs font-bold text-[#1251b8] shadow-sm active:scale-[0.98]"
                    >
                      🗺️ Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(
                        p.maps_query || p.endereco
                      )}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white py-2 text-center text-xs font-bold text-[#33ccff] shadow-sm active:scale-[0.98]"
                    >
                      🚗 Waze
                    </a>
                  </div>
                </div>
              )}

              {/* instrução que o CLIENTE mandou no WhatsApp (fast-path da MAPA) */}
              {p.instrucao_cliente && (
                <p className="mt-2 rounded-lg border border-red-300 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
                  <span className="mr-1 animate-pulse text-sm font-extrabold text-red-600" aria-hidden>
                    ❗
                  </span>
                  💬 Cliente avisou: “{p.instrucao_cliente}”
                </p>
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
              </div>{/* fim do corpo expandido */}
            </li>
          )
        })}
        </ul>
      </div>
      </div>{/* fim do GATE — libera quando a rota é avisada */}

    </div>
  )
}
