import catalogoRaw from "./bussola-catalogo.json"

/**
 * Resolver do quiz "Bússola do Cuidador" (v3, 08/06) — projetado por um painel
 * de agentes sobre os 69 produtos recomendáveis e validado contra personas.
 *
 * Em vez de uma árvore de IFs hardcoded (que deixava produtos inalcançáveis e
 * combos vazios — a validação adversarial pegou 14 buracos), usa FILTRO + RANK
 * + RELAXAMENTO genérico sobre o catálogo inteiro: toda combinação de respostas
 * cai num produto REAL, nenhum produto fica órfão, e o gênero nunca cruza.
 */

export type TipoProduto =
  | "fralda_fita"
  | "pants"
  | "absorvente_masculino"
  | "absorvente_feminino"
  | "absorvente_geriatrico"

export type Produto = {
  handle: string
  titulo: string
  marca: string
  tipo: TipoProduto
  genero: "masculino" | "feminino" | "unissex"
  tamanhos: string[]
  nivel: "leve" | "moderado" | "intenso" | "noturno"
  fardo: boolean
  preco: number
  spin360: string | null
  poster: string
}

export const CATALOGO = catalogoRaw as Produto[]

export type Contexto = "pessoa" | "atacado"
export type Mobilidade = "anda" | "ajuda" | "deitada" | "nao_sei"
export type Escape = "gotinhas" | "as_vezes" | "bastante" | "noite" | "nao_sei"
export type Trocas = "poucas" | "varias" | "nao_sei"
export type GeneroResp = "mulher" | "homem" | "nao_sei"
export type Porte = "P" | "M" | "G" | "EG" | "XXG" | "nao_sei"
export type Nivel = "leve" | "moderado" | "intenso" | "noturno"

export type Respostas = {
  contexto: Contexto | null
  mobilidade: Mobilidade | null
  escape: Escape | null
  trocas: Trocas | null
  genero: GeneroResp | null
  porte: Porte | null
}

type TipoDed = "absorvente" | "pants" | "fralda_fita"

const ORDEM: Nivel[] = ["leve", "moderado", "intenso", "noturno"]

/* ───────── deduções (puras, reusadas no fluxo de perguntas) ───────── */
export function deduzNivel(escape: Escape | null, trocas: Trocas | null): Nivel {
  if (escape === "noite") return "noturno"
  if (escape === "gotinhas") return "leve"
  if (escape === "bastante") return "intenso"
  if (escape === "as_vezes") return trocas === "varias" ? "intenso" : "moderado"
  return "moderado"
}
export function deduzTipo(mob: Mobilidade | null, nivel: Nivel): TipoDed {
  if (mob === "deitada") return "fralda_fita"
  if (mob === "anda" && nivel === "leve") return "absorvente"
  return "pants" // anda (>leve), ajuda, nao_sei
}
export function generoRelevante(tipoDed: TipoDed, nivel: Nivel): boolean {
  return tipoDed === "absorvente" || (tipoDed === "pants" && nivel === "moderado")
}
export function tipoTemTamanho(tipoDed: TipoDed): boolean {
  return tipoDed === "pants" || tipoDed === "fralda_fita"
}

/* ───────── fluxo de perguntas (condicional) ───────── */
export function perguntasAtivas(r: Respostas): string[] {
  const ativas = ["contexto"]
  if (r.contexto === "atacado") return ativas
  if (r.contexto === "pessoa") {
    ativas.push("mobilidade", "escape")
    if (r.escape === "as_vezes" || r.escape === "bastante") ativas.push("trocas")
    const prereqOk =
      r.mobilidade != null &&
      r.escape != null &&
      (!(r.escape === "as_vezes" || r.escape === "bastante") || r.trocas != null)
    if (prereqOk) {
      const nivel = deduzNivel(r.escape, r.trocas)
      const tipoDed = deduzTipo(r.mobilidade, nivel)
      if (generoRelevante(tipoDed, nivel)) ativas.push("genero")
      if (tipoTemTamanho(tipoDed)) ativas.push("porte")
    }
  }
  return ativas
}
export function proximaPergunta(r: Respostas): string | null {
  for (const id of perguntasAtivas(r)) if ((r as any)[id] == null) return id
  return null
}

