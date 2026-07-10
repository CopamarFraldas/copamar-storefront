"use server"

import { getRota, hojeBR, mensagemCliente, fotoComprovante } from "./dados"

const SUPA = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY

// Disparo de WhatsApp (Evolution, mesma infra da MAPA). Dois modos:
//  - SHADOW (true): manda TUDO pro número do Marco, com aviso de pra quem iria.
//  - LIVE   (true): manda pro cliente de verdade.
// Ambos false = não envia. Os clientes da rota são REAIS — shadow primeiro.
const WPP_URL = process.env.WHATSAPP_URL
const WPP_KEY = process.env.WHATSAPP_KEY
const SHADOW = process.env.ENTREGAS_WHATSAPP_SHADOW === "true"
const LIVE = process.env.ENTREGAS_WHATSAPP_LIVE === "true"
const SHADOW_NUM = process.env.ENTREGAS_SHADOW_NUMERO || ""

/**
 * Histórico pra MAPA (caso Sinobu 12/06): o aviso proativo entra em
 * logs_atendimento com mensagem vazia → o crew mostra só como "Bot:" e a MAPA
 * SABE que avisamos o cliente (não se re-apresenta nem contradiz o aviso).
 * Só em LIVE (shadow é ensaio). Best-effort — nunca trava o envio.
 */
async function logAvisoProativo(number: string, texto: string) {
  if (!SUPA || !KEY) return
  // logs usam 11 dígitos (DDD+número, sem o 55 do país)
  let cel = number.replace(/\D/g, "")
  if (cel.startsWith("55") && cel.length >= 12) cel = cel.slice(2)
  try {
    await fetch(`${SUPA}/rest/v1/logs_atendimento`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ celular: cel, mensagem: "", resposta: texto, tipo: "sistema", segmento: "aviso_entrega", escalado: false, erro_ia: false }),
    })
  } catch { /* histórico é best-effort */ }
}

/**
 * Deposita na fila_whatsapp (carteiro-wa.py envia espaçado 45-75s, só com o
 * gateway aberto). Nasceu do INCIDENTE 08/07: o aviso "sai hoje" mandou 21
 * mensagens em 26s (pausa de 700ms) e a Meta derrubou o número por 24h.
 * Rajada NUNCA mais: lote grande = fila. dedup evita duplicata em re-tap.
 */
async function enfileirarWhatsApp(
  celularCliente: string | null | undefined,
  texto: string,
  origem: string,
  dedup: string
): Promise<boolean> {
  if (!SUPA || !KEY || !texto) return false
  const raw = (celularCliente || "").trim()
  const cel = raw.replace(/\D/g, "")
  if (!LIVE || !cel) return false // shadow segue no envio direto (1 msg só)
  // preserva o "+" internacional (seletor de país no checkout); BR segue igual
  const numero = raw.startsWith("+")
    ? `+${cel}`
    : cel.startsWith("55")
    ? cel
    : `55${cel}`
  try {
    const res = await fetch(`${SUPA}/rest/v1/fila_whatsapp`, {
      method: "POST",
      headers: {
        apikey: KEY!,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=ignore-duplicates",
      },
      body: JSON.stringify({ numero, texto, origem, prioridade: 2, dedup }),
    })
    if (!res.ok) return false
    await logAvisoProativo(numero, `${texto} [enfileirado]`)
    return true
  } catch {
    return false
  }
}

async function enviarWhatsApp(
  celularCliente: string | null | undefined,
  texto: string,
  pedido?: string
): Promise<boolean> {
  // retorna TRUE só se o gateway aceitou (status ok). Quem chama em lote usa isso
  // pra travar/logar APENAS no sucesso (rota 15/06: o #6 ganhou trava+log sem o
  // cliente receber, porque o envio era best-effort e não checava o status).
  if (!WPP_URL || !WPP_KEY || !texto) return false
  const cel = (celularCliente || "").replace(/\D/g, "")
  let number = ""
  let text = texto
  if (LIVE && cel) {
    number = cel.startsWith("55") ? cel : `55${cel}`
  } else if (SHADOW && SHADOW_NUM) {
    number = SHADOW_NUM
    const ref = pedido ? `pedido #${pedido} · ` : ""
    text = `🔬 *SHADOW* — ${ref}iria pro cliente ${celularCliente || "(sem celular)"}\n\n${texto}`
  } else {
    return false // nenhum modo ligado
  }
  try {
    // TIMEOUT: um gateway pendurado não pode travar o lote inteiro (foi o que
    // deixou 7 sem aviso na rota 15/06 — o envio do meio engasgou e parou a fila)
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 12000)
    const res = await fetch(WPP_URL, {
      method: "POST",
      headers: { apikey: WPP_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text }),
      signal: ctrl.signal,
    })
    clearTimeout(to)
    if (!res.ok) return false
    if (LIVE && cel) await logAvisoProativo(number, texto)
    return true
  } catch {
    /* não derruba a ação se o WhatsApp falhar */
    return false
  }
}

