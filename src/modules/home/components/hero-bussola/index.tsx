"use client"

import { useReducer, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Palco360 from "./palco-360"
import ReguaGotas from "./regua-gotas"
import {
  Produto,
  REGUA,
  Respostas,
  perguntasAtivas,
  proximaPergunta,
  resolver,
  reguaIndex,
  tipoAmigavel,
} from "./resolver"

/* flag do quiz completo (task A1): on → /quiz; off → produto-âncora real */
const QUIZ_COMPLETO = process.env.NEXT_PUBLIC_QUIZ_COMPLETO === "true"
const RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4,9"
const COUNT = process.env.NEXT_PUBLIC_REVIEW_COUNT || "quase 600"
const WA =
  "https://wa.me/5511952050000?text=" +
  encodeURIComponent("Olá! Vim pelo site da Copamar e queria ajuda pra escolher.")

/* perguntas (copy curada pelo painel de agentes, voz Copamar) */
const PERGUNTAS: Record<
  string,
  { titulo: string; opcoes: { valor: string; rotulo: string }[] }
> = {
  contexto: {
    titulo:
      "Pra começar: a gente está cuidando de uma pessoa, ou abastecendo um lugar que cuida de várias?",
    opcoes: [
      { valor: "pessoa", rotulo: "Pra cuidar de uma pessoa" },
      { valor: "atacado", rotulo: "Pra um lugar que cuida de várias (CNPJ / fardo)" },
    ],
  },
  mobilidade: {
    titulo:
      "No dia a dia, a pessoa anda sozinha ou passa mais tempo deitada? É só pra entender a rotina.",
    opcoes: [
      { valor: "anda", rotulo: "Anda e se vira sozinha" },
      { valor: "ajuda", rotulo: "Anda com ajuda / fica mais sentada" },
      { valor: "deitada", rotulo: "Passa o tempo deitada" },
      { valor: "nao_sei", rotulo: "Varia bastante / ainda não sei dizer" },
    ],
  },
  escape: {
    titulo: "E o que mais te preocupa agora, quando a urina escapa?",
    opcoes: [
      { valor: "gotinhas", rotulo: "Umas gotinhas ao tossir, rir ou caminhar" },
      { valor: "as_vezes", rotulo: "Escapa de vez em quando, quando não dá tempo" },
      { valor: "bastante", rotulo: "Escapa bastante durante o dia" },
      { valor: "noite", rotulo: "À noite molha a cama / acorda molhado" },
      { valor: "nao_sei", rotulo: "Ainda estou entendendo o ritmo" },
    ],
  },
  trocas: {
    titulo: "E mais ou menos quantas vezes por dia vocês precisam trocar?",
    opcoes: [
      { valor: "poucas", rotulo: "Uma ou duas, dá tranquilo" },
      { valor: "varias", rotulo: "Várias — a gente troca bastante" },
      { valor: "nao_sei", rotulo: "Não parei pra contar" },
    ],
  },
  discricao: {
    titulo:
      "O que pesa mais pra vocês: máxima discrição (algo fininho que some por baixo da roupa) ou mais cobertura e praticidade pra vestir?",
    opcoes: [
      { valor: "discreto", rotulo: "Discrição — que ninguém perceba (absorvente na roupa de baixo)" },
      { valor: "pratico", rotulo: "Cobertura e praticidade (veste como cueca/calcinha)" },
    ],
  },
  genero: {
    titulo: "Pra acertar o corte da peça, me diz: a proteção é pra uma mulher ou pra um homem?",
    opcoes: [
      { valor: "mulher", rotulo: "Pra uma mulher" },
      { valor: "homem", rotulo: "Pra um homem" },
      { valor: "nao_sei", rotulo: "Tanto faz / quero ver as duas" },
    ],
  },
  porte: {
    titulo:
      "Por último, mais ou menos o porte do corpo — só pra a peça não apertar nem folgar. Dá pra olhar a etiqueta da roupa.",
    opcoes: [
      { valor: "P", rotulo: "Magrinho(a) / cintura fina (P)" },
      { valor: "M", rotulo: "Médio (M)" },
      { valor: "G", rotulo: "Mais cheinho(a) (G)" },
      { valor: "EG", rotulo: "Bem cheinho(a) (EG)" },
      { valor: "XXG", rotulo: "Acima de EG (XXG)" },
      { valor: "nao_sei", rotulo: "Não sei medir — me ajuda nisso" },
    ],
  },
}

const inicial: Respostas = {
  contexto: null,
  mobilidade: null,
  escape: null,
  trocas: null,
  discricao: null,
  genero: null,
  porte: null,
}

type Acao = { tipo: "responde"; campo: string; valor: string } | { tipo: "reinicia" }
function reducer(s: Respostas, a: Acao): Respostas {
  if (a.tipo === "reinicia") return inicial
  const s2 = { ...s, [a.campo]: a.valor } as Respostas
  // mantém o fluxo consistente: zera respostas que deixaram de ser ativas
  const ativas = new Set(perguntasAtivas(s2))
  for (const campo of ["mobilidade", "escape", "trocas", "discricao", "genero", "porte"]) {
    if (!ativas.has(campo)) (s2 as any)[campo] = null
  }
  return s2
}

/* pétalas de bússola (progresso proporcional) */
function Petalas({ frac }: { frac: number }) {
  return (
    <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden>
      <circle cx="24" cy="24" r="3" fill="#1251b8" />
      {[0, 1, 2].map((i) => {
        const ang = (i * 120 - 90) * (Math.PI / 180)
        const x = 24 + 15 * Math.cos(ang)
        const y = 24 + 15 * Math.sin(ang)
        const on = frac >= (i + 1) / 3
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            initial={false}
            animate={{ fill: on ? "#1251b8" : "#d6e0f5", scale: on ? 1 : 0.82 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        )
      })}
    </svg>
  )
}

function BussolaFundo() {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className="pointer-events-none absolute -right-16 -top-10 h-[420px] w-[420px] text-copamar-primary/[0.05]"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="100" cy="100" r="92" strokeWidth="2" />
      <circle cx="100" cy="100" r="70" strokeWidth="1" />
      <path d="M100 18 L112 100 L100 182 L88 100 Z" fill="currentColor" stroke="none" />
      <path d="M18 100 L100 88 L182 100 L100 112 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* guia de medida — aparece quando a pessoa diz "não sei o tamanho, me ajuda"
   (Marco 08/06: antes só despejava fraldas). Faixas aproximadas de cintura/
   quadril; varia por marca, então a gente sempre confere junto. */
function GuiaTamanho() {
  const faixas = [
    { t: "P", cm: "até ~85 cm" },
    { t: "M", cm: "~80 a 105 cm" },
    { t: "G", cm: "~100 a 130 cm" },
    { t: "EG", cm: "~120 a 150 cm" },
    { t: "XXG", cm: "acima de ~150 cm" },
  ]
  return (
    <div className="rounded-large border border-copamar-primary/20 bg-copamar-primary/[0.04] p-3">
      <p className="text-sm font-medium text-copamar-primary">
        Vamos achar o tamanho juntos 🧭
      </p>
      <p className="mt-1 text-xs text-copamar-text">
        Mede a cintura/quadril com uma fita (ou olha a etiqueta da roupa) e
        compara — varia um pouco por marca, então a gente confere com você:
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs xsmall:grid-cols-3">
        {faixas.map((f) => (
          <div key={f.t} className="flex items-baseline gap-1.5">
            <span className="font-semibold text-copamar-primary">{f.t}</span>
            <span className="text-copamar-primary/55">{f.cm}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-copamar-primary/55">
        Abaixo deixei um ponto de partida no tamanho M — é o mais comum.
      </p>
    </div>
  )
}

/* linha de produto (âncora/alternativa) */
function LinhaProduto({ p, destaque }: { p: Produto; destaque?: boolean }) {
  return (
    <LocalizedClientLink
      href={`/products/${p.handle}`}
      className={`flex items-center gap-3 rounded-large border p-2 transition-colors ${
        destaque
          ? "border-copamar-primary/30 bg-copamar-primary/[0.03]"
          : "border-copamar-primary/10 hover:border-copamar-primary/30"
      }`}
    >
      {/* next/image #101: poster vem cheio do R2/Magento; slot fixo de 48px →
          thumb otimizado + lazy, sem mudar o layout */}
      <Image src={p.poster} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-base bg-white object-contain" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-copamar-primary">
          {p.titulo}
        </span>
        <span className="text-xs text-copamar-primary/55">
          {p.marca} · R$ {p.preco.toFixed(2).replace(".", ",")}
        </span>
      </span>
    </LocalizedClientLink>
  )
}

export default function HeroBussola({ embed = false }: { embed?: boolean }) {
  const reduzir = !!useReducedMotion()
  const [st, dispatch] = useReducer(reducer, inicial)
  const [tiltDir, setTiltDir] = useState(0)

  const ativas = perguntasAtivas(st)
  const respondidas = ativas.filter((id) => (st as any)[id] != null).length
  const proxima = proximaPergunta(st)
  const concluido = proxima === null
  const comecou = st.contexto != null
  const frac = ativas.length ? respondidas / ativas.length : 0

  const res = resolver(st)
  const ehAtacado = st.contexto === "atacado"
  // produto exibido no palco (com 360 quando houver)
  const produtoPalco: Produto | null =
    res.ancora ?? res.dual?.feminino ?? res.alternativas[0] ?? null
  const nivelIdx = comecou ? reguaIndex(res.nivel) : null

  const responder = (campo: string, valor: string) =>
    dispatch({ tipo: "responde", campo, valor })

  // frase viva — sempre fecha com "a gente confere com você"
  const fraseViva = !comecou
    ? "Responda no seu tempo — a cada resposta, a régua de absorção se ajusta. No fim, a gente confere com você."
    : ehAtacado
    ? "Pra um lugar que cuida de várias pessoas, a gente fecha por fardo com nota fiscal. Chama a gente que monta o pedido junto."
    : concluido && res.dual
    ? "Como a peça muda um pouco pra mulher e pra homem, deixei as duas aqui. Me diz pra quem é que a gente fecha certinho — a gente confere com você."
    : concluido && res.ancora
    ? `Pelo que você contou, a gente começaria por ${tipoAmigavel(res.tipoDed)}: ${res.ancora.titulo}. Não tem resposta errada — a gente confere com você.`
    : `Por enquanto a régua aponta pra absorção ${res.nivel} — e a gente confere com você no fim.`

  const hrefPrimario =
    QUIZ_COMPLETO
      ? "/quiz"
      : concluido && res.ancora
      ? `/products/${res.ancora.handle}`
      : "/store"
  const ctaWhats = ehAtacado || res.cta === "whatsapp"
  const rotuloPrimario = concluido && res.ancora ? "Ver o que faz sentido" : "Me ajude a escolher"

  const pergunta = proxima ? PERGUNTAS[proxima] : null

  return (
    <section
      aria-label="Escolha guiada de produtos"
      className="relative overflow-hidden bg-gradient-to-b from-[#eaf1fc] via-[#f4f8ff] to-white"
    >
      {/* barra de topo (só no modo herói; no modo EMBED o cartão acima já tem
          os selos, então não repete) */}
      {!embed && (
        <div className="w-full border-b border-copamar-primary/10 bg-copamar-primary">
          <div className="content-container py-2">
            <p className="hidden text-center text-xs font-medium text-white/90 small:block">
              Nota {RATING} em {COUNT} avaliações &nbsp;·&nbsp; 20 anos cuidando de
              famílias &nbsp;·&nbsp;{" "}
              <span className="font-semibold text-emerald-300">Frete grátis na Grande SP acima de R$50</span>{" "}
              &nbsp;·&nbsp; Embalagem 100% discreta
            </p>
            <p className="text-center text-xs font-medium text-white/90 small:hidden">
              {RATING} ★ · 20 anos · entrega 100% discreta
            </p>
          </div>
        </div>
      )}

      <BussolaFundo />

      <div className="content-container relative grid grid-cols-1 gap-8 py-9 small:grid-cols-[47fr_53fr] small:items-center small:gap-12 small:py-16">
        {/* ── conversa ── */}
        <div className="flex flex-col gap-4">
          {!embed && (
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-copamar-primary/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-copamar-cta" />
              Loja especializada há 20 anos · todas as marcas num lugar só
            </p>
          )}

          <motion.p
            initial={reduzir ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-lg italic text-copamar-primary/75"
          >
            Cuidar de alguém tem dias difíceis. A gente fica do seu lado.
          </motion.p>

          {/* no modo herói é o H1 da página; no modo EMBED vira H2 (o cartão
              acima já tem o H1 — evita 2 H1 e mantém o SEO) */}
          {embed ? (
            <h2 className="font-serif text-[1.7rem] font-semibold leading-[1.1] text-copamar-primary small:text-[2.25rem]">
              Pra quem você está cuidando hoje?
            </h2>
          ) : (
            <h1 className="font-serif text-[2rem] font-semibold leading-[1.1] text-copamar-primary small:text-[2.75rem]">
              Pra quem você está cuidando hoje?
            </h1>
          )}

          <p className="max-w-prose text-sm leading-relaxed text-copamar-text small:text-base">
            Responda no seu tempo. A gente cruza todas as marcas — TENA, Abena,
            Biofral, DryMan e mais — e aponta o que faz sentido. Sem pressão, sem
            cadastro.{" "}
            <span className="font-medium text-copamar-primary/80">
              Não existe resposta errada.
            </span>
          </p>

          {/* progresso */}
          <div className="mt-1 flex items-center gap-2.5">
            <Petalas frac={frac} />
            <div className="flex-1">
              <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-copamar-primary/10">
                <motion.div
                  className="h-full rounded-full bg-copamar-primary"
                  initial={false}
                  animate={{ width: `${Math.round(frac * 100)}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-[11px] text-copamar-primary/55">
                {concluido ? "Pronto — no seu tempo" : "No seu tempo · sem pressa"}
              </span>
            </div>
          </div>

          {/* pergunta atual */}
          {pergunta && (
            <AnimatePresence mode="wait">
              <motion.div
                key={proxima!}
                initial={reduzir ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-copamar-primary/12 bg-white p-4 shadow-[0_4px_20px_rgba(18,81,184,0.06)]"
              >
                <p className="mb-3 font-serif text-base text-copamar-primary">
                  {pergunta.titulo}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pergunta.opcoes.map((op, i) => (
                    <button
                      key={op.valor}
                      type="button"
                      onClick={() => responder(proxima!, op.valor)}
                      onMouseEnter={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                      onMouseLeave={() => setTiltDir(0)}
                      onFocus={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                      onBlur={() => setTiltDir(0)}
                      className="min-h-[56px] rounded-circle border border-copamar-primary/20 bg-white px-4 py-2 text-sm font-medium text-copamar-primary transition-all hover:border-copamar-primary hover:bg-copamar-primary/[0.04] small:min-h-0"
                    >
                      {op.rotulo}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* CTAs */}
          <div className="mt-1 flex flex-col gap-2.5">
            {ctaWhats ? (
              <a
                href={WA}
                target="_blank"
                rel="noopener"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-circle bg-emerald-500 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
                data-testid="hero-cta-primario"
              >
                Fechar pedido no WhatsApp
              </a>
            ) : (
              <LocalizedClientLink
                href={hrefPrimario}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-circle bg-copamar-primary px-6 text-base font-semibold text-white shadow-[0_6px_18px_rgba(18,81,184,0.3)] transition-all hover:bg-copamar-primary-dark"
                data-testid="hero-cta-primario"
              >
                {rotuloPrimario}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </LocalizedClientLink>
            )}
            <div className="flex items-center justify-between gap-2 text-sm">
              <a href={WA} target="_blank" rel="noopener" className="text-copamar-primary/70 underline-offset-2 hover:text-copamar-primary hover:underline">
                Prefiro falar com gente · WhatsApp
              </a>
              {comecou && (
                <button
                  type="button"
                  onClick={() => dispatch({ tipo: "reinicia" })}
                  className="text-copamar-primary/50 underline-offset-2 hover:text-copamar-primary hover:underline"
                >
                  Recomeçar
                </button>
              )}
            </div>
          </div>

          <p className="mt-0.5 text-xs text-copamar-primary/45">
            Distribuidora oficial · nota fiscal em toda compra · embalagem
            discreta · a gente confere com você antes de fechar.
          </p>
        </div>

        {/* ── palco ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-large border border-copamar-primary/10 bg-white/70 p-4 shadow-[0_8px_30px_rgba(18,81,184,0.08)] backdrop-blur-sm small:p-5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 small:gap-5">
              <div className="relative">
                {produtoPalco && (
                  <Palco360
                    basePath={produtoPalco.spin360 || ""}
                    poster={produtoPalco.poster}
                    alt={`${produtoPalco.titulo} — ${produtoPalco.marca}`}
                    tilt={tiltDir}
                  />
                )}
                {/* o Spin360 reusado já traz seu próprio rótulo "arraste" */}
              </div>
              <div className="hidden small:block">
                <ReguaGotas niveis={REGUA as any} ativoIndex={nivelIdx} onSelect={() => {}} orientacao="vertical" />
              </div>
            </div>
            <div className="mt-3 small:hidden">
              <ReguaGotas niveis={REGUA as any} ativoIndex={nivelIdx} onSelect={() => {}} orientacao="horizontal" />
            </div>
          </div>

          <p aria-live="polite" className="min-h-[2.5rem] rounded-large border border-copamar-primary/10 bg-copamar-primary/[0.04] px-4 py-3 text-center text-sm text-copamar-text">
            {fraseViva}
          </p>

          {/* resultado */}
          <AnimatePresence>
            {(concluido || ehAtacado) && (
              <motion.div
                initial={reduzir ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-large border border-copamar-primary/15 bg-white shadow-[0_8px_30px_rgba(18,81,184,0.1)]"
                data-testid="hero-resultado"
              >
                <div className="bg-copamar-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/90">
                  {ehAtacado
                    ? "Atacado · CNPJ"
                    : res.dual
                    ? "Quase lá — pra quem é?"
                    : res.precisaAjudaTamanho
                    ? "Primeiro o tamanho"
                    : "Faz sentido começar por"}
                </div>
                <div className="flex flex-col gap-3 p-4">
                  {res.dual ? (
                    <>
                      <p className="text-sm text-copamar-text">
                        Como a peça muda um pouco, escolha pra quem é:
                      </p>
                      <LinhaProduto p={res.dual.feminino} destaque />
                      <LinhaProduto p={res.dual.masculino} destaque />
                    </>
                  ) : (
                    <>
                      {res.precisaAjudaTamanho && <GuiaTamanho />}
                      {res.ancora && <LinhaProduto p={res.ancora} destaque />}
                      {res.nota && (
                        <p className="text-xs text-copamar-primary/60">{res.nota}</p>
                      )}
                      {res.addon && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-copamar-primary/70">
                            Dica de quem cuida — um forro por dentro reforça e ajuda a trocar menos:
                          </p>
                          <LinhaProduto p={res.addon} />
                        </div>
                      )}
                      {res.alternativas.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-copamar-primary/70">
                            Pra comparar marca e preço com calma:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {res.alternativas.map((p) => (
                              <LinhaProduto key={p.handle} p={p} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <a
                    href={WA}
                    target="_blank"
                    rel="noopener"
                    className="mt-1 inline-flex h-10 items-center justify-center rounded-circle border border-copamar-primary/30 px-4 text-sm font-medium text-copamar-primary transition-colors hover:border-copamar-primary hover:bg-copamar-primary/[0.04]"
                  >
                    Ainda em dúvida? A gente confere com você no WhatsApp
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA sticky mobile (só no modo herói — no modo seção/embed seria uma
          barra fixa estranha no meio da home) */}
      <div className={`sticky bottom-0 z-40 border-t border-copamar-primary/10 bg-white/95 px-4 py-3 backdrop-blur small:hidden ${embed ? "hidden" : ""}`}>
        <div className="flex items-center gap-2">
          {ctaWhats ? (
            <a href={WA} target="_blank" rel="noopener" className="inline-flex h-12 flex-1 items-center justify-center rounded-circle bg-emerald-500 text-base font-semibold text-white">
              Fechar no WhatsApp
            </a>
          ) : (
            <LocalizedClientLink href={hrefPrimario} className="inline-flex h-12 flex-1 items-center justify-center rounded-circle bg-copamar-primary text-base font-semibold text-white shadow-sm">
              {rotuloPrimario}
            </LocalizedClientLink>
          )}
          <a href={WA} target="_blank" rel="noopener" aria-label="Falar no WhatsApp" className="inline-flex h-12 w-12 items-center justify-center rounded-circle bg-emerald-500 text-white">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z" />
            </svg>
          </a>
        </div>
        <LocalizedClientLink href="/store" className="mt-1.5 block text-center text-xs text-copamar-primary/55 underline underline-offset-2">
          Pular e ver os mais vendidos
        </LocalizedClientLink>
      </div>
    </section>
  )
}