/* ───────── filtro + rank + relaxamento ───────── */
function grupoTipo(
  p: Produto,
  tipoDed: TipoDed,
  generoAlvo: "feminino" | "masculino" | null
): boolean {
  if (tipoDed === "absorvente") {
    if (generoAlvo === "feminino") return p.tipo === "absorvente_feminino"
    if (generoAlvo === "masculino") return p.tipo === "absorvente_masculino"
    return p.tipo === "absorvente_feminino" || p.tipo === "absorvente_masculino"
  }
  if (tipoDed === "pants") {
    if (generoAlvo === "feminino") return p.tipo === "pants" && p.genero !== "masculino"
    if (generoAlvo === "masculino") return p.tipo === "pants" && p.genero !== "feminino"
    return p.tipo === "pants"
  }
  return p.tipo === "fralda_fita"
}

// Tena com 360 primeiro (vitrine), depois mais barato
function ranqueia(arr: Produto[]): Produto[] {
  return [...arr].sort((a, b) => {
    const sa = a.marca === "Tena" && a.spin360 ? 0 : 1
    const sb = b.marca === "Tena" && b.spin360 ? 0 : 1
    if (sa !== sb) return sa - sb
    return a.preco - b.preco
  })
}
function niveisProximos(n: Nivel): Nivel[] {
  const i = ORDEM.indexOf(n)
  return [...ORDEM].sort(
    (a, b) => Math.abs(ORDEM.indexOf(a) - i) - Math.abs(ORDEM.indexOf(b) - i)
  )
}

function buscaLista(
  tipoDed: TipoDed,
  nivel: Nivel,
  generoAlvo: "feminino" | "masculino" | null,
  porte: Porte | null
): { lista: Produto[]; nota: string | null } {
  const base = CATALOGO.filter((p) => grupoTipo(p, tipoDed, generoAlvo))
  let nota: string | null = null
  for (const nv of niveisProximos(nivel)) {
    let cand = base.filter((p) => p.nivel === nv)
    if (!cand.length) continue
    if (nv !== nivel)
      nota = `Nessa combinação a gente trabalha com proteção ${nv} — segura bem, e a gente confere com você.`
    if (tipoTemTamanho(tipoDed) && porte && porte !== "nao_sei") {
      const comTam = cand.filter((p) => p.tamanhos.includes(porte))
      if (comTam.length) cand = comTam
      else
        nota =
          "Nesse porte a gente confere com você o tamanho certo antes de fechar."
    }
    return { lista: ranqueia(cand), nota }
  }
  // fallback final: garante SEMPRE ≥1 produto real
  return { lista: ranqueia(base.length ? base : CATALOGO), nota }
}

function achaForro(): Produto | null {
  const g = CATALOGO.filter(
    (p) => p.tipo === "absorvente_geriatrico" && !p.fardo
  )
  const todos = g.length
    ? g
    : CATALOGO.filter((p) => p.tipo === "absorvente_geriatrico")
  return ranqueia(todos)[0] || null
}

export type Resultado = {
  tipoDed: TipoDed
  nivel: Nivel
  ancora: Produto | null
  alternativas: Produto[]
  addon: Produto | null
  /** absorvente leve com gênero desconhecido → mostra os dois lado a lado */
  dual: { feminino: Produto; masculino: Produto } | null
  nota: string | null
  cta: "comprar" | "whatsapp"
}