/**
 * Envia FOTO + legenda no WhatsApp (Evolution sendMedia) — usado na tentativa
 * de entrega: o cliente recebe a foto da frente da casa como prova da visita
 * (Marco 11/06). Mesmos modos shadow/live do texto.
 */
async function enviarWhatsAppFoto(
  celularCliente: string | null | undefined,
  fotoUrl: string,
  legenda: string,
  pedido?: string
) {
  if (!WPP_URL || !WPP_KEY || !fotoUrl) return
  const cel = (celularCliente || "").replace(/\D/g, "")
  let number = ""
  let caption = legenda
  if (LIVE && cel) {
    number = cel.startsWith("55") ? cel : `55${cel}`
  } else if (SHADOW && SHADOW_NUM) {
    number = SHADOW_NUM
    const ref = pedido ? `pedido #${pedido} · ` : ""
    caption = `🔬 *SHADOW* — ${ref}iria pro cliente ${celularCliente || "(sem celular)"}\n\n${legenda}`
  } else {
    return
  }
  try {
    await fetch(WPP_URL.replace("/sendText/", "/sendMedia/"), {
      method: "POST",
      headers: { apikey: WPP_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        number,
        mediatype: "image",
        mimetype: "image/jpeg",
        fileName: `visita-copamar-${pedido || "entrega"}.jpg`,
        media: fotoUrl,
        caption,
      }),
    })
    if (LIVE && cel) await logAvisoProativo(number, `${legenda} [foto da visita]`)
  } catch {
    /* best-effort */
  }
}

/**
 * Mesma pessoa com VÁRIOS pedidos na rota (caso Inovha 12/06: 3 pedidos no
 * mesmo endereço = 3 WhatsApps iguais): se OUTRO pedido do mesmo celular já
 * foi marcado com este mesmo status há pouco (30 min), não repete a mensagem
 * — o Dedé marca os 3, o cliente recebe 1.
 */
