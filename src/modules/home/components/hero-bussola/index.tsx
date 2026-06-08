"use client"

import { useMemo, useReducer, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Palco360 from "./palco-360"
import ReguaGotas from "./regua-gotas"
import {
  Dia,
  Pesa,
  Quem,
  indicePorChave,
  nivelPorChave,
  NIVEIS,
  resolverNivel,
} from "./resolver"

/* ───────── flag do quiz completo (task A1) ─────────
   Quiz completo pode levar 1-2 semanas. O mini-quiz do Hero é AUTOSSUFICIENTE.
   Com a flag LIGADA, "Me ajude a escolher" aponta pro quiz completo; senão,
   no fim, leva direto pro produto-âncora (PDP real). Nunca quebra. */
const QUIZ_COMPLETO = process.env.NEXT_PUBLIC_QUIZ_COMPLETO === "true"

const RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4,9"
const COUNT = process.env.NEXT_PUBLIC_REVIEW_COUNT || "quase 600"
const WA =
  "https://wa.me/5511952050000?text=" +
  encodeURIComponent("Olá! Vim pelo site da Copamar e queria ajuda pra escolher.")

/* ───────── perguntas do mini-quiz ───────── */
type Campo = "quem" | "dia" | "pesa"
type Opcao = { valor: string; rotulo: string }
const PERGUNTAS: { campo: Campo; titulo: string; opcoes: Opcao[] }[] = [
  {
    campo: "quem",
    titulo: "Pra quem você está cuidando hoje?",
    opcoes: [
      { valor: "pai_mae", rotulo: "Meu pai ou minha mãe" },
      { valor: "outra_pessoa", rotulo: "Outra pessoa que eu cuido" },
      { valor: "pra_mim", rotulo: "Pra mim" },
    ],
  },
  {
    campo: "dia",
    titulo: "Como é o dia a dia?",
    opcoes: [
      { valor: "ativa", rotulo: "Sai de casa, ativa" },
      { valor: "casa", rotulo: "Mais em casa" },
      { valor: "acamado", rotulo: "Acamado(a)" },
      { valor: "nao_sei", rotulo: "Ainda não sei dizer" },
    ],
  },
  {
    campo: "pesa",
    titulo: "O que mais pesa?",
    opcoes: [
      { valor: "noite", rotulo: "Vazamento à noite" },
      { valor: "pele", rotulo: "Pele sensível" },
      { valor: "discricao", rotulo: "Discrição" },
      { valor: "trocar_menos", rotulo: "Trocar menos vezes" },
    ],
  },
]

/* ───────── estado do quiz (useReducer) ───────── */
type Estado = {
  passo: number
  quem: Quem | null
  dia: Dia | null
  pesa: Pesa | null
  concluido: boolean
}
type Acao =
  | { tipo: "responde"; campo: Campo; valor: string }
  | { tipo: "reinicia" }
const inicial: Estado = {
  passo: 0,
  quem: null,
  dia: null,
  pesa: null,
  concluido: false,
}

function reducer(s: Estado, a: Acao): Estado {
  if (a.tipo === "reinicia") return inicial
  const prox = { ...s, [a.campo]: a.valor } as Estado
  const respondidas = [prox.quem, prox.dia, prox.pesa].filter(Boolean).length
  prox.concluido = respondidas === 3
  prox.passo = Math.min(2, respondidas)
  return prox
}

/* ───────── progresso: 3 pétalas de bússola ───────── */
function PetalasBussola({ preenchidas }: { preenchidas: number }) {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" aria-hidden>
      <circle cx="24" cy="24" r="3" fill="#1251b8" />
      {[0, 1, 2].map((i) => {
        const ang = (i * 120 - 90) * (Math.PI / 180)
        const x = 24 + 15 * Math.cos(ang)
        const y = 24 + 15 * Math.sin(ang)
        const on = i < preenchidas
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

/* bússola decorativa de fundo (azul Copamar, bem suave) */
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

export default function HeroBussola() {
  const reduzir = !!useReducedMotion()
  const [st, dispatch] = useReducer(reducer, inicial)
  const [tiltDir, setTiltDir] = useState(0)
  const [nivelManual, setNivelManual] = useState<number | null>(null)
  // gênero escolhido NO RESULTADO (só pros níveis "gendered", ex.: absorvente
  // leve — Lady ≠ Men). Marco 07/06: o site não sabe o sexo, então PERGUNTA
  // em vez de chutar (oferecia Lady pra homem).
  const [genero, setGenero] = useState<"f" | "m" | null>(null)

  const respondidas = [st.quem, st.dia, st.pesa].filter(Boolean).length

  const nivelChave = useMemo(
    () => resolverNivel(st.quem, st.dia, st.pesa),
    [st.quem, st.dia, st.pesa]
  )
  const nivel = nivelPorChave(nivelChave)

  const idxQuiz = respondidas > 0 ? indicePorChave(nivelChave) : null
  const nivelIndex = nivelManual != null ? nivelManual : idxQuiz
  const comecou = nivelIndex != null
  const nivelView = NIVEIS[nivelIndex ?? indicePorChave(nivelChave)]

  // resolução de gênero do nível exibido
  const ehGendered = nivelView.genero === "gendered" && !!nivelView.masculino
  const precisaGenero = ehGendered && genero === null
  const usaMasc = ehGendered && genero === "m"
  const produtoView = usaMasc ? nivelView.masculino! : nivelView.produto
  const marcasView =
    usaMasc && nivelView.marcasMasculino
      ? nivelView.marcasMasculino
      : nivelView.marcas

  const responder = (campo: Campo, valor: string) => {
    setNivelManual(null)
    setGenero(null) // novo nível → pergunta o gênero de novo se precisar
    dispatch({ tipo: "responde", campo, valor })
  }

  const selecionarNivel = (i: number) => {
    setNivelManual(i)
    setGenero(null)
  }

  const fraseViva = !comecou
    ? "Responda no seu tempo — a cada resposta, a régua de absorção se ajusta. No fim, a gente confere com você."
    : st.concluido && precisaGenero
    ? `Pelo que você me contou, ${nivel.fraseFragmento}. Pra acertar o modelo, me diz: é pra um homem ou uma mulher? A gente confere com você.`
    : st.concluido
    ? `Pelo que você me contou, eu apontaria proteção ${nivel.rotulo.toLowerCase()}: ${nivel.fraseFragmento}. No fim, a gente confere com você.`
    : `Por enquanto a régua aponta pra absorção ${nivelView.rotulo.toLowerCase()} — e a gente confere com você no fim.`

  // CTA primário: flag → quiz; no fim → PDP do produto-âncora REAL (já com o
  // gênero certo); se ainda falta o gênero, não linka produto — leva à loja.
  // (corrige o link que caía em busca vazia E o Lady ofertado pra homem)
  const hrefPrimario = QUIZ_COMPLETO
    ? "/quiz"
    : st.concluido && !precisaGenero
    ? `/products/${produtoView.handle}`
    : "/store"
  const rotuloPrimario =
    st.concluido && !precisaGenero ? "Ver o que faz sentido" : "Me ajude a escolher"

  const perguntaAtual = PERGUNTAS[st.passo]

  return (
    <section
      aria-label="Escolha guiada de produtos"
      className="relative overflow-hidden bg-gradient-to-b from-[#eaf1fc] via-[#f4f8ff] to-white"
    >
      {/* ───── 1) BARRA DE TOPO ───── */}
      <div className="w-full border-b border-copamar-primary/10 bg-copamar-primary">
        <div className="content-container py-2">
          <p className="hidden text-center text-xs font-medium text-white/90 small:block">
            Nota {RATING} em {COUNT} avaliações &nbsp;·&nbsp; 20 anos cuidando de
            famílias &nbsp;·&nbsp;{" "}
            <span className="font-semibold text-emerald-300">
              Frete grátis acima de R$50
            </span>{" "}
            &nbsp;·&nbsp; Embalagem 100% discreta
          </p>
          <p className="text-center text-xs font-medium text-white/90 small:hidden">
            {RATING} ★ · 20 anos · entrega 100% discreta
          </p>
        </div>
      </div>

      <BussolaFundo />

      {/* ───── 2/3) HERO ───── */}
      <div className="content-container relative grid grid-cols-1 gap-8 py-9 small:grid-cols-[47fr_53fr] small:items-center small:gap-12 small:py-16">
        {/* ── COLUNA ESQUERDA: a conversa ── */}
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-copamar-primary/70">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-copamar-cta" />
            Loja especializada há 20 anos · todas as marcas num lugar só
          </p>

          <motion.p
            initial={reduzir ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-lg italic text-copamar-primary/75"
          >
            Cuidar de alguém tem dias difíceis. A gente fica do seu lado.
          </motion.p>

          {/* H1 — texto REAL (SSR), LCP cai aqui */}
          <h1 className="font-serif text-[2rem] font-semibold leading-[1.1] text-copamar-primary small:text-[2.75rem]">
            Pra quem você está cuidando hoje?
          </h1>

          <p className="max-w-prose text-sm leading-relaxed text-copamar-text small:text-base">
            Responda três perguntas no seu tempo. A gente cruza as marcas — TENA,
            Abena, Biofral, DryMan e mais — e aponta o que faz sentido. Sem
            pressão, sem cadastro.{" "}
            <span className="font-medium text-copamar-primary/80">
              Não existe resposta errada.
            </span>
          </p>

          {/* progresso */}
          <div className="mt-1 flex items-center gap-2.5">
            <PetalasBussola preenchidas={respondidas} />
            <div className="flex-1">
              <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-copamar-primary/10">
                <motion.div
                  className="h-full rounded-full bg-copamar-primary"
                  initial={false}
                  animate={{ width: `${(respondidas / 3) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-[11px] text-copamar-primary/55">
                {respondidas}/3 — no seu tempo
              </span>
            </div>
          </div>

          {/* pergunta atual */}
          {!st.concluido && (
            <AnimatePresence mode="wait">
              <motion.div
                key={perguntaAtual.campo}
                initial={reduzir ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-copamar-primary/12 bg-white p-4 shadow-[0_4px_20px_rgba(18,81,184,0.06)]"
              >
                <p className="mb-3 font-serif text-base text-copamar-primary">
                  {perguntaAtual.titulo}
                </p>
                <div className="flex flex-wrap gap-2">
                  {perguntaAtual.opcoes.map((op, i) => {
                    const ativo = (st as any)[perguntaAtual.campo] === op.valor
                    return (
                      <button
                        key={op.valor}
                        type="button"
                        onClick={() => responder(perguntaAtual.campo, op.valor)}
                        onMouseEnter={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                        onMouseLeave={() => setTiltDir(0)}
                        onFocus={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                        onBlur={() => setTiltDir(0)}
                        aria-pressed={ativo}
                        className={`min-h-[56px] rounded-circle border px-4 py-2 text-sm font-medium transition-all small:min-h-0 ${
                          ativo
                            ? "border-copamar-primary bg-copamar-primary text-white shadow-sm"
                            : "border-copamar-primary/20 bg-white text-copamar-primary hover:border-copamar-primary hover:bg-copamar-primary/[0.04]"
                        }`}
                      >
                        {op.rotulo}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* CTAs */}
          <div className="mt-1 flex flex-col gap-2.5">
            <LocalizedClientLink
              href={hrefPrimario}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-circle bg-copamar-primary px-6 text-base font-semibold text-white shadow-[0_6px_18px_rgba(18,81,184,0.3)] transition-all hover:bg-copamar-primary-dark hover:shadow-[0_8px_22px_rgba(18,81,184,0.4)]"
              data-testid="hero-cta-primario"
            >
              {rotuloPrimario}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </LocalizedClientLink>
            <a
              href={WA}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-1.5 text-center text-sm text-copamar-primary/70 underline-offset-2 hover:text-copamar-primary hover:underline"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z" />
              </svg>
              Prefiro falar com gente · WhatsApp
            </a>
          </div>

          <p className="mt-0.5 text-xs text-copamar-primary/45">
            Distribuidora oficial · nota fiscal em toda compra · embalagem
            discreta · a gente confere com você antes de fechar.
          </p>
        </div>

        {/* ── COLUNA DIREITA: o palco ── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-large border border-copamar-primary/10 bg-white/70 p-4 shadow-[0_8px_30px_rgba(18,81,184,0.08)] backdrop-blur-sm small:p-5">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 small:gap-5">
              <div className="relative">
                <Palco360
                  basePath={produtoView.spin360}
                  poster={produtoView.poster}
                  alt={`${produtoView.titulo} — ${produtoView.marca}`}
                  tilt={tiltDir}
                />
                <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-circle bg-copamar-primary/85 px-3 py-1 text-[11px] font-medium text-white">
                  Arraste para girar · 360°
                </span>
              </div>
              <div className="hidden small:block">
                <ReguaGotas
                  niveis={NIVEIS}
                  ativoIndex={nivelIndex}
                  onSelect={selecionarNivel}
                  orientacao="vertical"
                />
              </div>
            </div>

            {/* régua horizontal no mobile */}
            <div className="mt-3 small:hidden">
              <ReguaGotas
                niveis={NIVEIS}
                ativoIndex={nivelIndex}
                onSelect={selecionarNivel}
                orientacao="horizontal"
              />
            </div>
          </div>

          {/* frase viva (aria-live) */}
          <p
            aria-live="polite"
            className="min-h-[2.5rem] rounded-large border border-copamar-primary/10 bg-copamar-primary/[0.04] px-4 py-3 text-center text-sm text-copamar-text"
          >
            {fraseViva}
          </p>

          {/* card de resultado */}
          <AnimatePresence>
            {st.concluido && (
              <motion.div
                initial={reduzir ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-large border border-copamar-primary/15 bg-white shadow-[0_8px_30px_rgba(18,81,184,0.1)]"
                data-testid="hero-resultado"
              >
                <div className="bg-copamar-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-white/90">
                  {precisaGenero ? "Quase lá — uma última pergunta" : "Faz sentido começar por"}
                </div>
                {precisaGenero ? (
                  /* nível gendered (ex.: absorvente leve): o site não sabe o
                     sexo, então PERGUNTA — nada de oferecer Lady pra homem */
                  <div className="p-4">
                    <p className="text-sm text-copamar-text">
                      Pra acertar o modelo certo, me diz: a proteção é para um
                      homem ou uma mulher?
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGenero("f")}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-circle border border-copamar-primary/30 px-4 text-sm font-medium text-copamar-primary transition-colors hover:border-copamar-primary hover:bg-copamar-primary/[0.04]"
                      >
                        Para uma mulher
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenero("m")}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-circle border border-copamar-primary/30 px-4 text-sm font-medium text-copamar-primary transition-colors hover:border-copamar-primary hover:bg-copamar-primary/[0.04]"
                      >
                        Para um homem
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <p className="font-serif text-lg text-copamar-primary">
                      {produtoView.titulo}{" "}
                      <span className="text-sm font-normal text-copamar-primary/55">
                        · {produtoView.marca}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-copamar-text">
                      Por que esse: {nivel.porque}.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {marcasView.map((m, i) => (
                        <motion.span
                          key={m}
                          initial={reduzir ? false : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: reduzir ? 0 : 0.1 + i * 0.08 }}
                          className="rounded-circle border border-copamar-primary/25 bg-copamar-primary/[0.04] px-2.5 py-0.5 text-xs font-medium text-copamar-primary"
                        >
                          {m}
                        </motion.span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 small:flex-row">
                      <LocalizedClientLink
                        href={`/products/${produtoView.handle}`}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-circle bg-copamar-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-copamar-primary-dark"
                      >
                        Ver opções
                      </LocalizedClientLink>
                      <a
                        href={WA}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-circle border border-copamar-primary/30 px-4 text-sm font-medium text-copamar-primary transition-colors hover:border-copamar-primary hover:bg-copamar-primary/[0.04]"
                      >
                        Ainda em dúvida? Fale com a gente
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ───── CTA STICKY (mobile) ───── */}
      <div className="sticky bottom-0 z-40 border-t border-copamar-primary/10 bg-white/95 px-4 py-3 backdrop-blur small:hidden">
        <div className="flex items-center gap-2">
          <LocalizedClientLink
            href={hrefPrimario}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-circle bg-copamar-primary text-base font-semibold text-white shadow-sm"
          >
            {rotuloPrimario}
          </LocalizedClientLink>
          <a
            href={WA}
            target="_blank"
            rel="noopener"
            aria-label="Falar no WhatsApp"
            className="inline-flex h-12 w-12 items-center justify-center rounded-circle bg-emerald-500 text-white"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.207z" />
            </svg>
          </a>
        </div>
        <LocalizedClientLink
          href="/store"
          className="mt-1.5 block text-center text-xs text-copamar-primary/55 underline underline-offset-2"
        >
          Pular e ver os mais vendidos
        </LocalizedClientLink>
      </div>
    </section>
  )
}
