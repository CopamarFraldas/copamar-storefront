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
   Com a flag LIGADA, "Me ajude a escolher" aponta pro quiz completo; senão cai
   pra busca/loja por nível. Nunca quebra. Documentada no .env. */
const QUIZ_COMPLETO = process.env.NEXT_PUBLIC_QUIZ_COMPLETO === "true"

const RATING = process.env.NEXT_PUBLIC_REVIEW_RATING || "4,9"
const COUNT = process.env.NEXT_PUBLIC_REVIEW_COUNT || "quase 600"
const WA = "https://wa.me/5511952050000?text=" +
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
  passo: number // pergunta atual (0..2)
  quem: Quem | null
  dia: Dia | null
  pesa: Pesa | null
  concluido: boolean
}
type Acao = { tipo: "responde"; campo: Campo; valor: string } | { tipo: "reinicia" }
const inicial: Estado = { passo: 0, quem: null, dia: null, pesa: null, concluido: false }

function reducer(s: Estado, a: Acao): Estado {
  if (a.tipo === "reinicia") return inicial
  const prox = { ...s, [a.campo]: a.valor } as Estado
  const respondidas = [prox.quem, prox.dia, prox.pesa].filter(Boolean).length
  prox.concluido = respondidas === 3
  prox.passo = Math.min(2, respondidas) // revela a próxima pergunta
  return prox
}

/* ───────── progresso: 3 pétalas de bússola ───────── */
function PetalasBussola({ preenchidas }: { preenchidas: number }) {
  return (
    <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden>
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
            animate={{ fill: on ? "#ef7e1a" : "#e9dfcc", scale: on ? 1 : 0.8 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        )
      })}
    </svg>
  )
}

