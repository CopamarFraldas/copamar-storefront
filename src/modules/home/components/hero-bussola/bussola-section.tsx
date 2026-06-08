"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import HeroBussola from "./index"

/**
 * Convite à Bússola na home (Opção C, painel multi-agente 08/06): o hero é um
 * "cartão de visitas" (server-rendered, acima); LOGO ABAIXO entra este convite
 * acolhedor com um BOTÃO chamativo "Me ajude a escolher". Ao tocar, a Bússola
 * (quiz) EXPANDE inline (sem pop-up, sem sair da página) e rola até ela.
 *
 * Serve os dois visitantes: quem já decidiu / é atacado ignora e segue pra
 * busca/produtos; quem está perdido encontra a ajuda num clique. O quiz só
 * monta quando aberto (mais leve no carregamento da home).
 */
export default function BussolaSection() {
  const reduzir = !!useReducedMotion()
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const abrir = () => {
    setAberto(true)
    // rola suavemente até o quiz depois de montar
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: reduzir ? "auto" : "smooth",
        block: "start",
      })
    }, 80)
  }

  return (
    <section ref={ref} aria-label="Ajuda pra escolher o produto certo" className="content-container py-6">
      {/* convite (sempre visível) */}
      <div className="overflow-hidden rounded-large border border-copamar-primary/15 bg-gradient-to-br from-[#eaf1fc] to-white shadow-[0_4px_24px_rgba(18,81,184,0.07)]">
        <div className="flex flex-col items-center gap-4 px-5 py-6 text-center small:flex-row small:justify-between small:gap-6 small:px-8 small:py-7 small:text-left">
          <div className="flex items-start gap-3">
            {/* bússola */}
            <span className="mt-0.5 shrink-0 text-3xl" aria-hidden>
              🧭
            </span>
            <div>
              <p className="font-serif text-lg font-semibold text-copamar-primary small:text-xl">
                Não sabe qual escolher? A gente acha junto.
              </p>
              <p className="mt-1 text-sm text-copamar-text">
                Responda algumas perguntas no seu tempo — a gente cruza TENA,
                Abena, Biofral, DryMan e mais e aponta o que faz sentido. Não
                sabe o tamanho? A gente acha junto.
              </p>
            </div>
          </div>
          {!aberto && (
            <button
              type="button"
              onClick={abrir}
              data-testid="abrir-bussola"
              className="group inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-circle bg-copamar-primary px-7 text-base font-semibold text-white shadow-[0_6px_18px_rgba(18,81,184,0.3)] transition-all hover:bg-copamar-primary-dark hover:shadow-[0_8px_22px_rgba(18,81,184,0.4)] small:w-auto"
            >
              Me ajude a escolher
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
        {/* microcopy de baixa fricção */}
        {!aberto && (
          <p className="border-t border-copamar-primary/10 px-5 py-2 text-center text-xs text-copamar-primary/55 small:px-8">
            Leva 1 minuto · sem cadastro · sem compromisso
          </p>
        )}
      </div>

      {/* a Bússola expande aqui (monta só quando abre) */}
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={reduzir ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduzir ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mt-4 overflow-hidden rounded-large border border-copamar-primary/10"
          >
            <HeroBussola embed />
            <div className="bg-white px-4 py-3 text-center">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-xs text-copamar-primary/55 underline underline-offset-2 hover:text-copamar-primary"
              >
                Fechar a ajuda
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
