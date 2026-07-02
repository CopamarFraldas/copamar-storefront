export type EnderecoEstruturado = {
  logradouro: string
  numero: string
  bairro: string
  complemento: string
}

/**
 * Deriva {logradouro, numero, bairro, complemento} de um endereço salvo, lidando
 * com OS DOIS formatos:
 *  - NOVO (checkout/conta atual): metadata estruturado {logradouro,numero,bairro}
 *    + address_2 = complemento.
 *  - MIGRADO (2.614 endereços do site antigo, metadata NULL): address_1 = "rua,
 *    número" (alguns com \n no meio) e address_2 = BAIRRO.
 *
 * Sem isto, ao EDITAR ou SELECIONAR um endereço migrado o sistema duplicava o
 * número ("Rua X, 167" + número "167" → "Rua X, 167, 167") e jogava o bairro no
 * campo Complemento (auditoria 18/06). Aqui parseamos address_1 e tratamos
 * address_2 como bairro quando não há metadata.
 */
/**
 * Separa um número do FIM de uma string de logradouro, tolerando o prefixo
 * "nº/n°/n./N " que o cliente às vezes digita ("Rua Edu Chaves, N 250" → rua
 * "Rua Edu Chaves", número "250"). Devolve null se não houver número no fim.
 */
function separaNumero(s: string): { logradouro: string; numero: string } | null {
  const a = s.replace(/\s+/g, " ").trim()
  const m = a.match(/^(.*?)[,\s]+(?:n[º°.]?\s*)?(\d+[A-Za-z]?)\s*$/i)
  if (!m) return null
  return { logradouro: m[1].replace(/[,\s]+$/, "").trim(), numero: m[2] }
}

export function derivaEndereco(address: any): EnderecoEstruturado {
  const md = address?.metadata
  if (md?.logradouro) {
    let logradouro = String(md.logradouro || "")
    let numero = String(md.numero || "")
    // Defensivo: se o número foi digitado junto da rua (metadata.numero vazio,
    // ex.: "Rua Edu Chaves, N 250"), separa do fim do logradouro. Sem isto o
    // checkout mostrava o número grudado na rua e o campo Número vazio (Marco 19/06).
    if (!numero) {
      const sep = separaNumero(logradouro)
      if (sep) {
        logradouro = sep.logradouro
        numero = sep.numero
      }
    }
    return {
      logradouro,
      numero,
      bairro: String(md.bairro || ""),
      complemento: String(address?.address_2 || ""),
    }
  }
  // migrado: normaliza espaços/\n e separa o NÚMERO do fim do address_1
  const a1 = String(address?.address_1 || "").replace(/\s+/g, " ").trim()
  const sep = separaNumero(a1)
  return {
    logradouro: sep ? sep.logradouro : a1.replace(/[,\s]+$/, "").trim(),
    numero: sep ? sep.numero : "",
    bairro: String(address?.address_2 || "").replace(/\s+/g, " ").trim(),
    complemento: "",
  }
}

/**
 * Conserta NO SALVAMENTO o erro clássico do cliente embaralhar os campos:
 * número da rua digitado junto do nome da rua, e/ou apartamento no campo Número.
 * Ex.: rua "Alameda Barão de Piracicaba, 810" + número "08" →
 *      rua "Alameda Barão de Piracicaba", número "810", complemento "08".
 * Regras (só age quando a RUA termina com um número):
 *  - Número vazio → o número da rua vai pro campo Número.
 *  - Número igual ao da rua → só limpa a duplicata da rua.
 *  - Número diferente (os dois preenchidos) → o número da RUA manda (é o nº do
 *    local); o que estava em "Número" vira complemento (apto). Caso do Wellington.
 * NÃO mexe em rua sem número no fim ("Rua das Flores", "Rua 7 de Setembro").
 */
/** Junta partes de complemento removendo duplicatas (case-insensitive), separadas
 *  por " - ". Ex.: juntaCompl("Apto 81", "Apto 81") → "Apto 81". */
function juntaCompl(...partes: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of partes) {
    for (const p of String(raw || "").split(/\s*-\s*/).map((s) => s.trim()).filter(Boolean)) {
      const k = p.toLowerCase()
      if (!seen.has(k)) { seen.add(k); out.push(p) }
    }
  }
  return out.join(" - ")
}

export function sanitizaEndereco(input: {
  logradouro: string
  numero: string
  complemento: string
}): { logradouro: string; numero: string; complemento: string } {
  let logradouro = String(input.logradouro || "").replace(/\s+/g, " ").trim()
  let numero = String(input.numero || "").trim()
  let complemento = String(input.complemento || "").trim()

  // 1) Número no FIM da rua ("Alameda Barão de Piracicaba, 810").
  const sep = separaNumero(logradouro)
  if (sep) {
    logradouro = sep.logradouro
    if (!numero) {
      numero = sep.numero
    } else if (numero !== sep.numero) {
      complemento = juntaCompl(numero, complemento)
      numero = sep.numero
    }
    return { logradouro, numero, complemento }
  }

  // 2) Número no MEIO seguido de rótulo ("Av. Sarmiento, 180, Apto" + Número "81").
  //    O cliente jogou rua+número+"Apto" no campo Rua e o nº do apto no Número.
  //    → o número do MEIO é o da rua; o rótulo + o que estava em Número (apto) viram
  //    complemento. Caso #27048/#27051/#27040/#27030/#27022 (jun/26).
  const meio = logradouro.match(/^(.*?),\s*(\d+[A-Za-z]?)\s*,\s*(.+)$/)
  if (meio && meio[1].replace(/[,\s]+$/, "").trim()) {
    const numRua = meio[2]
    const rotulo = meio[3].trim()
    logradouro = meio[1].replace(/[,\s]+$/, "").trim()
    // se o campo Número tinha um valor diferente (o apto), ele entra junto do rótulo
    const aptoLabel = numero && numero !== numRua ? `${rotulo} ${numero}`.trim() : rotulo
    complemento = juntaCompl(aptoLabel, complemento)
    numero = numRua
  }
  return { logradouro, numero, complemento }
}