async function avisoRepetido(
  numero_pedido: string,
  celular: string | null | undefined,
  status: string
): Promise<boolean> {
  const cel = (celular || "").replace(/\D/g, "")
  if (!SUPA || !KEY || cel.length < 8) return false
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&status=eq.${encodeURIComponent(status)}&select=numero_pedido,celular,atualizado_em`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: "no-store" }
    )
    if (!r.ok) return false
    const rows = (await r.json()) as any[]
    const corte = Date.now() - 30 * 60 * 1000
    return rows.some(
      (x) =>
        x.numero_pedido !== numero_pedido &&
        (x.celular || "").replace(/\D/g, "").slice(-8) === cel.slice(-8) &&
        x.atualizado_em &&
        new Date(x.atualizado_em).getTime() >= corte
    )
  } catch {
    return false
  }
}

/**
 * COMPROVANTE de entrega (Fase 2, Marco 10/06): sobe a foto pro Supabase Storage,
 * grava recebedor (nome/CPF) + GPS + hora, marca ENTREGUE e avisa o cliente. É o
 * "seguro" contra chargeback. Recebe FormData (tem a foto). Tudo é best-effort:
 * o que o Dedé conseguir capturar entra; o que faltar, fica null.
 */
export async function registrarEntrega(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  if (!SUPA || !KEY) return { ok: false, erro: "Banco não configurado." }
  const numero_pedido = String(formData.get("numero_pedido") || "")
  if (!numero_pedido) return { ok: false, erro: "Pedido não informado." }
  const nome = String(formData.get("recebedor_nome") || "").trim()
  const cpf = String(formData.get("recebedor_cpf") || "").replace(/\D/g, "")
  const gps_lat = formData.get("gps_lat") ? Number(formData.get("gps_lat")) : null
  const gps_long = formData.get("gps_long") ? Number(formData.get("gps_long")) : null
  const celular = String(formData.get("celular") || "")
  const nome_cliente = String(formData.get("nome_cliente") || "")
  const foto = formData.get("foto") as File | null

  // sobe a foto pro Storage (bucket comprovantes)
  let foto_url: string | null = null
  if (foto && foto.size > 0) {
    try {
      const ext = foto.type.includes("png") ? "png" : foto.type.includes("webp") ? "webp" : "jpg"
      const path = `${hojeBR()}/${numero_pedido}-${Date.now()}.${ext}`
      const up = await fetch(`${SUPA}/storage/v1/object/comprovantes/${path}`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": foto.type || "image/jpeg" },
        body: new Uint8Array(await foto.arrayBuffer()),
      })
      // grava o PATH (não a URL pública): a exibição gera signed URL via
      // fotoComprovante() — pronto pro bucket privado no go-live (LGPD)
      if (up.ok) foto_url = path
    } catch {
      /* segue sem foto */
    }
  }

  const agora = new Date().toISOString()
  const patch: Record<string, any> = {
    status: "entregue",
    entregue_em: agora,
    comprovante_em: agora,
    atualizado_em: agora,
    ultima_tentativa_em: agora,
    recebedor_nome: nome || null,
    recebedor_cpf: cpf || null,
    gps_lat,
    gps_long,
    foto_url,
  }
  try {
    // return=representation: 204 do PostgREST NÃO garante que casou linha — só
    // consideramos gravado se voltou ≥1 linha (auditoria 11/06). Bônus: a linha
    // devolvida traz celular/nome que o cruzamento Bling pode ter preenchido
    // DEPOIS da tela do Dedé carregar.
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&numero_pedido=eq.${encodeURIComponent(numero_pedido)}`,
      {
        method: "PATCH",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
      }
    )
    const linhas = r.ok ? await r.json() : []
    const gravou = r.ok && Array.isArray(linhas) && linhas.length > 0
    if (gravou) {
      const cel = celular || linhas[0]?.celular
      const nome = nome_cliente || linhas[0]?.nome_cliente
      if (!(await avisoRepetido(numero_pedido, cel, "entregue"))) {
        await enviarWhatsApp(cel, mensagemCliente("entregue", nome), numero_pedido)
      }
    }
    return { ok: gravou, erro: gravou ? undefined : "Falha ao gravar (pedido não está na rota de hoje?). Tente de novo." }
  } catch {
    return { ok: false, erro: "Falha ao gravar. Tente de novo." }
  }
}

/**
 * TENTATIVA de entrega — "ninguém em casa" com PROVA (Marco 11/06): foto da
 * frente da casa + GPS + hora. A foto vai PRO CLIENTE no WhatsApp (prova de que
 * passamos lá) e fica no banco por 7 DIAS (cron limpa depois — o cliente já tem
 * a dele). Tudo best-effort: sem foto/GPS, registra mesmo assim.
 */
