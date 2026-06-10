"use client"

import { entrar } from "../_lib/sessao"
import { useActionState, useState } from "react"

/**
 * Login do app de entregas por PIN (teclado numérico grande, mobile). O PIN é
 * validado no servidor (env ENTREGAS_PIN) — aqui é só a digitação.
 */
export default function PinForm() {
  const [erro, action, pending] = useActionState(entrar, "")
  const [pin, setPin] = useState("")

  const tecla = (n: string) => setPin((p) => (p.length < 6 ? p + n : p))
  const apaga = () => setPin((p) => p.slice(0, -1))

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-7">
      <div className="mb-2 text-5xl" aria-hidden>🚚</div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[#1251b8]">Rota Copamar</h1>
      <p className="mb-8 mt-1 text-sm text-slate-500">Digite seu PIN para entrar</p>

      {/* bolinhas do PIN */}
      <div className="mb-6 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full ${i < pin.length ? "bg-[#1251b8]" : "bg-slate-300"}`}
          />
        ))}
      </div>

      {erro && <p className="mb-4 text-sm font-medium text-rose-600">{erro}</p>}

      {/* teclado numérico */}
      <div className="grid w-full max-w-[280px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => tecla(n)}
            className="aspect-square rounded-2xl bg-white text-2xl font-semibold text-slate-800 shadow-sm active:scale-95 active:bg-slate-100"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={apaga}
          className="aspect-square rounded-2xl text-xl text-slate-500 active:scale-95"
          aria-label="apagar"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => tecla("0")}
          className="aspect-square rounded-2xl bg-white text-2xl font-semibold text-slate-800 shadow-sm active:scale-95 active:bg-slate-100"
        >
          0
        </button>
        <form action={action}>
          <input type="hidden" name="pin" value={pin} />
          <button
            type="submit"
            disabled={pin.length < 4 || pending}
            className="aspect-square w-full rounded-2xl bg-[#1251b8] text-2xl text-white shadow-sm active:scale-95 disabled:opacity-40"
            aria-label="entrar"
          >
            {pending ? "…" : "→"}
          </button>
        </form>
      </div>
    </div>
  )
}
