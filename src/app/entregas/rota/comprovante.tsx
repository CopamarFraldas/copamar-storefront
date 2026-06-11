"use client"

import { registrarEntrega } from "../_lib/acoes"
import { comprimeFoto } from "../_lib/foto"
import { useEffect, useState } from "react"
import type { Parada } from "../_lib/dados"
import CameraCaptura from "./camera"

/**
 * Comprovante de entrega (Fase 2, Marco 10/06): foto da entrega + nome/CPF de
 * quem recebeu + GPS + hora. É o "seguro" contra chargeback. Tudo best-effort —
 * o Dedé confirma com o que conseguir capturar.
 */
function mascaraCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export default function ComprovanteEntrega({
  parada,
  onFeito,
  onCancelar,
}: {
  parada: Parada
  onFeito: () => void
  onCancelar: () => void
}) {
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [gps, setGps] = useState<{ lat: number; long: number } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  // câmera in-browser (não salva no celular — "falta memória" 11/06)
  const [cameraAberta, setCameraAberta] = useState(false)
  const [usarInputFile, setUsarInputFile] = useState(false)

  // captura GPS ao abrir (best-effort — se o cliente negar, segue sem)
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setGps({ lat: p.coords.latitude, long: p.coords.longitude }),
      () => {},
      { timeout: 8000, enableHighAccuracy: true }
    )
  }, [])

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const c = await comprimeFoto(f) // 10MB da câmera → ~300KB (4G de rua)
      setFoto(c)
      setPreview(URL.createObjectURL(c))
    }
  }

  const confirmar = async () => {
    setSalvando(true)
    setErro("")
    const fd = new FormData()
    fd.set("numero_pedido", parada.numero_pedido)
    fd.set("celular", parada.celular || "")
    fd.set("nome_cliente", parada.nome_cliente || "")
    fd.set("recebedor_nome", nome)
    fd.set("recebedor_cpf", cpf)
    if (gps) {
      fd.set("gps_lat", String(gps.lat))
      fd.set("gps_long", String(gps.long))
    }
    if (foto) fd.set("foto", foto)
    try {
      const r = await registrarEntrega(fd)
      if (r.ok) onFeito()
      else {
        setErro(r.erro || "Não consegui salvar — tente de novo.")
        setSalvando(false)
      }
    } catch {
      setErro("Não consegui salvar — tente de novo.")
      setSalvando(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-[#22c55e]/40 bg-emerald-50/60 p-3">
      <p className="text-center text-sm font-bold text-emerald-800">
        Comprovante de entrega ✅
      </p>

      {/* foto pela câmera in-browser (não gasta armazenamento do celular) */}
      {cameraAberta && (
        <CameraCaptura
          onFoto={(f) => {
            setFoto(f)
            setPreview(URL.createObjectURL(f))
            setCameraAberta(false)
          }}
          onCancelar={() => setCameraAberta(false)}
          onFalha={() => {
            setCameraAberta(false)
            setUsarInputFile(true)
          }}
        />
      )}
      {usarInputFile ? (
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-white py-4 active:bg-emerald-50">
          {preview ? (
            <img src={preview} alt="comprovante" className="h-28 rounded-lg object-cover" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="mt-1 text-xs font-semibold text-slate-600">
                Tirar foto da entrega
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={escolherFoto}
            className="hidden"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setCameraAberta(true)}
          className="mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-white py-4 active:bg-emerald-50"
        >
          {preview ? (
            <img src={preview} alt="comprovante" className="h-28 rounded-lg object-cover" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="mt-1 text-xs font-semibold text-slate-600">
                Tirar foto da entrega
              </span>
              <span className="text-[10px] text-slate-400">(não gasta a memória do celular)</span>
            </>
          )}
        </button>
      )}

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome de quem recebeu"
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]"
      />
      <input
        value={cpf}
        onChange={(e) => setCpf(mascaraCpf(e.target.value))}
        inputMode="numeric"
        placeholder="CPF de quem recebeu (opcional)"
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#22c55e]"
      />

      <p className="mt-2 text-center text-[11px] text-slate-400">
        {gps ? "📍 Localização registrada" : "📍 registrando localização…"} · 🕐 hora automática
      </p>
      {erro && <p className="mt-1 text-center text-xs font-medium text-rose-600">{erro}</p>}

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-xl bg-white py-3 text-sm font-semibold text-slate-500 active:scale-[0.98] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={salvando}
          className="rounded-xl bg-[#22c55e] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Confirmar entrega ✓"}
        </button>
      </div>
    </div>
  )
}
