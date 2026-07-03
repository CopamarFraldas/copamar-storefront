"use client"

/**
 * Fluxo progressivo de endereço por CEP (redesign UX "Quem Disse Berenice",
 * jul/26): os campos de endereço só APARECEM depois de um CEP completo; o que
 * o ViaCEP devolver chega PREENCHIDO e TRAVADO (readOnly — NUNCA `disabled`,
 * porque input disabled sai do FormData do submit nativo e o backend/bling-push
 * perderiam o campo) e o foco pula pro Número, o único editável do endereço.
 *
 * Dois modos:
 *  - "progressivo": endereço NOVO (convidado / carrinho sem endereço / novo
 *    endereço na conta) — revelação + travas.
 *  - "completo": endereço JÁ EXISTENTE (salvo/migrado/selecionado no
 *    AddressSelect) — NÃO passa pelo fluxo progressivo: aparece inteiro e
 *    editável, exatamente como antes (guarda-rail do redesign).
 *
 * Fallbacks obrigatórios:
 *  - CEP genérico/rural (ViaCEP sem logradouro/bairro) → campos vazios e
 *    EDITÁVEIS (não dá pra travar o que não veio);
 *  - CEP inexistente/ViaCEP fora do ar → mensagem amigável + tudo editável;
 *  - link "corrigir CEP" destrava tudo e devolve o foco pro campo de CEP;
 *  - autofill do browser: preencher o CEP dispara onChange no React → o lookup
 *    roda e trava normalmente.
 */

import { useRef, useState } from "react"
import { fetchCep, isValidCep, ViaCepResult } from "@lib/util/viacep"

export type StatusCep =
  | "aguardando" // CEP ainda incompleto
  | "buscando" // fetch ViaCEP em voo (campos já revelados, vazios)
  | "ok" // ViaCEP devolveu logradouro → campos preenchidos e travados
  | "sem_dados" // CEP genérico/rural: sem logradouro/bairro → editáveis
  | "nao_encontrado" // CEP inexistente ou ViaCEP indisponível → manual

export type TravasEndereco = {
  rua: boolean
  bairro: boolean
  cidade: boolean
  uf: boolean
}

const SEM_TRAVAS: TravasEndereco = {
  rua: false,
  bairro: false,
  cidade: false,
  uf: false,
}

export function useCepEndereco({
  completoInicial,
  aplicar,
}: {
  /** endereço já preenchido (salvo/migrado/carrinho) → pula o fluxo progressivo */
  completoInicial: boolean
  /** aplica o resultado do ViaCEP no estado do formulário dono (que mantém o FormData) */
  aplicar: (r: ViaCepResult) => void
}) {
  const [modo, setModo] = useState<"progressivo" | "completo">(
    completoInicial ? "completo" : "progressivo"
  )
  const [revelado, setRevelado] = useState(completoInicial)
  const [status, setStatus] = useState<StatusCep>("aguardando")
  const [travas, setTravas] = useState<TravasEndereco>(SEM_TRAVAS)
  // tick > 0 → EnderecoCampos foca o Número (ou a Rua, se o CEP veio sem rua)
  const [focoTick, setFocoTick] = useState(0)
  const numeroRef = useRef<HTMLInputElement>(null)
  const ruaRef = useRef<HTMLInputElement>(null)
  const cepRef = useRef<HTMLInputElement>(null)
  // guarda de corrida: se o cliente corrigir o CEP no meio do fetch, só a
  // ÚLTIMA busca aplica (senão uma resposta atrasada sobrescreve a certa)
  const buscaId = useRef(0)

  const onCepChange = async (raw: string) => {
    if (!isValidCep(raw)) {
      buscaId.current++ // invalida qualquer busca em voo
      if (modo === "progressivo") {
        // CEP incompleto → recolhe a revelação (o que foi digitado fica no estado)
        setRevelado(false)
        setTravas(SEM_TRAVAS)
        setStatus("aguardando")
      }
      return
    }
    const id = ++buscaId.current
    // Revela JÁ (antes do fetch): se o cliente der Enter durante a busca, os
    // required dos campos revelados seguram o submit — sem isto um submit no
    // meio do fetch mandava endereço vazio pro servidor.
    setRevelado(true)
    setStatus("buscando")
    const r = await fetchCep(raw)
    if (id !== buscaId.current) return
    if (!r) {
      setTravas(SEM_TRAVAS)
      setStatus("nao_encontrado")
      if (modo === "progressivo") setFocoTick((n) => n + 1)
      return
    }
    aplicar(r)
    if (modo === "progressivo") {
      // trava SÓ o que o ViaCEP preencheu; o resto fica editável (CEP genérico)
      setTravas({
        rua: !!r.logradouro,
        bairro: !!r.bairro,
        cidade: !!r.localidade,
        uf: !!r.uf,
      })
      setFocoTick((n) => n + 1)
    }
    setStatus(r.logradouro ? "ok" : "sem_dados")
  }

  /** Endereço salvo carregado/selecionado → forma completa, tudo editável (sem travas). */
  const marcarCompleto = () => {
    // invalida busca em voo: se o cliente digitou um CEP e SELECIONOU um
    // endereço salvo antes da resposta do ViaCEP chegar, a resposta atrasada
    // não pode travar/sobrescrever o endereço recém-selecionado
    buscaId.current++
    setModo("completo")
    setRevelado(true)
    setTravas(SEM_TRAVAS)
    setStatus("aguardando")
  }

  /** Link "corrigir CEP": destrava tudo e devolve o foco pro campo de CEP. */
  const destravar = () => {
    setTravas(SEM_TRAVAS)
    setStatus("aguardando")
    cepRef.current?.focus()
    cepRef.current?.select()
  }

  return {
    modo,
    revelado,
    status,
    travas,
    focoTick,
    numeroRef,
    ruaRef,
    cepRef,
    onCepChange,
    marcarCompleto,
    destravar,
  }
}

export type CepEnderecoControl = ReturnType<typeof useCepEndereco>
