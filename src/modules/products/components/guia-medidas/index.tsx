"use client"

import { useState } from "react"
import Modal from "@modules/common/components/modal"

export type LinhaMedida = {
  tamanho: string
  /** faixa de cintura/quadril ("73 a 122 cm"); null = descrição não marca */
  medida: string | null
  atual?: boolean
}

/**
 * "Não sabe o tamanho? Veja as medidas" (Pacote G) — link discreto junto ao
 * seletor de tamanhos que abre um modal acessível (padrão da casa, o mesmo
 * Modal do endereço) com a tabela de cintura/quadril por tamanho.
 * As linhas vêm das DESCRIÇÕES reais dos produtos da família (extraídas no
 * servidor pelo TamanhosIrmaos); quando a família não traz medidas, cai na
 * tabela geral aproximada do catálogo — sempre com o aviso de conferir.
 */

// faixas gerais aproximadas — conferidas nas descrições reais do catálogo
// (P = Tena Confort P 56-85 · EG = Biofral EG 110-165; M e G são a faixa
// que cobre as marcas). NÃO inventar: mudou o catálogo, conferir de novo.
const TABELA_GERAL: LinhaMedida[] = [
  { tamanho: "P", medida: "56 a 85 cm" },
  { tamanho: "M", medida: "70 a 115 cm" },
  { tamanho: "G", medida: "90 a 150 cm" },
  { tamanho: "EG", medida: "110 a 165 cm" },
]

export default function GuiaMedidas({
  linhas,
}: {
  /** tamanhos da família com a medida extraída da descrição (ou null);
   *  sem nenhuma medida real = cai na tabela geral */
  linhas?: LinhaMedida[]
}) {
  const [aberto, setAberto] = useState(false)
  const generica = !linhas?.some((l) => l.medida)
  const tabela = generica ? TABELA_GERAL : (linhas as LinhaMedida[])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="w-fit py-1 text-sm text-copamar-primary underline underline-offset-2 transition-colors hover:text-copamar-primary/70"
        data-testid="guia-medidas-link"
      >
        Não sabe o tamanho? Veja as medidas
      </button>

      <Modal
        isOpen={aberto}
        close={() => setAberto(false)}
        size="small"
        data-testid="guia-medidas-modal"
      >
        <Modal.Title>Guia de medidas</Modal.Title>
        <div className="flex flex-col gap-y-4 pt-4 text-left">
          <p className="text-base leading-relaxed text-ui-fg-subtle">
            O tamanho vai pela medida da{" "}
            <strong className="text-ui-fg-base">cintura ou do quadril</strong>,
            não pelo peso. Passe uma fita métrica na altura do quadril (ou
            confira a etiqueta de uma roupa que veste bem) e compare:
          </p>

          <table className="w-full border-collapse text-base">
            <thead>
              <tr className="border-b border-ui-border-base text-sm text-ui-fg-subtle">
                <th className="py-2 pr-4 text-left font-medium">Tamanho</th>
                <th className="py-2 text-left font-medium">
                  Cintura/quadril
                </th>
              </tr>
            </thead>
            <tbody>
              {tabela.map((l) => (
                <tr
                  key={l.tamanho}
                  className={
                    l.atual
                      ? "border-b border-ui-border-base bg-copamar-primary/5 font-semibold text-copamar-primary"
                      : "border-b border-ui-border-base text-ui-fg-base"
                  }
                >
                  <td className="py-2.5 pr-4">
                    {l.tamanho}
                    {l.atual && (
                      <span className="ml-2 text-xs font-medium">
                        (este produto)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    {l.medida ?? (
                      <span className="text-sm text-ui-fg-subtle">
                        veja na descrição do produto
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-sm leading-relaxed text-ui-fg-subtle">
            {generica
              ? "Medidas aproximadas — variam um pouco de marca para marca. Confira a faixa exata na descrição do produto ou chame a gente no WhatsApp que ajudamos a escolher."
              : "Medidas informadas pelo fabricante desta linha. Na dúvida entre dois tamanhos, chame a gente no WhatsApp que ajudamos a escolher."}
          </p>
        </div>
      </Modal>
    </>
  )
}
