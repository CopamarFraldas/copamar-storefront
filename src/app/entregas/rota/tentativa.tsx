"use client"

import { registrarTentativa } from "../_lib/acoes"
import { comprimeFoto } from "../_lib/foto"
import { useEffect, useState } from "react"
import type { Parada } from "../_lib/dados"
import CameraCaptura from "./camera"

/**
 * Registro de TENTATIVA de entrega — "ninguém em casa" (Marco 11/06): foto da
 * FRENTE DA CASA + GPS + hora. A foto vai pro CLIENTE no WhatsApp como prova de
 * que passamos lá (e o aviso deixa isso claro pro Dedé caprichar). Sem foto dá
 * pra confirmar também (chuva, portaria) — mas o caminho principal é com foto.
 */
export default function TentativaEntrega({
  parada,
  onFeito,
  onCancelar,
}: {
  parada: Parada
  onFeito: (gps: { lat: number; long: number } | null) => void
  onCancelar: () => void
}) {
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [gps, setGps] = useState<{ lat: number; long: number } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  // câmera in-browser (não salva no celular — "falta memória" 11/06);
  // se falhar, cai no input file (galeria/app de câmera)
  const [cameraAberta, setCameraAberta] = useState(false)
  const [usarInputFile, setUsarInputFile] = useState(false)

  // GPS ao abrir (best-effort)
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
    if (gps) {
      fd.set("gps_lat", String(gps.lat))
      fd.set("gps_long", String(gps.long))
    }
    if (foto) fd.set("foto", foto)
    try {
      const r = await registrarTentativa(fd)
      if (r.ok) onFeito(gps)
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
    <div className="mt-3 rounded-xl border border-amber-400/50 bg-amber-50/70 p-3">
      <p className="text-center text-sm font-bold text-amber-800">
        Ninguém em casa 🚪
      </p>
      <p className="mt-1 rounded-lg bg-amber-100 px-2 py-1.5 text-center text-xs font-semibold text-amber-900">
        📸 Esta foto vai <u>pro CLIENTE</u> no WhatsApp — tire da{" "}
        <strong>frente da casa</strong> pra ele ver que você passou.
        <span className="block font-normal">Sem pessoas na foto, por favor.</span>
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
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-white py-4 active:bg-amber-50">
          {preview ? (
            <img src={preview} alt="frente da casa" className="h-28 rounded-lg object-cover" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="mt-1 text-xs font-semibold text-slate-600">
                Tirar foto da frente da casa
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
          className="mt-2 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-white py-4 active:bg-amber-50"
        >
          {preview ? (
            <img src={preview} alt="frente da casa" className="h-28 rounded-lg object-cover" />
          ) : (
            <>
              <span className="text-3xl" aria-hidden>📷</span>
              <span className="mt-1 text-xs font-semibold text-slate-600">
                Tirar foto da frente da casa
              </span>
              <span className="text-[10px] text-slate-400">(não gasta a memória do celular)</span>
            </>
          )}
        </button>
      )}

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
          disabled={salvando || !foto}
          className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Confirmar ✓"}
        </button>
      </div>
      {!foto && !salvando && (
        <button
          onClick={confirmar}
          className="mt-2 w-full text-center text-[11px] text-slate-400 underline underline-offset-2"
        >
          não dá pra fotografar — confirmar sem foto
        </button>
      )}
    </div>
  )
}
