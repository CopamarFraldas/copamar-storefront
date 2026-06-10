"use client"

import { importarRota } from "../_lib/importar"
import { useActionState, useState } from "react"

/**
 * Tela do ESCRITÓRIO: sobe a planilha "Dede [dia]" → cruza com o Bling → vira a
 * rota do Dedé no app. Substitui a rota do dia (importar de novo = rota nova).
 */
export default function ImportarForm() {
  const [state, action, pending] = useActionState(importarRota, null as any)
  const [nomeArquivo, setNomeArquivo] = useState("")

  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      <a href="/entregas/rota" className="mb-4 text-sm text-[#1251b8]">← voltar pra rota</a>
      <div className="mb-1 text-4xl" aria-hidden>📋</div>
      <h1 className="text-2xl font-bold text-[#1251b8]">Importar a rota do dia</h1>
      <p className="mt-2 text-sm text-slate-500">
        Suba a planilha do dia (a <strong>“Dede [dia]”</strong>). Eu cruzo os
        pedidos com o Bling e monto a rota do Dedé com nome, endereço e telefone.
      </p>

      <form action={action} className="mt-6 flex flex-col gap-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center active:bg-slate-50">
          <span className="text-3xl" aria-hidden>⬆️</span>
          <span className="mt-2 text-sm font-semibold text-slate-700">
            {nomeArquivo || "Escolher planilha (.xlsx)"}
          </span>
          <input
            type="file"
            name="planilha"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            required
            className="hidden"
            onChange={(e) => setNomeArquivo(e.target.files?.[0]?.name || "")}
          />
        </label>

        <button
          type="submit"
          disabled={pending || !nomeArquivo}
          className="rounded-xl bg-[#1251b8] py-3.5 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-40"
        >
          {pending ? "Importando e cruzando com o Bling…" : "Importar rota"}
        </button>
      </form>

      {state?.ok && (
        <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          {state.ok}
          <a href="/entregas/rota" className="mt-2 block font-semibold text-[#1251b8]">
            Ver a rota do Dedé →
          </a>
        </div>
      )}
      {state?.erro && (
        <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {state.erro}
        </p>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Importar de novo no mesmo dia substitui a rota (use de manhã, antes da saída).
      </p>
    </div>
  )
}