export function resolver(r: Respostas): Resultado {
  // ── atacado / CNPJ: fecha por fardo no WhatsApp ──
  if (r.contexto === "atacado") {
    const lista = ranqueia(CATALOGO.filter((p) => p.fardo))
    return {
      tipoDed: "pants",
      nivel: "moderado",
      ancora: lista[0] || null,
      alternativas: lista.slice(1, 4),
      addon: null,
      dual: null,
      nota: "Pra um lugar que cuida de várias pessoas, a gente fecha por fardo com nota fiscal — chama a gente que monta o pedido junto.",
      cta: "whatsapp",
    }
  }

  const nivel = deduzNivel(r.escape, r.trocas)
  const tipoDed = deduzTipo(r.mobilidade, nivel)
  const genRel = generoRelevante(tipoDed, nivel)
  const generoConhecido = r.genero === "mulher" || r.genero === "homem"

  // absorvente leve sem saber o gênero → os dois lado a lado (nada de chutar)
  if (tipoDed === "absorvente" && genRel && !generoConhecido) {
    const fem = buscaLista("absorvente", nivel, "feminino", null).lista[0]
    const masc = buscaLista("absorvente", nivel, "masculino", null).lista[0]
    if (fem && masc) {
      return {
        tipoDed,
        nivel,
        ancora: null,
        alternativas: [],
        addon: null,
        dual: { feminino: fem, masculino: masc },
        nota: null,
        cta: "comprar",
      }
    }
  }

  const generoAlvo =
    genRel && r.genero === "mulher"
      ? "feminino"
      : genRel && r.genero === "homem"
      ? "masculino"
      : null

  const { lista, nota } = buscaLista(tipoDed, nivel, generoAlvo, r.porte)
  const ancora = lista[0] || null

  // alternativas diversificando a marca (até 3)
  const alts: Produto[] = []
  const marcas = new Set(ancora ? [ancora.marca] : [])
  for (const p of lista.slice(1)) {
    if (alts.length >= 3) break
    if (marcas.has(p.marca)) continue
    marcas.add(p.marca)
    alts.push(p)
  }
  for (const p of lista.slice(1)) {
    if (alts.length >= 3) break
    if (p !== ancora && !alts.includes(p)) alts.push(p)
  }
  // bônus: se o gênero é conhecido, surge 1 absorvente da MESMA linha com mais
  // proteção (Lady Extra/Dia-e-Noite/Max Night, Abena Man, Tena Men Lv3) —
  // garante que esses modelos de nicho apareçam pra quem pode usá-los
  if (generoAlvo) {
    const tipoAbs =
      generoAlvo === "feminino" ? "absorvente_feminino" : "absorvente_masculino"
    const extra = ranqueia(
      CATALOGO.filter(
        (p) =>
          p.tipo === tipoAbs &&
          p !== ancora &&
          !alts.includes(p) &&
          p.nivel !== "leve"
      )
    )[0]
    if (extra && alts.length < 4) alts.push(extra)
  }

  const addon =
    (nivel === "intenso" || nivel === "noturno") &&
    (tipoDed === "pants" || tipoDed === "fralda_fita")
      ? achaForro()
      : null

  return { tipoDed, nivel, ancora, alternativas: alts, addon, dual: null, nota, cta: "comprar" }
}

/* ───────── régua visual (5 gotas) ───────── */
export const REGUA = [
  { chave: "leve", rotulo: "Leve", aria: "Absorção leve, para perdas pequenas" },
  { chave: "moderado", rotulo: "Moderado", aria: "Absorção moderada" },
  { chave: "forte", rotulo: "Forte", aria: "Absorção forte" },
  { chave: "intenso", rotulo: "Intenso", aria: "Absorção intensa" },
  { chave: "noturno", rotulo: "Noturno", aria: "Absorção noturna, para a noite" },
]
export function reguaIndex(n: Nivel): number {
  return n === "leve" ? 0 : n === "moderado" ? 1 : n === "intenso" ? 3 : 4
}

export function tipoAmigavel(t: TipoDed): string {
  return t === "absorvente"
    ? "um absorvente que vai dentro da roupa de baixo"
    : t === "pants"
    ? "uma roupa íntima que veste como cueca ou calcinha"
    : "uma fralda que prende nas laterais, pra trocar com tranquilidade"
}
