import { redirect } from "next/navigation"
import { logado } from "../../_lib/sessao"
import BotaoBaixar from "./baixar"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

async function getComprovante(pedido: string) {
  if (!SUPA || !KEY) return null
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?numero_pedido=eq.${encodeURIComponent(pedido)}` +
        `&order=entregue_em.desc&limit=1`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    )
    if (!r.ok) return null
    const rows = await r.json()
    return rows?.[0] || null
  } catch {
    return null
  }
}

const dataBr = (iso: string) => {
  if (!iso) return "—"
  // fuso BR (UTC-3): subtrai 3h e lê em UTC pra não depender do TZ do servidor
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} às ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}
const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0)

/**
 * COMPROVANTE de entrega imprimível (Marco 11/06) — documento pra anexar em
 * e-mail na contestação de chargeback. "Baixar" = imprimir → salvar como PDF.
 */
export default async function ComprovantePage(props: {
  params: Promise<{ pedido: string }>
}) {
  if (!(await logado())) redirect("/entregas")
  const { pedido } = await props.params
  const c = await getComprovante(pedido)

  if (!c) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center text-slate-500">
        Comprovante não encontrado para o pedido #{pedido}.
        <a href="/entregas/rota" className="mt-3 block text-[#1251b8]">← voltar</a>
      </div>
    )
  }

  const mapa =
    c.gps_lat && c.gps_long
      ? `https://www.google.com/maps?q=${c.gps_lat}%2C${c.gps_long}`
      : null
  const Linha = ({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) => (
    <div className="flex gap-2 border-b border-slate-100 py-2 text-sm">
      <span className="w-40 shrink-0 font-semibold text-slate-500">{rotulo}</span>
      <span className="text-slate-800">{valor}</span>
    </div>
  )

  return (
    <div className="bg-white">
      <style>{`@media print { .no-print { display: none !important } body { background: #fff } @page { margin: 14mm } }`}</style>

      <div className="mx-auto max-w-2xl px-6 py-8 text-slate-900">
        {/* cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-[#1251b8] pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#1251b8]">Comprovante de Entrega</h1>
            <p className="text-xs text-slate-500">Copamar Distribuidora e Atacadista de Fraldas e Produtos de Higiene Ltda - ME</p>
            <p className="text-xs text-slate-500">CNPJ 08.140.992/0001-64</p>
          </div>
          <div className="text-3xl" aria-hidden>🚚</div>
        </div>

        {/* dados */}
        <div className="mt-4">
          <Linha rotulo="Pedido" valor={<strong>#{c.numero_pedido}</strong>} />
          <Linha rotulo="Cliente" valor={c.nome_cliente || "—"} />
          <Linha rotulo="Endereço de entrega" valor={c.endereco || "—"} />
          <Linha rotulo="Valor" valor={`${brl(c.valor_total)} · ${c.forma_pagamento || "—"}`} />
          <Linha rotulo="Entregue em" valor={<strong>{dataBr(c.entregue_em)}</strong>} />
          <Linha rotulo="Recebido por" valor={c.recebedor_nome || "—"} />
          <Linha rotulo="CPF do recebedor" valor={c.recebedor_cpf || "—"} />
          <Linha
            rotulo="Localização (GPS)"
            valor={
              mapa ? (
                <span>
                  {Number(c.gps_lat).toFixed(6)}, {Number(c.gps_long).toFixed(6)}{" "}
                  <a href={mapa} target="_blank" rel="noreferrer" className="text-[#1251b8] underline">
                    ver no mapa
                  </a>
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>

        {/* foto */}
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-500">Foto da entrega</p>
          {c.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.foto_url} alt="Foto da entrega" className="max-h-80 rounded-lg border border-slate-200 object-contain" />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
              Sem foto registrada nesta entrega.
            </p>
          )}
        </div>

        <p className="mt-6 text-[11px] text-slate-400">
          Documento gerado pelo sistema de entregas da Copamar. As informações de data, hora e
          localização são registradas automaticamente no momento da confirmação da entrega.
        </p>
      </div>

      <BotaoBaixar />
    </div>
  )
}
