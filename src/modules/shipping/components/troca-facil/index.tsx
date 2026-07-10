"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import Modal from "@modules/common/components/modal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Selo "Errou o tamanho? A gente troca! 🚚" — PDP, junto do bloco de frete.
 * Texto APROVADO pelo Marco (v2, 10/07) — não alterar a essência:
 *
 *   "Errou o tamanho? A gente troca! 🚚
 *    Na nossa região de entrega própria (São Paulo e Grande ABC), nosso
 *    entregador leva o tamanho certo e recolhe o pacote — na mesma visita,
 *    sem custo.
 *    Válido para pacotes fechados e lacrados, em até 7 dias após a entrega."
 *
 * REGRAS (espelham o ChegaAmanha, que mora logo acima do FreteCep):
 * - fonte do CEP = a MESMA do FreteCep: localStorage "copamar_cep"; re-consulta
 *   ao trocar o CEP (evento "copamar:cep" na mesma aba + "storage" entre abas).
 * - só existe o POSITIVO: sem CEP / fora da região / falha da API → silêncio
 *   total (nunca "aqui não trocamos"). Quem decide é o servidor, consultando
 *   as faixas reais de `fretes_ceps` via /api/regiao-propria.
 * - clique no selo → modal acessível (Dialog do Headless UI: foco preso, ESC
 *   fecha) com o texto completo + link pra política de trocas.
 */

const CEP_KEY = "copamar_cep" // mesma chave do FreteCep — fonte única do CEP

export default function TrocaFacil({ className = "" }: { className?: string }) {
  const [elegivel, setElegivel] = useState(false)
  const [aberto, setAberto] = useState(false)
  const cepRef = useRef("") // último CEP consultado
  const okRef = useRef(false) // última consulta desse CEP deu certo?
  const reqRef = useRef(0) // descarta resposta atrasada de consulta antiga

  const consultar = useCallback(async () => {
    let cep = ""
    try {
      cep = (localStorage.getItem(CEP_KEY) || "").replace(/\D/g, "")
    } catch {
      /* sem storage */
    }
    if (cep.length !== 8) {
      // sem CEP conhecido → sem selo (o widget de CEP convida a preencher)
      cepRef.current = ""
      okRef.current = false
      setElegivel(false)
      return
    }
    // mesmo CEP já respondido com sucesso → veredito não muda, poupa a rede
    if (cep === cepRef.current && okRef.current) return
    cepRef.current = cep
    okRef.current = false
    const id = ++reqRef.current
    try {
      const r = await fetch(`/api/regiao-propria?cep=${cep}`)
      const d = r.ok ? await r.json() : null
      if (id === reqRef.current) {
        okRef.current = r.ok
        setElegivel(d?.regiao_propria === true)
      }
    } catch {
      if (id === reqRef.current) setElegivel(false) // falha da API → silêncio
    }
  }, [])

  useEffect(() => {
    consultar()
    // CEP trocou na MESMA aba (FreteCep avisa) ou em OUTRA aba (storage)
    const onCep = () => consultar()
    const onStorage = (e: StorageEvent) => {
      if (e.key === CEP_KEY) consultar()
    }
    window.addEventListener("copamar:cep", onCep)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("copamar:cep", onCep)
      window.removeEventListener("storage", onStorage)
    }
  }, [consultar])

  if (!elegivel) return null

  const fechar = () => setAberto(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        data-testid="troca-facil"
        className={`flex w-full items-start gap-x-3 rounded-large border border-ui-border-base bg-ui-bg-subtle px-4 py-3 text-left transition hover:border-copamar-primary/50 focus:outline-none focus:ring-2 focus:ring-copamar-primary/40 ${className}`}
      >
        <span aria-hidden className="pt-0.5 text-xl leading-none">
          🚚
        </span>
        <span className="flex flex-col gap-y-0.5">
          <span className="text-sm font-bold text-ui-fg-base">
            Errou o tamanho? A gente troca!
          </span>
          <span className="text-xs leading-relaxed text-ui-fg-subtle">
            Seu CEP está na nossa região de entrega própria.{" "}
            <span className="font-semibold text-copamar-primary underline">
              Saiba como funciona
            </span>
          </span>
        </span>
      </button>

      <Modal isOpen={aberto} close={fechar} size="small" data-testid="troca-facil-modal">
        <Modal.Title>
          <span>
            Errou o tamanho? A gente troca!{" "}
            <span aria-hidden>🚚</span>
          </span>
        </Modal.Title>
        <div className="flex flex-col gap-y-3 pt-3 text-sm leading-relaxed text-ui-fg-base">
          <p>
            Na nossa região de entrega própria (São Paulo e Grande ABC), nosso
            entregador leva o tamanho certo e recolhe o pacote —{" "}
            <strong>na mesma visita, sem custo</strong>.
          </p>
          <p>
            Válido para <strong>pacotes fechados e lacrados</strong>, em até{" "}
            <strong>7 dias após a entrega</strong>.
          </p>
          <p className="pt-1">
            <LocalizedClientLink
              href="/trocas-e-devolucoes"
              onClick={fechar}
              className="font-semibold text-copamar-primary underline"
            >
              Ver política de trocas
            </LocalizedClientLink>
          </p>
        </div>
      </Modal>
    </>
  )
}