export async function registrarTentativa(
  formData: FormData
): Promise<{ ok: boolean; erro?: string }> {
  if (!SUPA || !KEY) return { ok: false, erro: "Banco não configurado." }
  const numero_pedido = String(formData.get("numero_pedido") || "")
  if (!numero_pedido) return { ok: false, erro: "Pedido não informado." }
  const gps_lat = formData.get("gps_lat") ? Number(formData.get("gps_lat")) : null
  const gps_long = formData.get("gps_long") ? Number(formData.get("gps_long")) : null
  const celular = String(formData.get("celular") || "")
  const nome_cliente = String(formData.get("nome_cliente") || "")
  const foto = formData.get("foto") as File | null

  // sobe a foto (prefixo "tentativa-": o cron de limpeza apaga estas após 7
  // dias; as fotos de ENTREGA, sem o prefixo, ficam — são o anti-chargeback)
  let foto_path: string | null = null
  if (foto && foto.size > 0) {
    try {
      const ext = foto.type.includes("png") ? "png" : foto.type.includes("webp") ? "webp" : "jpg"
      const path = `${hojeBR()}/tentativa-${numero_pedido}-${Date.now()}.${ext}`
      const up = await fetch(`${SUPA}/storage/v1/object/comprovantes/${path}`, {
        method: "POST",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": foto.type || "image/jpeg" },
        body: new Uint8Array(await foto.arrayBuffer()),
      })
      if (up.ok) foto_path = path
    } catch {
      /* segue sem foto */
    }
  }

  const agora = new Date().toISOString()
  const patch: Record<string, any> = {
    status: "ausente",
    atualizado_em: agora,
    ultima_tentativa_em: agora,
    gps_lat,
    gps_long,
    foto_tentativa_url: foto_path,
  }
  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&numero_pedido=eq.${encodeURIComponent(numero_pedido)}`,
      {
        method: "PATCH",
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(patch),
      }
    )
    const linhas = r.ok ? await r.json() : []
    const gravou = r.ok && Array.isArray(linhas) && linhas.length > 0
    if (gravou) {
      const cel = celular || linhas[0]?.celular
      const nome = nome_cliente || linhas[0]?.nome_cliente
      if (!(await avisoRepetido(numero_pedido, cel, "ausente"))) {
        const legenda = mensagemCliente("ausente", nome)
        const signed = foto_path ? await fotoComprovante(foto_path) : null
        if (signed) {
          await enviarWhatsAppFoto(cel, signed, `${legenda}\n\n📷 Foto da nossa visita 👆`, numero_pedido)
        } else {
          await enviarWhatsApp(cel, legenda, numero_pedido)
        }
      }
    }
    return { ok: gravou, erro: gravou ? undefined : "Falha ao gravar (pedido não está na rota de hoje?). Tente de novo." }
  } catch {
    return { ok: false, erro: "Falha ao gravar. Tente de novo." }
  }
}

/**
 * Grava o status da entrega no Supabase (entregas_frota de hoje) — é o que faz a
 * MAPA saber o progresso real — e dispara o WhatsApp ao cliente (shadow/live).
 * Chamado pelo "Confirmar".
 */
export async function registrarStatus(input: {
  numero_pedido: string
  status: "entregue" | "ausente" | "adiado"
  nome_cliente?: string | null
  celular?: string | null
  gps_lat?: number | null
  gps_long?: number | null
}): Promise<{ ok: boolean }> {
  if (!SUPA || !KEY) return { ok: false }
  const agora = new Date().toISOString()
  const patch: Record<string, any> = {
    status: input.status,
    atualizado_em: agora,
    ultima_tentativa_em: agora,
  }
  if (input.status === "entregue") patch.entregue_em = agora
  // GPS da marcação (Marco 11/06): prova de que o Dedé FOI até o endereço —
  // vale principalmente pro "ninguém em casa" (tentativa), mas grava em todas
  if (typeof input.gps_lat === "number" && typeof input.gps_long === "number") {
    patch.gps_lat = input.gps_lat
    patch.gps_long = input.gps_long
  }

  try {
    const r = await fetch(
      `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&numero_pedido=eq.${encodeURIComponent(
        input.numero_pedido
      )}`,
      {
        method: "PATCH",
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(patch),
      }
    )
    const linhas = r.ok ? await r.json() : []
    const gravou = r.ok && Array.isArray(linhas) && linhas.length > 0
    // avisa o cliente SÓ se gravou de verdade (≥1 linha casada) — shadow → Marco
    if (gravou) {
      const cel = input.celular || linhas[0]?.celular
      if (!(await avisoRepetido(input.numero_pedido, cel, input.status))) {
        await enviarWhatsApp(
          cel,
          mensagemCliente(input.status, input.nome_cliente || linhas[0]?.nome_cliente),
          input.numero_pedido
        )
      }
    }
    return { ok: gravou }
  } catch {
    return { ok: false }
  }
}

/**
 * Avisa a rota de hoje que "sai pra entrega hoje" (ideia 1). Em SHADOW manda só
 * 1 exemplo pro Marco + o total que iria, pra não lotar o WhatsApp dele. Em LIVE
 * manda pra cada cliente pendente com celular — UMA VEZ por dia: a coluna
 * aviso_sai_hoje_em trava re-disparo (apertar 2x não duplica; go-live 11/06).
 */
/** caso Sérgio 10/07: DDD+8 díg começando em 6-9 = celular sem o 9º dígito
 * (pré-2016). O WhatsApp completa o 9 e a mensagem cai em OUTRA pessoa.
 * Fixo (2-5) passa. Aceita com/sem 55 na frente. */
function celularSuspeitoSem9(cel: string | null | undefined): boolean {
  let d = (cel || "").replace(/\D/g, "")
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2)
  return d.length === 10 && "6789".includes(d[2])
}

export async function avisarRotaSaiHoje(): Promise<{ enviados: number; total: number; ja_avisada?: boolean; falhas?: number }> {
  const rota = await getRota()
  const alvos = rota.filter(
    (p) =>
      p.status === "pendente" &&
      p.celular &&
      !p.aviso_sai_hoje_em &&
      // nº suspeito fica FORA (não é falha retentável — é nº provavelmente errado)
      !celularSuspeitoSem9(p.celular)
  )
  if (!alvos.length) {
    return { enviados: 0, total: 0, ja_avisada: rota.some((p) => p.aviso_sai_hoje_em) }
  }
  if (LIVE) {
    // AGRUPA por celular (caso Inovha 12/06: 3 pedidos no mesmo endereço = 3
    // mensagens idênticas) — 1 mensagem por PESSOA, no plural se tem N pedidos
    const grupos = new Map<string, typeof alvos>()
    for (const p of alvos) {
      // chave por DDD+número (últimos 11 díg) — NÃO por 8 finais: dois clientes
      // com os mesmos 8 dígitos finais (DDDs diferentes) colidiam e um só é
      // avisado. 11 díg = DDD(2)+celular(9), robusto ao prefixo 55.
      const k = (p.celular || "").replace(/\D/g, "").slice(-11)
      const g = grupos.get(k)
      if (g) g.push(p)
      else grupos.set(k, [p])
    }
    // UMA passada: tenta cada grupo 1x. O RETRY-ATÉ-ENVIAR é por ROUNDS no
    // cliente (Marco 16/06) — ele re-chama esta action, que só pega os SEM trava
    // (aviso_sai_hoje_em). Cada chamada fica curta e os que falharam voltam em
    // `falhas` pro cliente retentar até zerar (ou bater o teto).
    let enviados = 0
    let falhas = 0
    for (const grupo of Array.from(grupos.values())) {
      const p = grupo[0]
      const msg = mensagemCliente("sai_hoje", p.nome_cliente, grupo.length)
      // INCIDENTE 08/07: 21 envios diretos em 26s → restrição Meta 24h. Agora
      // DEPOSITA na fila e o carteiro entrega espaçado (~20min pra rota cheia).
      const ok = await enfileirarWhatsApp(
        p.celular,
        msg,
        "rota-dia",
        `rota-${hojeBR()}-${(p.celular || "").replace(/\D/g, "").slice(-11)}`
      )
      if (!ok) {
        falhas++
        continue // sem trava → entra na próxima rodada do cliente
      }
      // marca o aviso (trava) — TODOS os pedidos do grupo — SÓ no sucesso confirmado
      try {
        const nums = grupo.map((x: { numero_pedido: string }) => `"${x.numero_pedido}"`).join(",")
        await fetch(
          `${SUPA}/rest/v1/entregas_frota?data_rota=eq.${hojeBR()}&numero_pedido=in.(${encodeURIComponent(nums)})`,
          {
            method: "PATCH",
            headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ aviso_sai_hoje_em: new Date().toISOString() }),
          }
        )
      } catch { /* trava é best-effort */ }
      enviados++
      await new Promise((r) => setTimeout(r, 700)) // pausa entre envios (anti-spam)
    }
    return { enviados, total: grupos.size, falhas }
  }
  // shadow: 1 exemplo + nota do volume (sem gravar a trava — é ensaio)
  const ex = alvos[0]
  if (ex) {
    await enviarWhatsApp(
      ex.celular,
      `${mensagemCliente("sai_hoje", ex.nome_cliente)}\n\n_(em produção, esta mensagem iria pra ${alvos.length} clientes da rota de hoje)_`
    )
  }
  return { enviados: ex ? 1 : 0, total: alvos.length }
}