export default function HeroBussola() {
  const reduzir = !!useReducedMotion()
  const [st, dispatch] = useReducer(reducer, inicial)
  const [tiltDir, setTiltDir] = useState(0)
  // nível escolhido À MÃO na régua (setas/clique) — explora o palco sem
  // depender do quiz; some quando uma resposta nova chega
  const [nivelManual, setNivelManual] = useState<number | null>(null)

  const respondidas = [st.quem, st.dia, st.pesa].filter(Boolean).length

  // nível do QUIZ (resultado) — sempre retorna algo ("não existe resposta errada")
  const nivelChave = useMemo(
    () => resolverNivel(st.quem, st.dia, st.pesa),
    [st.quem, st.dia, st.pesa]
  )
  const nivel = nivelPorChave(nivelChave) // usado no card de resultado

  // índice EXIBIDO no palco/régua: o manual vence; senão o do quiz (após a 1ª
  // resposta); antes disso, nada aceso
  const idxQuiz = respondidas > 0 ? indicePorChave(nivelChave) : null
  const nivelIndex = nivelManual != null ? nivelManual : idxQuiz
  const interagiu = nivelIndex != null
  const comecou = interagiu
  const nivelView = NIVEIS[nivelIndex ?? indicePorChave(nivelChave)]

  // responde uma pergunta e devolve o controle do palco pro quiz
  const responder = (campo: Campo, valor: string) => {
    setNivelManual(null)
    dispatch({ tipo: "responde", campo, valor })
  }

  // frase viva — sempre fecha com "a gente confere com você"
  const fraseViva = !comecou
    ? "Responda no seu tempo — a cada resposta, a régua de absorção se ajusta. No fim, a gente confere com você."
    : st.concluido
    ? `Pelo que você me contou, eu apontaria proteção ${nivel.rotulo.toLowerCase()}: ${nivel.fraseFragmento}. No fim, a gente confere com você.`
    : `Por enquanto a régua aponta pra absorção ${nivelView.rotulo.toLowerCase()} — e a gente confere com você no fim.`

  // CTA primário: flag → quiz completo; senão busca por nível / loja (nunca quebra)
  const hrefPrimario = QUIZ_COMPLETO
    ? "/quiz"
    : st.concluido
    ? `/search?q=${encodeURIComponent("fralda " + nivel.rotulo)}`
    : "/store"

  const perguntaAtual = PERGUNTAS[st.passo]

  return (
    <section
      aria-label="Escolha guiada de produtos"
      className="bg-copamar-cream text-copamar-primary"
    >
      {/* ───── 1) BARRA DE TOPO estática ───── */}
      <div className="w-full border-b border-copamar-sand/70 bg-copamar-cream-deep">
        <div className="content-container py-2">
          <p className="hidden text-center text-xs text-copamar-primary/80 small:block">
            Nota {RATING} em {COUNT} avaliações · 20 anos cuidando de famílias ·{" "}
            <span className="text-copamar-success">Frete grátis acima de R$50</span>{" "}
            · Embalagem 100% discreta
          </p>
          <p className="text-center text-xs text-copamar-primary/80 small:hidden">
            {RATING} ★ · 20 anos · entrega 100% discreta
          </p>
        </div>
      </div>

      {/* ───── 2/3) HERO ───── */}
      <div className="content-container grid grid-cols-1 gap-8 py-8 small:grid-cols-[48fr_52fr] small:items-start small:gap-12 small:py-14">
        {/* ── COLUNA ESQUERDA: a conversa ── */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-copamar-primary/60">
            Loja especializada há 20 anos · todas as marcas num lugar só
          </p>

          {/* beat de respiro — aparece sozinho primeiro */}
          <motion.p
            initial={reduzir ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-serif text-lg italic text-copamar-primary/80"
          >
            Cuidar de alguém tem dias difíceis. A gente fica do seu lado.
          </motion.p>

          {/* H1 — texto REAL (SSR), LCP cai aqui */}
          <h1 className="font-serif text-3xl font-medium leading-tight text-copamar-primary small:text-4xl">
            Pra quem você está cuidando hoje?
          </h1>

          <p className="max-w-prose text-sm leading-relaxed text-copamar-text">
            Responda três perguntas no seu tempo. A gente cruza as marcas — TENA,
            Abena, Biofral, DryMan e mais — e aponta o que faz sentido. Sem
            pressão, sem cadastro. Não existe resposta errada.
          </p>

          {/* QUIZ-no-hero: perguntas reveladas uma a uma */}
          <div className="mt-2 flex items-center gap-3">
            <PetalasBussola preenchidas={respondidas} />
            <span className="text-xs text-copamar-primary/60">
              {respondidas}/3 — no seu tempo
            </span>
          </div>

          {!st.concluido && (
            <AnimatePresence mode="wait">
              <motion.div
                key={perguntaAtual.campo}
                initial={reduzir ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? { opacity: 0 } : { opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="rounded-large border border-copamar-sand bg-white/60 p-4"
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
                        onClick={() =>
                          responder(perguntaAtual.campo, op.valor)
                        }
                        onMouseEnter={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                        onMouseLeave={() => setTiltDir(0)}
                        onFocus={() => setTiltDir(i % 2 === 0 ? -4 : 4)}
                        onBlur={() => setTiltDir(0)}
                        aria-pressed={ativo}
                        className={`min-h-[56px] rounded-rounded border px-4 py-2 text-sm font-medium transition-colors small:min-h-0 ${
                          ativo
                            ? "border-copamar-cta bg-copamar-cta/10 text-copamar-cta"
                            : "border-copamar-sand bg-white text-copamar-primary hover:border-copamar-primary/40"
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

          {/* CTAs sempre visíveis */}
          <div className="mt-2 flex flex-col gap-2">
            <LocalizedClientLink
              href={hrefPrimario}
              className="inline-flex h-12 items-center justify-center rounded-rounded bg-copamar-cta px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-copamar-cta-dark"
              data-testid="hero-cta-primario"
            >
              Me ajude a escolher
            </LocalizedClientLink>
            <a
              href={WA}
              target="_blank"
              rel="noopener"
              className="text-center text-sm text-copamar-primary/70 underline underline-offset-2 hover:text-copamar-primary"
            >
              Prefiro falar com gente · WhatsApp
            </a>
          </div>

          {/* linha de confiança */}
          <p className="mt-1 text-xs text-copamar-primary/50">
            Distribuidora oficial · nota fiscal em toda compra · embalagem
            discreta · a gente confere com você antes de fechar.
          </p>
        </div>

        {/* ── COLUNA DIREITA: o palco ── */}
        <div
          className={`flex flex-col gap-4 transition-opacity duration-500 ${
            comecou ? "opacity-100" : "opacity-90"
          }`}
        >
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 small:gap-5">
            <Palco360
              basePath={nivelView.produto.spin360}
              poster={nivelView.produto.poster}
              alt={`${nivelView.produto.titulo} — ${nivelView.produto.marca}`}
              tilt={tiltDir}
            />
            {/* régua vertical no desktop */}
            <div className="hidden small:block">
              <ReguaGotas
                niveis={NIVEIS}
                ativoIndex={nivelIndex}
                onSelect={setNivelManual}
                orientacao="vertical"
              />
            </div>
          </div>

          <p className="text-center text-[11px] text-copamar-primary/50">
            Arraste para girar
          </p>

          {/* régua horizontal no mobile */}
          <div className="small:hidden">
            <ReguaGotas
              niveis={NIVEIS}
              ativoIndex={nivelIndex}
              onSelect={setNivelManual}
              orientacao="horizontal"
            />
          </div>

          {/* frase viva (aria-live) */}
          <p
            aria-live="polite"
            className="min-h-[2.5rem] rounded-large bg-white/60 px-4 py-3 text-center text-sm text-copamar-text"
          >
            {fraseViva}
          </p>

          {/* card de resultado calmo */}
          <AnimatePresence>
            {st.concluido && (
              <motion.div
                initial={reduzir ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-large border border-copamar-sand bg-white p-4 shadow-sm"
                data-testid="hero-resultado"
              >
                <p className="text-xs uppercase tracking-wide text-copamar-primary/50">
                  Faz sentido começar por
                </p>
                <p className="mt-1 font-serif text-lg text-copamar-primary">
                  {nivel.produto.titulo}{" "}
                  <span className="text-sm font-normal text-copamar-primary/60">
                    · {nivel.produto.marca}
                  </span>
                </p>
                <p className="mt-1 text-sm text-copamar-text">
                  Por que esse: {nivel.porque}.
                </p>
                {/* marcas do nível acendendo */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {nivel.marcas.map((m, i) => (
                    <motion.span
                      key={m}
                      initial={reduzir ? false : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: reduzir ? 0 : 0.1 + i * 0.08 }}
                      className="rounded-circle border border-copamar-sand bg-copamar-cream px-2.5 py-0.5 text-xs font-medium text-copamar-primary"
                    >
                      {m}
                    </motion.span>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 small:flex-row">
                  <LocalizedClientLink
                    href={`/products/${nivel.produto.handle}`}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-rounded bg-copamar-cta px-4 text-sm font-semibold text-white hover:bg-copamar-cta-dark"
                  >
                    Ver opções
                  </LocalizedClientLink>
                  <a
                    href={WA}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-rounded border border-copamar-primary/30 px-4 text-sm font-medium text-copamar-primary hover:border-copamar-primary"
                  >
                    Ainda em dúvida? Fale com a gente
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ───── CTA STICKY (mobile) ───── */}
      <div className="sticky bottom-0 z-40 border-t border-copamar-sand bg-copamar-cream/95 px-4 py-3 backdrop-blur small:hidden">
        <div className="flex items-center gap-2">
          <LocalizedClientLink
            href={hrefPrimario}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-rounded bg-copamar-cta text-base font-semibold text-white"
          >
            Me ajude a escolher
          </LocalizedClientLink>
          <a
            href={WA}
            target="_blank"
            rel="noopener"
            aria-label="Falar no WhatsApp"
            className="inline-flex h-12 w-12 items-center justify-center rounded-rounded border border-copamar-success text-copamar-success"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.207zm5.392-.007" />
            </svg>
          </a>
        </div>
        <LocalizedClientLink
          href="/store"
          className="mt-1.5 block text-center text-xs text-copamar-primary/60 underline underline-offset-2"
        >
          Pular e ver os mais vendidos
        </LocalizedClientLink>
      </div>
    </section>
  )
}
