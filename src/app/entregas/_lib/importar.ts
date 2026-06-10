"use server"

import * as XLSX from "xlsx"
import { hojeBR } from "./dados"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const BACKEND = process.env.MEDUSA_BACKEND_URL || "http://medusa-backend:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const SECRET = process.env.ENTREGAS_IMPORT_SECRET || ""

type ParadaPlanilha = {
  ordem: number
  numero_pedido: string
  valor_total: number
  forma_pagamento: string
  ja_pago: boolean
}

/** Extrai as entregas da planilha "Dede [dia]" (cabeçalho nas 1ªs linhas; cada
 * entrega tem Nº na 1ª coluna e o pedido na 2ª). Genérico — N linhas. */
function parsePlanilha(buf: Buffer): ParadaPlanilha[] {
  const wb = XLSX.read(buf, { type: "buffer" })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false })
  const out: ParadaPlanilha[] = []
  for (const r of rows) {
    const ordem = Number(r?.[0])
    const pedido = String(r?.[1] ?? "").trim()
    // linha de entrega = 1ª col é nº inteiro E 2ª col é só dígitos (o pedido)
    if (!Number.isInteger(ordem) || ordem <= 0) continue
    if (!/^\d+$/.test(pedido)) continue
    const pgto = String(r?.[7] ?? "").trim() // coluna "Pagamento"
    out.push({
      ordem,
      numero_pedido: pedido,
      valor_total: Number(r?.[2]) || 0, // "Valor NF"
      forma_pagamento: pgto,
      ja_pago: /pac|pago/i.test(pgto), // PAC(site)/Pago(Transferência) = já pago
    })
  }
  return out
}

/**
 * Importa a rota do dia (Marco 10/06): sobe a planilha → parseia → cruza os
 * números com o Bling (nome/endereço/celular) via endpoint do backend → grava a
 * rota no Supabase. Substitui a rota do dia (importar de novo = rota nova).
 */
export async function importarRota(_state: unknown, formData: FormData) {
  if (!SUPA || !KEY) return { erro: "Banco não configurado." }
  const file = formData.get("planilha") as File | null
  if (!file || file.size === 0) return { erro: "Selecione a planilha do dia." }

  let paradas: ParadaPlanilha[]
  try {
    paradas = parsePlanilha(Buffer.from(await file.arrayBuffer()))
  } catch {
    return { erro: "Não consegui ler a planilha — confira se é o arquivo certo (.xlsx)." }
  }
  if (!paradas.length) return { erro: "Nenhuma entrega encontrada na planilha (confira o formato)." }

  // cruza com o Bling (backend tem o token)
  const blingMap: Record<string, any> = {}
  try {
    const r = await fetch(`${BACKEND}/store/entregas/cruzar-bling`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
        "x-entregas-secret": SECRET,
      },
      body: JSON.stringify({ numeros: paradas.map((p) => p.numero_pedido) }),
    })
    if (r.ok) {
      const j = await r.json()
      for (const d of j?.paradas || []) blingMap[d.numero_pedido] = d
    }
  } catch {
    /* segue sem dados do Bling — o cruzamento pode rodar depois */
  }

  const data_rota = hojeBR()
  const regs = paradas.map((p) => ({
    data_rota,
    motorista: "Dedé",
    ordem: p.ordem,
    numero_pedido: p.numero_pedido,
    valor_total: p.valor_total,
    forma_pagamento: p.forma_pagamento,
    ja_pago: p.ja_pago,
    status: "pendente",
    tentativas: 0,
    nome_cliente: blingMap[p.numero_pedido]?.nome_cliente ?? null,
    id_contato_bling: blingMap[p.numero_pedido]?.id_contato_bling ?? null,
    endereco: blingMap[p.numero_pedido]?.endereco ?? null,
    cep: blingMap[p.numero_pedido]?.cep ?? null,
    celular: blingMap[p.numero_pedido]?.celular ?? null,
    maps_query: blingMap[p.numero_pedido]?.maps_query ?? null,
  }))

  const H = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  }
  try {
    // substitui a rota do dia (idempotente — re-importar = rota nova)
    await fetch(`${SUPA}/rest/v1/entregas_frota?data_rota=eq.${data_rota}`, { method: "DELETE", headers: H })
    const ins = await fetch(`${SUPA}/rest/v1/entregas_frota`, {
      method: "POST",
      headers: H,
      body: JSON.stringify(regs),
    })
    if (!ins.ok) return { erro: "Falha ao gravar a rota. Tente de novo." }
  } catch {
    return { erro: "Falha ao gravar a rota. Tente de novo." }
  }

  const cruzadas = regs.filter((r) => r.nome_cliente).length
  return {
    ok: `✅ ${regs.length} entregas importadas para hoje (${cruzadas} com nome/endereço do Bling).`,
  }
}
