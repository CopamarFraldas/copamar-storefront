"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Câmera IN-BROWSER (getUserMedia) — incidente "falta memória" 11/06: o input
 * capture abre o app de câmera do Android, que SALVA a foto no armazenamento
 * antes de entregar; celular cheio = erro. Aqui o frame vai do sensor direto
 * pro canvas (1600px, JPEG ~300KB) sem tocar o disco do celular.
 * Se a câmera falhar (permissão/indisponível), chama onFalha() — o card cai
 * no input file antigo como plano B.
 */
export default function CameraCaptura({
  onFoto,
  onCancelar,
  onFalha,
}: {
  onFoto: (f: File) => void
  onCancelar: () => void
  onFalha: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [pronta, setPronta] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1600 }, height: { ideal: 1200 } },
          audio: false,
        })
        if (!vivo) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setPronta(true)
      } catch {
        onFalha() // sem câmera/permissão → plano B (input file)
      }
    })()
    return () => {
      vivo = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capturar = async () => {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement("canvas")
    const maxLado = 1600
    const escala = Math.min(1, maxLado / Math.max(v.videoWidth, v.videoHeight))
    canvas.width = Math.round(v.videoWidth * escala)
    canvas.height = Math.round(v.videoHeight * escala)
    canvas.getContext("2d")!.drawImage(v, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.8))
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (blob) onFoto(new File([blob], "foto.jpg", { type: "image/jpeg" }))
    else onFalha()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* preview ao vivo */}
      <video ref={videoRef} playsInline muted className="min-h-0 flex-1 object-contain" />
      {!pronta && (
        <p className="absolute inset-x-0 top-1/2 text-center text-sm text-white/80">
          abrindo a câmera…
        </p>
      )}
      <div className="flex items-center justify-around bg-black/90 px-6 pb-8 pt-4">
        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop())
            onCancelar()
          }}
          className="text-sm font-semibold text-white/80"
        >
          Cancelar
        </button>
        <button
          onClick={capturar}
          disabled={!pronta}
          aria-label="Tirar foto"
          className="h-16 w-16 rounded-full border-4 border-white bg-white/30 active:scale-95 disabled:opacity-40"
        />
        <span className="w-14" />
      </div>
    </div>
  )
}
