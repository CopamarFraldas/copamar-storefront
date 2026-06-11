import { redirect } from "next/navigation"
import { logado } from "../_lib/sessao"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

/** Entregas concluídas dos últimos 30 dias — contestação de chargeback chega
 * DIAS depois da entrega, então só "hoje" não servia (auditoria 11/06). */
async function getEntregues() {
  if (!SUPA || !KEY) return []
  const corte = new Date(Date.now() - 30 * 86400000 - 3 * 3600 * 1000).toISOString().slice(0, 10)
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?status=eq.entregue&data_rota=gte.${corte}` +
        `&select=numero_pedido,nome_cliente,entregue_em,recebedor_nome,foto_url,gps_lat,data_rota` +
        `&order=entregue_em.desc&limit=200`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    )
    return r.ok ? await r.json() : []
  } catch {
    return []
  }
}

const hora = (iso: string) => {
  if (!iso) return ""
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}
const diaBr = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "")

/**
 * Comprovantes (Marco 11/06) — entregas concluídas dos últimos 30 dias,
 * agrupadas por dia, pra baixar o comprovante (PDF) e anexar em contestação.
 */
export default async function ComprovantesPage() {
  if (!(await logado())) redirect("/entregas")
  const lista: any[] = await getEntregues()

  // agrupa por dia da rota (mais recente primeiro)
  const porDia = new Map<string, any[]>()
  for (const e of lista) {
    const k = e.data_rota || "—"
    if (!porDia.has(k)) porDia.set(k, [])
    porDia.get(k)!.push(e)
  }
  const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10)

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <a href="/entregas/rota" className="mb-4 inline-block text-sm text-[#1251b8]">← voltar pra rota</a>
      <h1 className="text-2xl font-bold text-[#1251b8]">Comprovantes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Entregas concluídas dos últimos 30 dias. Toque pra abrir e baixar o comprovante (PDF).
      </p>

      {lista.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Nenhuma entrega concluída nos últimos 30 dias.
        </p>
      ) : (
        Array.from(porDia.entries()).map(([dia, itens]) => (
          <section key={dia} className="mt-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              {dia === hoje ? "Hoje" : diaBr(dia)} · {itens.length} entrega{itens.length > 1 ? "s" : ""}
            </h2>
            <ul className="flex flex-col gap-2">
              {itens.map((e) => (
                <li key={`${dia}-${e.numero_pedido}`}>
                  <a
                    href={`/entregas/comprovante/${e.numero_pedido}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {e.nome_cliente || `Pedido #${e.numero_pedido}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        #{e.numero_pedido} · entregue {hora(e.entregue_em)}
                        {e.recebedor_nome ? ` · recebeu: ${e.recebedor_nome}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-3">
                      <span title="foto">{e.foto_url ? "📷" : ""}</span>
                      <span title="GPS">{e.gps_lat ? "📍" : ""}</span>
                      <span className="text-sm font-semibold text-[#1251b8]">📄</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
