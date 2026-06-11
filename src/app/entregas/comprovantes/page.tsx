import { redirect } from "next/navigation"
import { logado } from "../_lib/sessao"
import { hojeBR } from "../_lib/dados"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

async function getEntregues() {
  if (!SUPA || !KEY) return []
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&status=eq.entregue` +
        `&select=numero_pedido,nome_cliente,entregue_em,recebedor_nome,foto_url,gps_lat&order=entregue_em.desc`,
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

/**
 * Comprovantes do dia (Marco 11/06) — lista as entregas concluídas pra baixar o
 * comprovante de cada (PDF), pra anexar em e-mail numa contestação.
 */
export default async function ComprovantesPage() {
  if (!(await logado())) redirect("/entregas")
  const lista: any[] = await getEntregues()

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8">
      <a href="/entregas/rota" className="mb-4 inline-block text-sm text-[#1251b8]">← voltar pra rota</a>
      <h1 className="text-2xl font-bold text-[#1251b8]">Comprovantes de hoje</h1>
      <p className="mt-1 text-sm text-slate-500">
        Entregas concluídas. Toque pra abrir e baixar o comprovante (PDF) — pra anexar em e-mail.
      </p>

      {lista.length === 0 ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Nenhuma entrega concluída ainda hoje.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {lista.map((e) => (
            <li key={e.numero_pedido}>
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
      )}
    </div>
  )
}
